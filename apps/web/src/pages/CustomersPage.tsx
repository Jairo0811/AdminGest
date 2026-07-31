import { Entity, EntityPage } from '../components/EntityPage';
import {
  formatDominicanTaxId,
  normalizeDominicanTaxId,
  validateDominicanTaxId,
} from '../utils/dominican-tax-id';

const value = (item: Entity, key: string) => String(item[key] ?? '—');

export function CustomersPage() {
  return (
    <EntityPage
      buildPayload={(values) => {
        const taxId = String(values.taxId ?? '');
        const validationError = validateDominicanTaxId(taxId);
        if (validationError) throw new Error(validationError);

        return {
          ...values,
          taxId: taxId ? normalizeDominicanTaxId(taxId) : undefined,
        };
      }}
      columns={[
        {
          label: 'Cliente',
          render: (item) => (
            <span className="primary-cell">
              <strong>{value(item, 'name')}</strong>
              <small>
                {item.taxId ? formatDominicanTaxId(String(item.taxId)) : '—'}
              </small>
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
        {
          name: 'taxId',
          label: 'Cédula o RNC',
          placeholder: '001-0000000-0 o 130-00000-0',
        },
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
