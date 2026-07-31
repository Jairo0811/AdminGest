import { useState } from 'react';
import { LoaderCircle, Printer } from 'lucide-react';
import { api } from '../api/client';
import { Entity, EntityPage } from '../components/EntityPage';
import { printDocument } from '../utils/export';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

interface QuoteDetail extends Entity {
  number: string;
  status: string;
  issueDate: string;
  validUntil?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  customer: {
    name: string;
    taxId?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: QuoteItem[];
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export function QuotesPage() {
  const [printingId, setPrintingId] = useState<string | null>(null);

  const printQuote = async (id: string) => {
    setPrintingId(id);
    try {
      const quote = await api<QuoteDetail>(`/quotes/${id}`);
      const rows = quote.items
        .map(
          (item) => `<tr>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(item.quantity)}</td>
            <td>${escapeHtml(money.format(Number(item.unitPrice)))}</td>
            <td>${escapeHtml(item.taxRate)}%</td>
            <td>${escapeHtml(money.format(Number(item.lineTotal)))}</td>
          </tr>`,
        )
        .join('');

      printDocument(
        `Cotización ${quote.number}`,
        `<header>
          <div class="brand">Admin<span>Gest</span></div>
          <div><h1>Cotización ${escapeHtml(quote.number)}</h1><p class="muted">Estado: ${escapeHtml(quote.status)}</p></div>
        </header>
        <section class="summary">
          <div><strong>Cliente</strong><br/>${escapeHtml(quote.customer.name)}<br/><span class="muted">${escapeHtml(quote.customer.taxId ?? '')}</span></div>
          <div><strong>Contacto</strong><br/>${escapeHtml(quote.customer.email ?? '—')}<br/><span class="muted">${escapeHtml(quote.customer.phone ?? '')}</span></div>
          <div><strong>Fecha de emisión</strong><br/>${new Date(quote.issueDate).toLocaleDateString('es-DO')}</div>
          <div><strong>Válida hasta</strong><br/>${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-DO') : 'Sin vencimiento'}</div>
        </section>
        <table>
          <thead><tr><th>Concepto</th><th>Cantidad</th><th>Precio</th><th>ITBIS</th><th>Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <table class="totals">
          <tr><th>Subtotal</th><td>${escapeHtml(money.format(Number(quote.subtotal)))}</td></tr>
          <tr><th>Descuento</th><td>${escapeHtml(money.format(Number(quote.discount)))}</td></tr>
          <tr><th>ITBIS</th><td>${escapeHtml(money.format(Number(quote.tax)))}</td></tr>
          <tr><th>Total</th><td><strong>${escapeHtml(money.format(Number(quote.total)))}</strong></td></tr>
        </table>
        ${quote.notes ? `<p><strong>Notas:</strong> ${escapeHtml(quote.notes)}</p>` : ''}`,
      );
    } finally {
      setPrintingId(null);
    }
  };

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
          exportValue: (item) => String(item.number),
          render: (item) => (
            <span className="primary-cell">
              <strong>{String(item.number)}</strong>
              <small>{String((item.customer as Entity)?.name ?? '—')}</small>
            </span>
          ),
        },
        {
          label: 'Emisión',
          exportValue: (item) => new Date(String(item.issueDate)).toLocaleDateString('es-DO'),
          render: (item) => new Date(String(item.issueDate)).toLocaleDateString('es-DO'),
        },
        {
          label: 'Total',
          exportValue: (item) => Number(item.total ?? 0),
          render: (item) => money.format(Number(item.total)),
        },
        {
          label: 'Estado',
          exportValue: (item) => String(item.status),
          render: (item) => <span className="status-badge">{String(item.status)}</span>,
        },
        {
          label: 'Líneas',
          exportValue: (item) => Number((item._count as Entity)?.items ?? 0),
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
      itemActions={(item) => (
        <button
          aria-label="Imprimir cotización"
          className="table-action"
          disabled={printingId === item.id}
          onClick={() => void printQuote(item.id)}
          title="Imprimir o guardar como PDF"
          type="button"
        >
          {printingId === item.id ? <LoaderCircle className="spin" size={17} /> : <Printer size={17} />}
        </button>
      )}
      singular="cotización"
      title="Cotizaciones"
    />
  );
}
