import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FilePlus2, Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { api, formatCurrency } from '../lib/api';
import { Paginated } from '../types';

interface Quote {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  validUntil?: string;
  total: number | string;
  customer: { id: string; name: string };
  items: Array<{ id: string; description: string; quantity: number | string }>;
}

export function QuotesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const quotes = useQuery({
    queryKey: ['quotes'],
    queryFn: () => api<Paginated<Quote>>('/quotes?pageSize=100'),
  });
  const customers = useQuery({
    queryKey: ['customer-options'],
    queryFn: () => api<Paginated<{ id: string; name: string }>>('/customers?pageSize=100&status=ACTIVE'),
  });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/quotes', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ['quotes'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (reason: Error) => setError(reason.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    create.mutate({
      customerId: values.customerId,
      validUntil: values.validUntil ? new Date(`${values.validUntil}T12:00:00`).toISOString() : undefined,
      discount: Number(values.discount || 0),
      notes: values.notes || undefined,
      items: [{
        description: values.description,
        quantity: Number(values.quantity),
        unitPrice: Number(values.unitPrice),
        taxRate: Number(values.taxRate),
      }],
    });
  }

  return (
    <div className="page-stack">
      <section className="page-toolbar">
        <div className="toolbar-summary"><FilePlus2 size={20} /><span>{quotes.data?.meta.total ?? 0} cotizaciones emitidas</span></div>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}><Plus size={18} /> Nueva cotización</button>
      </section>
      <article className="panel">
        {quotes.isPending ? <div className="table-state">Cargando cotizaciones…</div> : quotes.isError ? (
          <div className="table-state error-text">{quotes.error.message}</div>
        ) : quotes.data.data.length === 0 ? (
          <div className="empty-state"><h3>Aún no hay cotizaciones</h3><p>Prepara tu primera propuesta comercial con cálculos automáticos.</p></div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Número</th><th>Cliente</th><th>Emisión</th><th>Estado</th><th className="align-right">Total</th></tr></thead>
              <tbody>{quotes.data.data.map((quote) => (
                <tr key={quote.id}>
                  <td><strong>{quote.number}</strong><small>{quote.items.length} partida(s)</small></td>
                  <td>{quote.customer.name}</td>
                  <td>{new Date(quote.issueDate).toLocaleDateString('es-DO')}</td>
                  <td><StatusBadge status={quote.status} /></td>
                  <td className="align-right"><strong>{formatCurrency(quote.total)}</strong></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </article>
      {showForm && (
        <Modal title="Nueva cotización" onClose={() => setShowForm(false)}>
          <form className="form-grid modal-form" onSubmit={submit}>
            <label className="field field-full"><span>Cliente *</span>
              <select name="customerId" required defaultValue=""><option value="" disabled>Seleccionar cliente</option>
                {customers.data?.data.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="field field-full"><span>Descripción de la partida *</span><input name="description" required /></label>
            <label className="field"><span>Cantidad *</span><input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /></label>
            <label className="field"><span>Precio unitario *</span><input name="unitPrice" type="number" min="0" step="0.01" required /></label>
            <label className="field"><span>ITBIS %</span><input name="taxRate" type="number" min="0" step="0.01" defaultValue="18" /></label>
            <label className="field"><span>Descuento</span><input name="discount" type="number" min="0" step="0.01" defaultValue="0" /></label>
            <label className="field field-full"><span>Válida hasta</span><input name="validUntil" type="date" /></label>
            <label className="field field-full"><span>Notas</span><textarea name="notes" rows={3} /></label>
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full">
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" disabled={create.isPending} type="submit">{create.isPending ? 'Calculando…' : 'Crear cotización'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
