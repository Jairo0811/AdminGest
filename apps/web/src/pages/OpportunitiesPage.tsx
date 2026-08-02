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

const opportunityFields = [
  { name: 'name', label: 'Nombre', required: true },
  {
    name: 'customerId',
    label: 'Cliente',
    type: 'select' as const,
    required: true,
    optionsEndpoint: '/customers',
    optionLabel: (item: Entity) => String(item.name),
  },
  {
    name: 'pipelineStageId',
    label: 'Etapa',
    type: 'select' as const,
    required: true,
    optionsEndpoint: '/opportunities/stages',
    optionLabel: (item: Entity) => String(item.name),
  },
  { name: 'estimatedValue', label: 'Valor estimado', type: 'number' as const, required: true },
  { name: 'probability', label: 'Probabilidad (%)', type: 'number' as const, defaultValue: 10 },
  { name: 'expectedCloseDate', label: 'Fecha estimada de cierre', type: 'date' as const },
  {
    name: 'status',
    label: 'Estado',
    type: 'select' as const,
    options: [
      { value: 'OPEN', label: 'Abierta' },
      { value: 'WON', label: 'Ganada' },
      { value: 'LOST', label: 'Perdida' },
    ],
  },
  { name: 'description', label: 'Descripción', type: 'textarea' as const },
];

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
      <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} type="button">
        <List size={17} /> Tabla
      </button>
      <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')} type="button">
        <KanbanSquare size={17} /> Kanban
      </button>
    </div>
  );

  const entityPage = (
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
          label: 'Cliente',
          exportValue: (item) => String((item.customer as Entity)?.name ?? '—'),
          render: (item) => String((item.customer as Entity)?.name ?? '—'),
        },
        {
          label: 'Etapa',
          exportValue: (item) => String((item.pipelineStage as Entity)?.name ?? ''),
          render: (item) => (
            <span className="status-badge blue">{String((item.pipelineStage as Entity)?.name ?? '—')}</span>
          ),
        },
        {
          label: 'Valor',
          exportValue: (item) => Number(item.estimatedValue ?? 0),
          exportFormat: 'currency',
          exportAlign: 'right',
          render: (item) => money.format(Number(item.estimatedValue ?? 0)),
        },
        {
          label: 'Probabilidad',
          exportValue: (item) => Number(item.probability ?? 0),
          exportFormat: 'percent',
          exportAlign: 'center',
          render: (item) => `${Number(item.probability ?? 0)}%`,
        },
        {
          label: 'Estado',
          exportValue: (item) => String(item.status),
          exportFormat: 'status',
          render: (item) => <span className="status-badge">{String(item.status)}</span>,
        },
      ]}
      description={view === 'table' ? 'Administra el pipeline y concentra el esfuerzo en los negocios con mayor potencial.' : 'Arrastra cada negocio entre etapas para mantener actualizado el embudo comercial.'}
      endpoint="/opportunities"
      fields={opportunityFields}
      reportMetrics={(items) => {
        const pipeline = items.reduce((sum, item) => sum + Number(item.estimatedValue ?? 0), 0);
        const won = items.filter((item) => item.status === 'WON');
        const wonValue = won.reduce((sum, item) => sum + Number(item.estimatedValue ?? 0), 0);
        const averageProbability = items.length
          ? items.reduce((sum, item) => sum + Number(item.probability ?? 0), 0) / items.length
          : 0;
        return [
          { label: 'Oportunidades', value: items.length, tone: 'blue' },
          { label: 'Pipeline', value: money.format(pipeline), tone: 'blue' },
          { label: 'Ganadas', value: won.length, tone: 'green' },
          { label: 'Valor ganado', value: money.format(wonValue), tone: 'green' },
          { label: 'Probabilidad media', value: `${averageProbability.toFixed(0)}%` },
        ];
      }}
      singular="oportunidad"
      title={view === 'table' ? 'Oportunidades' : 'Kanban de oportunidades'}
    />
  );

  if (view === 'table') return entityPage;

  return (
    <>
      <div className="entity-page-controller-only">{entityPage}</div>
      <section className="page kanban-page custom-view-content">
        {move.isPending && <div className="custom-view-status"><span className="record-count"><LoaderCircle className="spin" size={16} /> Actualizando</span></div>}
        {opportunities.isLoading || stages.isLoading ? (
          <div className="board-skeleton">Cargando pipeline…</div>
        ) : (
          <div className="kanban-board">
            {stages.data?.map((stage) => {
              const items = opportunities.data?.filter((item) => item.pipelineStageId === stage.id) ?? [];
              const total = items.reduce((sum, item) => sum + Number(item.estimatedValue), 0);
              return (
                <div className="kanban-column" key={stage.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, stage)}>
                  <header><div><strong>{stage.name}</strong><small>{items.length} oportunidades</small></div><span>{money.format(total)}</span></header>
                  <div className="kanban-stack">
                    {items.length ? items.map((item) => (
                      <article className={draggingId === item.id ? 'kanban-card dragging' : 'kanban-card'} draggable key={item.id} onDragEnd={() => setDraggingId(null)} onDragStart={(event) => { event.dataTransfer.setData('text/opportunity-id', item.id); event.dataTransfer.effectAllowed = 'move'; setDraggingId(item.id); }}>
                        <span className="status-badge blue">{item.probability}%</span>
                        <strong>{item.name}</strong><small>{item.customer.name}</small><b>{money.format(Number(item.estimatedValue))}</b>
                      </article>
                    )) : <div className="kanban-empty">Suelta aquí una oportunidad</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
