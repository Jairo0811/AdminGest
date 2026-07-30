import { Entity, EntityPage } from '../components/EntityPage';

const text = (value: unknown) => String(value ?? '—');

export function LeadsPage() {
  return (
    <EntityPage
      columns={[
        {
          label: 'Prospecto',
          render: (item: Entity) => (
            <span className="primary-cell">
              <strong>{text(item.firstName)} {text(item.lastName) === '—' ? '' : text(item.lastName)}</strong>
              <small>{text(item.companyName)}</small>
            </span>
          ),
        },
        { label: 'Correo', render: (item) => text(item.email) },
        { label: 'Teléfono', render: (item) => text(item.phone) },
        {
          label: 'Estado',
          render: (item) => <span className="status-badge">{text(item.status)}</span>,
        },
        { label: 'Origen', render: (item) => text(item.source) },
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
      singular="prospecto"
      title="Prospectos"
    />
  );
}

