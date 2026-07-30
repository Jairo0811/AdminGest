import { Entity, EntityPage } from '../components/EntityPage';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0,
});

export function ProjectsPage() {
  return (
    <EntityPage
      columns={[
        {
          label: 'Proyecto',
          render: (item) => (
            <span className="primary-cell">
              <strong>{String(item.name)}</strong>
              <small>{String((item.customer as Entity)?.name ?? '—')}</small>
            </span>
          ),
        },
        { label: 'Estado', render: (item) => <span className="status-badge blue">{String(item.status)}</span> },
        {
          label: 'Progreso',
          render: (item) => (
            <span className="progress-cell">
              <span><i style={{ width: `${Number(item.progress)}%` }} /></span>
              <small>{Number(item.progress)}%</small>
            </span>
          ),
        },
        { label: 'Presupuesto', render: (item) => money.format(Number(item.budget ?? 0)) },
        { label: 'Tareas', render: (item) => String((item._count as Entity)?.tasks ?? 0) },
      ]}
      description="Controla alcance, cronograma, presupuesto, tareas y avance."
      endpoint="/projects"
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
        { name: 'startDate', label: 'Inicio', type: 'date' },
        { name: 'endDate', label: 'Finalización', type: 'date' },
        { name: 'budget', label: 'Presupuesto', type: 'number' },
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          options: [
            { value: 'PLANNED', label: 'Planificado' },
            { value: 'ACTIVE', label: 'Activo' },
            { value: 'ON_HOLD', label: 'En pausa' },
            { value: 'COMPLETED', label: 'Completado' },
            { value: 'CANCELLED', label: 'Cancelado' },
          ],
        },
        { name: 'progress', label: 'Progreso (%)', type: 'number' },
        { name: 'description', label: 'Descripción', type: 'textarea' },
      ]}
      singular="proyecto"
      title="Proyectos"
    />
  );
}

