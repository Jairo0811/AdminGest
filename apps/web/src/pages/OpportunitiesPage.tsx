import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Target } from 'lucide-react';
import { Modal } from '../components/Modal';
import { api, formatCurrency } from '../lib/api';
import { Paginated } from '../types';

interface Stage {
  id: string;
  name: string;
  position: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

interface CustomerOption {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  name: string;
  estimatedValue: string | number;
  probability: number;
  expectedCloseDate?: string;
  status: string;
  pipelineStageId: string;
  customer: CustomerOption;
  pipelineStage: Stage;
}

export function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const opportunities = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => api<Paginated<Opportunity>>('/opportunities?pageSize=100'),
  });
  const stages = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: () => api<Stage[]>('/opportunities/stages'),
  });
  const customers = useQuery({
    queryKey: ['customer-options'],
    queryFn: () => api<Paginated<CustomerOption>>('/customers?pageSize=100&status=ACTIVE'),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/opportunities', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setShowForm(false);
      refresh();
    },
    onError: (reason: Error) => setError(reason.message),
  });
  const move = useMutation({
    mutationFn: ({ opportunity, stage }: { opportunity: Opportunity; stage: Stage }) =>
      api(`/opportunities/${opportunity.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          pipelineStageId: stage.id,
          probability: stage.probability,
          status: stage.isWon ? 'WON' : stage.isLost ? 'LOST' : 'OPEN',
          ...(stage.isLost ? { lostReason: 'Actualizado desde el pipeline' } : {}),
        }),
      }),
    onSuccess: refresh,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const selectedStage = stages.data?.find((stage) => stage.id === values.pipelineStageId);
    create.mutate({
      customerId: values.customerId,
      pipelineStageId: values.pipelineStageId,
      name: values.name,
      description: values.description || undefined,
      estimatedValue: Number(values.estimatedValue),
      probability: selectedStage?.probability ?? 0,
      expectedCloseDate: values.expectedCloseDate
        ? new Date(`${values.expectedCloseDate}T12:00:00`).toISOString()
        : undefined,
    });
  }

  if (opportunities.isPending || stages.isPending) {
    return <div className="loading-card">Construyendo el pipeline…</div>;
  }
  if (opportunities.isError || stages.isError) {
    return <div className="error-card">{opportunities.error?.message ?? stages.error?.message}</div>;
  }

  return (
    <div className="page-stack">
      <section className="page-toolbar">
        <div className="toolbar-summary">
          <Target size={20} />
          <span>{opportunities.data.meta.total} oportunidades en el pipeline</span>
        </div>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nueva oportunidad
        </button>
      </section>

      <section className="kanban-board" aria-label="Pipeline de oportunidades">
        {stages.data.map((stage) => {
          const stageItems = opportunities.data.data.filter((item) => item.pipelineStageId === stage.id);
          const value = stageItems.reduce((sum, item) => sum + Number(item.estimatedValue), 0);
          return (
            <article className="kanban-column" key={stage.id}>
              <header>
                <div><span className="stage-dot" /><strong>{stage.name}</strong><small>{stageItems.length}</small></div>
                <span>{formatCurrency(value)}</span>
              </header>
              <div className="kanban-cards">
                {stageItems.map((opportunity) => (
                  <div className="opportunity-card" key={opportunity.id}>
                    <p>{opportunity.customer.name}</p>
                    <h3>{opportunity.name}</h3>
                    <strong>{formatCurrency(opportunity.estimatedValue)}</strong>
                    <div className="opportunity-card-foot">
                      <span>{opportunity.probability}%</span>
                      {opportunity.expectedCloseDate && (
                        <span><Calendar size={14} /> {new Date(opportunity.expectedCloseDate).toLocaleDateString('es-DO')}</span>
                      )}
                    </div>
                    <select
                      className="card-stage-select"
                      value={opportunity.pipelineStageId}
                      onChange={(event) => {
                        const next = stages.data.find((item) => item.id === event.target.value);
                        if (next) move.mutate({ opportunity, stage: next });
                      }}
                    >
                      {stages.data.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                ))}
                {stageItems.length === 0 && <div className="kanban-empty">Sin oportunidades</div>}
              </div>
            </article>
          );
        })}
      </section>

      {showForm && (
        <Modal title="Nueva oportunidad" onClose={() => setShowForm(false)}>
          <form className="form-grid modal-form" onSubmit={submit}>
            <label className="field field-full"><span>Nombre *</span><input name="name" required minLength={2} /></label>
            <label className="field"><span>Cliente *</span>
              <select name="customerId" required defaultValue="">
                <option value="" disabled>Seleccionar cliente</option>
                {customers.data?.data.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Etapa *</span>
              <select name="pipelineStageId" required defaultValue={stages.data[0]?.id}>
                {stages.data.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Valor estimado *</span><input name="estimatedValue" type="number" min="0" step="0.01" required /></label>
            <label className="field"><span>Cierre esperado</span><input name="expectedCloseDate" type="date" /></label>
            <label className="field field-full"><span>Descripción</span><textarea name="description" rows={3} /></label>
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full">
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" disabled={create.isPending} type="submit">{create.isPending ? 'Guardando…' : 'Crear oportunidad'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
