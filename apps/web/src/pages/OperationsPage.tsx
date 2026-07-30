import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, CircleDollarSign, PackagePlus, Plus, ShoppingCart, Truck } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { api, formatCurrency } from '../lib/api';

type Tab = 'catalog' | 'suppliers' | 'purchases' | 'expenses';
type FormType = Tab | 'stock' | null;

interface CatalogItem {
  id: string;
  sku?: string;
  name: string;
  type: string;
  unitPrice: number | string;
  unitCost: number | string;
  stockQuantity: number | string;
  reorderPoint: number | string;
}

interface Supplier {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
}

interface PurchaseOrder {
  id: string;
  number: string;
  status: string;
  orderDate: string;
  total: number | string;
  supplier: Supplier;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number | string;
  expenseDate: string;
  status: string;
}

const tabs: Array<{ id: Tab; label: string; icon: typeof Boxes }> = [
  { id: 'catalog', label: 'Catálogo e inventario', icon: Boxes },
  { id: 'suppliers', label: 'Proveedores', icon: Truck },
  { id: 'purchases', label: 'Órdenes de compra', icon: ShoppingCart },
  { id: 'expenses', label: 'Gastos', icon: CircleDollarSign },
];

export function OperationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('catalog');
  const [form, setForm] = useState<FormType>(null);
  const [stockItem, setStockItem] = useState<CatalogItem | null>(null);
  const [error, setError] = useState('');
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: () => api<CatalogItem[]>('/operations/catalog') });
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: () => api<Supplier[]>('/operations/suppliers') });
  const purchases = useQuery({ queryKey: ['purchase-orders'], queryFn: () => api<PurchaseOrder[]>('/operations/purchase-orders') });
  const expenses = useQuery({ queryKey: ['expenses'], queryFn: () => api<Expense[]>('/operations/expenses') });

  const mutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body: Record<string, unknown> }) =>
      api(path, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setForm(null);
      setStockItem(null);
      setError('');
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (reason: Error) => setError(reason.message),
  });
  const receive = useMutation({
    mutationFn: (id: string) => api(`/operations/purchase-orders/${id}/receive`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
    },
  });

  function open(type: FormType, item?: CatalogItem) {
    setError('');
    setStockItem(item ?? null);
    setForm(type);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    if (form === 'catalog') {
      mutation.mutate({
        path: '/operations/catalog',
        body: {
          sku: values.sku || undefined,
          name: values.name,
          type: values.type,
          unitPrice: Number(values.unitPrice),
          unitCost: Number(values.unitCost || 0),
          taxRate: Number(values.taxRate || 18),
          initialStock: Number(values.initialStock || 0),
          reorderPoint: Number(values.reorderPoint || 0),
        },
      });
    } else if (form === 'stock' && stockItem) {
      mutation.mutate({
        path: `/operations/catalog/${stockItem.id}/movements`,
        body: {
          type: values.type,
          quantity: Number(values.quantity),
          reference: values.reference || undefined,
          notes: values.notes || undefined,
        },
      });
    } else if (form === 'suppliers') {
      mutation.mutate({
        path: '/operations/suppliers',
        body: {
          name: values.name,
          taxId: values.taxId || undefined,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
        },
      });
    } else if (form === 'expenses') {
      mutation.mutate({
        path: '/operations/expenses',
        body: {
          category: values.category,
          description: values.description,
          amount: Number(values.amount),
          expenseDate: values.expenseDate ? new Date(`${values.expenseDate}T12:00:00`).toISOString() : undefined,
          reference: values.reference || undefined,
        },
      });
    } else if (form === 'purchases') {
      const selectedItem = catalog.data?.find((item) => item.id === values.catalogItemId);
      mutation.mutate({
        path: '/operations/purchase-orders',
        body: {
          supplierId: values.supplierId,
          expectedAt: values.expectedAt ? new Date(`${values.expectedAt}T12:00:00`).toISOString() : undefined,
          notes: values.notes || undefined,
          items: [{
            catalogItemId: values.catalogItemId || undefined,
            description: selectedItem?.name ?? values.description,
            quantity: Number(values.quantity),
            unitCost: Number(values.unitCost),
            taxRate: Number(values.taxRate || 18),
          }],
        },
      });
    }
  }

  const loading = catalog.isPending || suppliers.isPending || purchases.isPending || expenses.isPending;
  const activeLabel = tabs.find((item) => item.id === tab)?.label ?? '';

  return (
    <div className="page-stack">
      <div className="tabs" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button className={tab === id ? 'tab active' : 'tab'} key={id} type="button" onClick={() => setTab(id)}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>
      <section className="page-toolbar">
        <div className="toolbar-summary"><span>{activeLabel}</span></div>
        <button className="primary-button" type="button" onClick={() => open(tab)}>
          <Plus size={18} /> Agregar
        </button>
      </section>
      <article className="panel">
        {loading ? <div className="table-state">Cargando operaciones…</div> : (
          <div className="data-table-wrap">
            {tab === 'catalog' && (
              <table className="data-table">
                <thead><tr><th>Producto / servicio</th><th>Tipo</th><th>Existencia</th><th>Precio</th><th /></tr></thead>
                <tbody>{catalog.data?.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.name}</strong><small>{item.sku ?? 'Sin SKU'}</small></td>
                    <td>{item.type === 'PRODUCT' ? 'Producto' : 'Servicio'}</td>
                    <td>
                      <strong className={Number(item.stockQuantity) <= Number(item.reorderPoint) && item.type === 'PRODUCT' ? 'stock-low' : ''}>
                        {item.type === 'PRODUCT' ? Number(item.stockQuantity).toLocaleString('es-DO') : 'No aplica'}
                      </strong>
                    </td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{item.type === 'PRODUCT' && (
                      <button className="secondary-button compact" type="button" onClick={() => open('stock', item)}>
                        <PackagePlus size={16} /> Movimiento
                      </button>
                    )}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {tab === 'suppliers' && (
              <table className="data-table">
                <thead><tr><th>Proveedor</th><th>Identificación</th><th>Correo</th><th>Teléfono</th></tr></thead>
                <tbody>{suppliers.data?.map((supplier) => (
                  <tr key={supplier.id}><td><strong>{supplier.name}</strong></td><td>{supplier.taxId ?? '—'}</td><td>{supplier.email ?? '—'}</td><td>{supplier.phone ?? '—'}</td></tr>
                ))}</tbody>
              </table>
            )}
            {tab === 'purchases' && (
              <table className="data-table">
                <thead><tr><th>Orden</th><th>Proveedor</th><th>Fecha</th><th>Estado</th><th>Total</th><th /></tr></thead>
                <tbody>{purchases.data?.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.number}</strong></td><td>{order.supplier.name}</td>
                    <td>{new Date(order.orderDate).toLocaleDateString('es-DO')}</td>
                    <td><StatusBadge status={order.status} /></td><td>{formatCurrency(order.total)}</td>
                    <td>{order.status !== 'RECEIVED' && <button className="secondary-button compact" type="button" onClick={() => receive.mutate(order.id)}>Recibir</button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            {tab === 'expenses' && (
              <table className="data-table">
                <thead><tr><th>Descripción</th><th>Categoría</th><th>Fecha</th><th>Estado</th><th className="align-right">Monto</th></tr></thead>
                <tbody>{expenses.data?.map((expense) => (
                  <tr key={expense.id}><td><strong>{expense.description}</strong></td><td>{expense.category}</td><td>{new Date(expense.expenseDate).toLocaleDateString('es-DO')}</td><td><StatusBadge status={expense.status} /></td><td className="align-right">{formatCurrency(expense.amount)}</td></tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}
      </article>

      {form && (
        <Modal title={form === 'stock' ? `Movimiento de ${stockItem?.name}` : `Agregar en ${activeLabel}`} onClose={() => setForm(null)}>
          <form className="form-grid modal-form" onSubmit={submit}>
            {form === 'catalog' && <CatalogFields />}
            {form === 'stock' && <StockFields />}
            {form === 'suppliers' && <SupplierFields />}
            {form === 'expenses' && <ExpenseFields />}
            {form === 'purchases' && <PurchaseFields suppliers={suppliers.data ?? []} catalog={catalog.data ?? []} />}
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full">
              <button className="secondary-button" type="button" onClick={() => setForm(null)}>Cancelar</button>
              <button className="primary-button" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Guardando…' : 'Guardar'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CatalogFields() {
  return <><label className="field field-full"><span>Nombre *</span><input name="name" required /></label>
    <label className="field"><span>SKU</span><input name="sku" /></label><label className="field"><span>Tipo *</span><select name="type"><option value="PRODUCT">Producto</option><option value="SERVICE">Servicio</option></select></label>
    <label className="field"><span>Precio de venta *</span><input name="unitPrice" type="number" min="0" step="0.01" required /></label><label className="field"><span>Costo</span><input name="unitCost" type="number" min="0" step="0.01" /></label>
    <label className="field"><span>ITBIS %</span><input name="taxRate" type="number" min="0" defaultValue="18" /></label><label className="field"><span>Existencia inicial</span><input name="initialStock" type="number" min="0" defaultValue="0" /></label>
    <label className="field field-full"><span>Punto de reposición</span><input name="reorderPoint" type="number" min="0" defaultValue="0" /></label></>;
}

function StockFields() {
  return <><label className="field"><span>Tipo *</span><select name="type"><option value="IN">Entrada</option><option value="OUT">Salida</option><option value="ADJUSTMENT">Ajuste a cantidad</option></select></label>
    <label className="field"><span>Cantidad *</span><input name="quantity" type="number" min="0" step="0.01" required /></label>
    <label className="field field-full"><span>Referencia</span><input name="reference" /></label><label className="field field-full"><span>Notas</span><textarea name="notes" rows={3} /></label></>;
}

function SupplierFields() {
  return <><label className="field field-full"><span>Nombre *</span><input name="name" required /></label><label className="field"><span>RNC / identificación</span><input name="taxId" /></label>
    <label className="field"><span>Correo</span><input name="email" type="email" /></label><label className="field"><span>Teléfono</span><input name="phone" /></label><label className="field field-full"><span>Dirección</span><input name="address" /></label></>;
}

function ExpenseFields() {
  return <><label className="field"><span>Categoría *</span><input name="category" required placeholder="Servicios, transporte…" /></label><label className="field"><span>Fecha</span><input name="expenseDate" type="date" /></label>
    <label className="field field-full"><span>Descripción *</span><input name="description" required /></label><label className="field"><span>Monto *</span><input name="amount" type="number" min="0.01" step="0.01" required /></label><label className="field"><span>Referencia</span><input name="reference" /></label></>;
}

function PurchaseFields({ suppliers, catalog }: { suppliers: Supplier[]; catalog: CatalogItem[] }) {
  return <><label className="field field-full"><span>Proveedor *</span><select name="supplierId" required defaultValue=""><option value="" disabled>Seleccionar proveedor</option>{suppliers.map((supplier) => <option value={supplier.id} key={supplier.id}>{supplier.name}</option>)}</select></label>
    <label className="field field-full"><span>Producto *</span><select name="catalogItemId" required defaultValue=""><option value="" disabled>Seleccionar producto</option>{catalog.filter((item) => item.type === 'PRODUCT').map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label className="field"><span>Cantidad *</span><input name="quantity" type="number" min="0.01" step="0.01" required /></label><label className="field"><span>Costo unitario *</span><input name="unitCost" type="number" min="0" step="0.01" required /></label>
    <label className="field"><span>ITBIS %</span><input name="taxRate" type="number" min="0" defaultValue="18" /></label><label className="field"><span>Recepción esperada</span><input name="expectedAt" type="date" /></label><label className="field field-full"><span>Notas</span><textarea name="notes" rows={3} /></label></>;
}
