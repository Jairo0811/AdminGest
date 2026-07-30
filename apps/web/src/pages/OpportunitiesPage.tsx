import { Entity, EntityPage } from '../components/EntityPage';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0,
});

export function OpportunitiesPage() {
  return (
    <EntityPage
      columns={[
        {
          label: 'Oportunidad',
          render: (item) => (
            <span className="primary-cell">
              <strong>{String(item.name)}</strong>
              <small>{String((item.customer as Entity)?.name ?? '—')}</small>
            </span>
          ),
        },
        {
          label: 'Etapa',
          render: (item) => (
            <span className="status-badge blue">
              {String((item.pipelineStage as Entity)?.name ?? '—')}
            </span>
          ),
        },
        {
          label: 'Valor',
          render: (item) => money.format(Number(item.estimatedValue ?? 0)),
        },
        { label: 'Probabilidad', render: (item) => `${Number(item.probability ?? 0)}%` },
        { label: 'Estado', render: (item) => <span className="status-badge">{String(item.status)}</span> },
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
  );
}

