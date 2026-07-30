import { Entity, EntityPage } from '../components/EntityPage';

export function ActivitiesPage() {
  return (
    <EntityPage
      columns={[
        {
          label: 'Actividad',
          render: (item) => (
            <span className="primary-cell">
              <strong>{String(item.subject)}</strong>
              <small>{String(item.type).replaceAll('_', ' ')}</small>
            </span>
          ),
        },
        {
          label: 'Fecha',
          render: (item) =>
            new Intl.DateTimeFormat('es-DO', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(String(item.scheduledAt))),
        },
        {
          label: 'Cliente',
          render: (item) => String((item.customer as Entity | undefined)?.name ?? '—'),
        },
        { label: 'Estado', render: (item) => <span className="status-badge">{String(item.status)}</span> },
      ]}
      description="Planifica llamadas, reuniones, visitas y seguimientos."
      endpoint="/activities"
      fields={[
        { name: 'subject', label: 'Asunto', required: true },
        {
          name: 'type',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'CALL', label: 'Llamada' },
            { value: 'EMAIL', label: 'Correo' },
            { value: 'MEETING', label: 'Reunión' },
            { value: 'VISIT', label: 'Visita' },
            { value: 'TASK', label: 'Tarea' },
            { value: 'FOLLOW_UP', label: 'Seguimiento' },
          ],
        },
        { name: 'scheduledAt', label: 'Fecha y hora', type: 'datetime-local', required: true },
        {
          name: 'customerId',
          label: 'Cliente',
          type: 'select',
          optionsEndpoint: '/customers',
          optionLabel: (item) => String(item.name),
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          options: [
            { value: 'PENDING', label: 'Pendiente' },
            { value: 'COMPLETED', label: 'Completada' },
            { value: 'CANCELLED', label: 'Cancelada' },
          ],
        },
        { name: 'description', label: 'Descripción', type: 'textarea' },
      ]}
      singular="actividad"
      title="Actividades"
    />
  );
}

