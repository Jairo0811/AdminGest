import { Entity, EntityPage } from '../components/EntityPage';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

export function QuotesPage() {
  return (
    <EntityPage
      buildPayload={(values) => ({
        customerId: values.customerId,
        validUntil: values.validUntil,
        discount: Number(values.discount || 0),
        notes: values.notes,
        items: [
          {
            description: values.itemDescription,
            quantity: Number(values.quantity),
            unitPrice: Number(values.unitPrice),
            taxRate: Number(values.taxRate || 18),
          },
        ],
      })}
      canEdit={false}
      columns={[
        {
          label: 'Cotización',
          render: (item) => (
            <span className="primary-cell">
              <strong>{String(item.number)}</strong>
              <small>{String((item.customer as Entity)?.name ?? '—')}</small>
            </span>
          ),
        },
        { label: 'Emisión', render: (item) => new Date(String(item.issueDate)).toLocaleDateString('es-DO') },
        { label: 'Total', render: (item) => money.format(Number(item.total)) },
        { label: 'Estado', render: (item) => <span className="status-badge">{String(item.status)}</span> },
        {
          label: 'Líneas',
          render: (item) => String((item._count as Entity)?.items ?? 0),
        },
      ]}
      description="Genera propuestas comerciales con cálculos automáticos de descuento e impuestos."
      endpoint="/quotes"
      fields={[
        {
          name: 'customerId',
          label: 'Cliente',
          type: 'select',
          required: true,
          optionsEndpoint: '/customers',
          optionLabel: (item) => String(item.name),
        },
        { name: 'validUntil', label: 'Válida hasta', type: 'date' },
        { name: 'discount', label: 'Descuento', type: 'number', defaultValue: 0 },
        { name: 'itemDescription', label: 'Concepto', required: true },
        { name: 'quantity', label: 'Cantidad', type: 'number', defaultValue: 1, required: true },
        { name: 'unitPrice', label: 'Precio unitario', type: 'number', required: true },
        { name: 'taxRate', label: 'ITBIS (%)', type: 'number', defaultValue: 18 },
        { name: 'notes', label: 'Notas', type: 'textarea' },
      ]}
      singular="cotización"
      title="Cotizaciones"
    />
  );
}

