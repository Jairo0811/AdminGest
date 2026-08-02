import { EntityPage } from '../components/EntityPage';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

export function CatalogPage() {
  return (
    <EntityPage
      canDelete={false}
      columns={[
        {
          label: 'Nombre',
          exportValue: (item) => String(item.name),
          render: (item) => <strong>{String(item.name)}</strong>,
        },
        {
          label: 'Tipo',
          exportValue: (item) => String(item.type),
          exportFormat: 'status',
          render: (item) => (
            <span className="status-badge blue">{String(item.type)}</span>
          ),
        },
        {
          label: 'Precio',
          exportValue: (item) => Number(item.unitPrice ?? 0),
          exportFormat: 'currency',
          exportAlign: 'right',
          render: (item) => money.format(Number(item.unitPrice)),
        },
        {
          label: 'ITBIS',
          exportValue: (item) => Number(item.taxRate ?? 0),
          exportFormat: 'percent',
          exportAlign: 'center',
          render: (item) => `${Number(item.taxRate)}%`,
        },
        {
          label: 'Estado',
          exportValue: (item) => (item.isActive ? 'Activo' : 'Inactivo'),
          exportAlign: 'center',
          render: (item) => (item.isActive ? 'Activo' : 'Inactivo'),
        },
      ]}
      description="Define los productos y servicios reutilizables en las cotizaciones."
      endpoint="/catalog"
      fields={[
        { name: 'name', label: 'Nombre', required: true },
        {
          name: 'type',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'PRODUCT', label: 'Producto' },
            { value: 'SERVICE', label: 'Servicio' },
          ],
        },
        { name: 'unitPrice', label: 'Precio unitario', type: 'number', required: true },
        { name: 'taxRate', label: 'ITBIS (%)', type: 'number', defaultValue: 18 },
        { name: 'description', label: 'Descripción', type: 'textarea' },
      ]}
      reportMetrics={(items) => {
        const prices = items.map((item) => Number(item.unitPrice ?? 0));
        const average = prices.length
          ? prices.reduce((sum, price) => sum + price, 0) / prices.length
          : 0;
        return [
          { label: 'Elementos', value: items.length, tone: 'blue' },
          {
            label: 'Productos',
            value: items.filter((item) => item.type === 'PRODUCT').length,
          },
          {
            label: 'Servicios',
            value: items.filter((item) => item.type === 'SERVICE').length,
            tone: 'green',
          },
          {
            label: 'Precio promedio',
            value: money.format(average),
            tone: 'green',
          },
        ];
      }}
      singular="elemento"
      title="Catálogo"
    />
  );
}
