import { Entity, EntityPage } from '../components/EntityPage';

const value = (item: Entity, key: string) => String(item[key] ?? '—');

export function CustomersPage() {
  return (
    <EntityPage
      columns={[
        {
          label: 'Cliente',
          render: (item) => (
            <span className="primary-cell">
              <strong>{value(item, 'name')}</strong>
              <small>{value(item, 'taxId')}</small>
            </span>
          ),
        },
        { label: 'Correo', render: (item) => value(item, 'email') },
        { label: 'Teléfono', render: (item) => value(item, 'phone') },
        { label: 'Dirección', render: (item) => value(item, 'address') },
      ]}
      description="Mantén la información comercial y los contactos de cada cliente."
      endpoint="/customers"
      fields={[
        { name: 'name', label: 'Nombre o razón social', required: true },
        { name: 'taxId', label: 'RNC o identificación' },
        { name: 'email', label: 'Correo', type: 'email' },
        { name: 'phone', label: 'Teléfono' },
        { name: 'website', label: 'Sitio web' },
        { name: 'address', label: 'Dirección', type: 'textarea' },
      ]}
      singular="cliente"
      title="Clientes"
    />
  );
}

