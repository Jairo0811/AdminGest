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
          exportValue: (item) => value(item, 'name'),
          render: (item) => (
            <span className="primary-cell">
              <strong>{value(item, 'name')}</strong>
              <small>
                {item.taxId ? formatDominicanTaxId(String(item.taxId)) : '—'}
              </small>
            </span>
          ),
        },
        {
          label: 'RNC/Cédula',
          exportValue: (item) =>
            item.taxId ? formatDominicanTaxId(String(item.taxId)) : '—',
          render: (item) =>
            item.taxId ? formatDominicanTaxId(String(item.taxId)) : '—',
        },
        {
          label: 'Correo',
          exportValue: (item) => value(item, 'email'),
          render: (item) => value(item, 'email'),
        },
        {
          label: 'Teléfono',
          exportValue: (item) => value(item, 'phone'),
          render: (item) => value(item, 'phone'),
        },
        {
          label: 'Sitio web',
          exportValue: (item) => value(item, 'website'),
          render: (item) => value(item, 'website'),
        },
        {
          label: 'Estado',
          exportValue: (item) => (item.isActive === false ? 'Inactivo' : 'Activo'),
          exportAlign: 'center',
          render: (item) => (item.isActive === false ? 'Inactivo' : 'Activo'),
        },
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
      reportMetrics={(items) => [
        { label: 'Clientes', value: items.length, tone: 'blue' },
        {
          label: 'Activos',
          value: items.filter((item) => item.isActive !== false).length,
          tone: 'green',
        },
        {
          label: 'Inactivos',
          value: items.filter((item) => item.isActive === false).length,
        },
        {
          label: 'Con identificación',
          value: items.filter((item) => Boolean(item.taxId)).length,
        },
      ]}
      singular="cliente"
      title="Clientes"
    />
  );
}
