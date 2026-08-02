import { Entity, EntityPage } from '../components/EntityPage';

const text = (value: unknown) => String(value ?? '—');
const fullName = (item: Entity) =>
  [item.firstName, item.lastName].filter(Boolean).map(String).join(' ') || '—';

export function LeadsPage() {
  return (
    <EntityPage
      columns={[
        {
          label: 'Prospecto',
          exportValue: fullName,
          render: (item: Entity) => (
            <span className="primary-cell">
              <strong>{fullName(item)}</strong>
              <small>{text(item.companyName)}</small>
            </span>
          ),
        },
        {
          label: 'Empresa',
          exportValue: (item) => text(item.companyName),
          render: (item) => text(item.companyName),
        },
        {
          label: 'Cargo',
          exportValue: (item) => text(item.jobTitle),
          render: (item) => text(item.jobTitle),
        },
        {
          label: 'Correo',
          exportValue: (item) => text(item.email),
          render: (item) => text(item.email),
        },
        {
          label: 'Teléfono',
          exportValue: (item) => text(item.phone),
          render: (item) => text(item.phone),
        },
        {
          label: 'Origen',
          exportValue: (item) => text(item.source),
          render: (item) => text(item.source),
        },
        {
          label: 'Estado',
          exportValue: (item) => text(item.status),
          exportFormat: 'status',
          render: (item) => <span className="status-badge">{text(item.status)}</span>,
        },
        {
          label: 'Prioridad',
          exportValue: (item) => Number(item.priority ?? 0),
          exportAlign: 'center',
          render: (item) => text(item.priority),
        },
      ]}
      description="Captura, califica y convierte tus oportunidades iniciales."
      endpoint="/leads"
      fields={[
        { name: 'firstName', label: 'Nombre', required: true },
        { name: 'lastName', label: 'Apellido' },
        { name: 'companyName', label: 'Empresa' },
        { name: 'jobTitle', label: 'Cargo' },
        { name: 'email', label: 'Correo', type: 'email' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'source', label: 'Origen', placeholder: 'Sitio web, referido…' },
        {
          name: 'priority',
          label: 'Prioridad',
          type: 'select',
          defaultValue: 2,
          options: [
            { value: '1', label: 'Baja' },
            { value: '2', label: 'Media' },
            { value: '3', label: 'Alta' },
          ],
        },
        {
          name: 'status',
          label: 'Estado',
          type: 'select',
          options: [
            { value: 'NEW', label: 'Nuevo' },
            { value: 'CONTACTED', label: 'Contactado' },
            { value: 'QUALIFIED', label: 'Calificado' },
            { value: 'DISQUALIFIED', label: 'Descartado' },
            { value: 'CONVERTED', label: 'Convertido' },
          ],
        },
        { name: 'notes', label: 'Notas', type: 'textarea' },
      ]}
      reportMetrics={(items) => [
        { label: 'Prospectos', value: items.length, tone: 'blue' },
        { label: 'Nuevos', value: items.filter((item) => item.status === 'NEW').length },
        {
          label: 'Calificados',
          value: items.filter((item) => item.status === 'QUALIFIED').length,
          tone: 'green',
        },
        {
          label: 'Convertidos',
          value: items.filter((item) => item.status === 'CONVERTED').length,
          tone: 'green',
        },
      ]}
      singular="prospecto"
      title="Prospectos"
    />
  );
}
