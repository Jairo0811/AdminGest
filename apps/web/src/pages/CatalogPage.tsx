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
        { label: 'Nombre', render: (item) => <strong>{String(item.name)}</strong> },
        { label: 'Tipo', render: (item) => <span className="status-badge blue">{String(item.type)}</span> },
        { label: 'Precio', render: (item) => money.format(Number(item.unitPrice)) },
        { label: 'ITBIS', render: (item) => `${Number(item.taxRate)}%` },
        { label: 'Estado', render: (item) => (item.isActive ? 'Activo' : 'Inactivo') },
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
      singular="elemento"
      title="Catálogo"
    />
  );
}

