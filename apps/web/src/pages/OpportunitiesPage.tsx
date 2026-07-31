import { DragEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KanbanSquare, List, LoaderCircle } from 'lucide-react';
import { api } from '../api/client';
import { Entity, EntityPage } from '../components/EntityPage';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0,
});

interface Stage extends Entity {
  name: string;
  probability: number;
}

interface Opportunity extends Entity {
  name: string;
  estimatedValue: number;
  probability: number;
  status: string;
  pipelineStageId: string;
  customer: { name: string };
  pipelineStage: { name: string };
}

export function OpportunitiesPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const opportunities = useQuery({
    queryKey: ['/opportunities'],
    queryFn: () => api<Opportunity[]>('/opportunities'),
  });
  const stages = useQuery({
    queryKey: ['/opportunities/stages'],
    queryFn: () => api<Stage[]>('/opportunities/stages'),
  });

  const move = useMutation({
    mutationFn: ({ id, pipelineStageId, probability }: { id: string; pipelineStageId: string; probability: number }) =>
      api(`/opportunities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pipelineStageId, probability }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['/opportunities'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDraggingId(null);
    },
  });

  const onDrop = (event: DragEvent<HTMLDivElement>, stage: Stage) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/opportunity-id');
    if (!id) return;
    move.mutate({ id, pipelineStageId: stage.id, probability: stage.probability });
  };

  const renderViewSwitcher = () => (
    <div className="view-switcher" role="group" aria-label="Vista de oportunidades">
      <button
        className={view === 'table' ? 'active' : ''}
        onClick={() => setView('table')}
        type="button"
      >
        <List size={17} /> Tabla
      </button>
      <button
        className={view === 'kanban' ? 'active' : ''}
        onClick={() => setView('kanban')}
        type="button"
      >
        <KanbanSquare size={17} /> Kanban
      </button>
    </div>
  );

  return (
    <>
      {view === 'table' ? (
        <EntityPage
          headerActions={renderViewSwitcher()}
          columns={[
            {
              label: 'Oportunidad',
              exportValue: (item) => String(item.name),
              render: (item) => (
                <span className="primary-cell">
                  <strong>{String(item.name)}</strong>
                  <small>{String((item.customer as Entity)?.name ?? '—')}</small>
                </span>
              ),
            },
            {
              label: 'Etapa',
              exportValue: (item) => String((item.pipelineStage as Entity)?.name ?? ''),
              render: (item) => (
                <span className="status-badge blue">
                  {String((item.pipelineStage as Entity)?.name ?? '—')}
                </span>
              ),
            },
            {
              label: 'Valor',
              exportValue: (item) => Number(item.estimatedValue ?? 0),
              render: (item) => money.format(Number(item.estimatedValue ?? 0)),
            },
            {
              label: 'Probabilidad',
              exportValue: (item) => Number(item.probability ?? 0),
              render: (item) => `${Number(item.probability ?? 0)}%`,
            },
            {
              label: 'Estado',
              exportValue: (item) => String(item.status),
              render: (item) => <span className="status-badge">{String(item.status)}</span>,
            },
          ]}
          description="Administra el pipeline y concentra el esfuerzo en los negocios con mayor potencial."
          endpoint="/opportunities"
          fields={[
            { name: 'name', label: 'Nombre', required: true },
            {
              name: 'customerId',
              label: 'Cliente',
              type: 'select',
              required: true,
              optionsEndpoint: '/customers',
              optionLabel: (item) => String(item.name),
            },
            {
              name: 'pipelineStageId',
              label: 'Etapa',
              type: 'select',
              required: true,
              optionsEndpoint: '/opportunities/stages',
              optionLabel: (item) => String(item.name),
            },
            { name: 'estimatedValue', label: 'Valor estimado', type: 'number', required: true },
            { name: 'probability', label: 'Probabilidad (%)', type: 'number', defaultValue: 10 },
            { name: 'expectedCloseDate', label: 'Fecha estimada de cierre', type: 'date' },
            {
              name: 'status',
              label: 'Estado',
              type: 'select',
              options: [
                { value: 'OPEN', label: 'Abierta' },
                { value: 'WON', label: 'Ganada' },
                { value: 'LOST', label: 'Perdida' },
              ],
            },
            { name: 'description', label: 'Descripción', type: 'textarea' },
          ]}
          singular="oportunidad"
          title="Oportunidades"
        />
      ) : (
        <section className="page kanban-page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Pipeline visual</p>
              <h1>Kanban de oportunidades</h1>
              <p>Arrastra cada negocio entre etapas para mantener actualizado el embudo comercial.</p>
            </div>
            {move.isPending && <span className="record-count"><LoaderCircle className="spin" size={16} /> Actualizando</span>}
          </div>

          {opportunities.isLoading || stages.isLoading ? (
            <div className="board-skeleton">Cargando pipeline…</div>
          ) : (
            <div className="kanban-board">
              {stages.data?.map((stage) => {
                const items = opportunities.data?.filter((item) => item.pipelineStageId === stage.id) ?? [];
                const total = items.reduce((sum, item) => sum + Number(item.estimatedValue), 0);
                return (
                  <div
                    className="kanban-column"
                    key={stage.id}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDrop(event, stage)}
                  >
                    <header>
                      <div>
                        <strong>{stage.name}</strong>
                        <small>{items.length} oportunidades</small>
                      </div>
                      <span>{money.format(total)}</span>
                    </header>
                    <div className="kanban-stack">
                      {items.length ? items.map((item) => (
                        <article
                          className={draggingId === item.id ? 'kanban-card dragging' : 'kanban-card'}
                          draggable
                          key={item.id}
                          onDragEnd={() => setDraggingId(null)}
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/opportunity-id', item.id);
                            event.dataTransfer.effectAllowed = 'move';
                            setDraggingId(item.id);
                          }}
                        >
                          <span className="status-badge blue">{item.probability}%</span>
                          <strong>{item.name}</strong>
                          <small>{item.customer.name}</small>
                          <b>{money.format(Number(item.estimatedValue))}</b>
                        </article>
                      )) : <div className="kanban-empty">Suelta aquí una oportunidad</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
