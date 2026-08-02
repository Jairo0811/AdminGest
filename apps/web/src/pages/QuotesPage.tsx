import { useState } from 'react';
import { LoaderCircle, Printer } from 'lucide-react';
import { api } from '../api/client';
import { Entity, EntityPage } from '../components/EntityPage';
import { printDocument } from '../utils/export';
import {
  buildQuoteVerificationUrl,
  createQuoteVerificationQr,
} from '../utils/quote-verification';

const FIXED_ITBIS_RATE = 18;

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

const dateFormatter = new Intl.DateTimeFormat('es-DO', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

interface Company {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
}

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
  publicCode: string;
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

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

const optionalLine = (label: string, value?: string) =>
  value ? `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>` : '';

export function QuotesPage() {
  const [printingId, setPrintingId] = useState<string | null>(null);

  const printQuote = async (id: string) => {
    setPrintingId(id);
    try {
      const [quote, company] = await Promise.all([
        api<QuoteDetail>(`/quotes/${id}`),
        api<Company>('/company'),
      ]);

      if (!quote.publicCode) {
        throw new Error('La cotización no tiene un código público de verificación.');
      }

      const verificationUrl = buildQuoteVerificationUrl(quote.publicCode);
      const qrDataUrl = await createQuoteVerificationQr(verificationUrl);
      const logoUrl = new URL('/brand/logo.png', window.location.origin).href;
      const taxableSubtotal = Math.max(0, Number(quote.subtotal) - Number(quote.discount));
      const discountPercentage = Number(quote.subtotal) > 0
        ? (Number(quote.discount) / Number(quote.subtotal)) * 100
        : 0;
      const statusLabel = statusLabels[quote.status] ?? quote.status;

      const rows = quote.items
        .map((item) => {
          const lineSubtotal = Number(item.lineTotal);
          const lineTax = lineSubtotal * (FIXED_ITBIS_RATE / 100);
          const lineTotalWithTax = lineSubtotal + lineTax;

          return `<tr>
            <td>${escapeHtml(item.description)}</td>
            <td>${escapeHtml(item.quantity)}</td>
            <td>${escapeHtml(money.format(Number(item.unitPrice)))}</td>
            <td>${escapeHtml(money.format(lineSubtotal))}</td>
            <td>${FIXED_ITBIS_RATE}%</td>
            <td><strong>${escapeHtml(money.format(lineTotalWithTax))}</strong></td>
          </tr>`;
        })
        .join('');

      printDocument(
        `Cotización ${quote.number}`,
        `<section class="quote-header">
          <div class="quote-brand">
            <img src="${escapeHtml(logoUrl)}" alt="AdminGest" />
            <div class="quote-company">
              <strong>${escapeHtml(company.name)}</strong>
              ${company.taxId ? `<span>RNC: ${escapeHtml(company.taxId)}</span>` : ''}
              ${company.address ? `<span>${escapeHtml(company.address)}</span>` : ''}
              ${company.email || company.phone
                ? `<span>${escapeHtml([company.email, company.phone].filter(Boolean).join(' · '))}</span>`
                : ''}
            </div>
          </div>
          <div class="quote-title">
            <span class="label">Propuesta comercial</span>
            <h1>${escapeHtml(quote.number)}</h1>
            <span class="quote-status">${escapeHtml(statusLabel)}</span>
          </div>
        </section>

        <section class="quote-meta">
          <article class="quote-card">
            <h3>Cotización preparada para</h3>
            <strong>${escapeHtml(quote.customer.name)}</strong>
            ${optionalLine('RNC/Cédula', quote.customer.taxId)}
            ${optionalLine('Correo', quote.customer.email)}
            ${optionalLine('Teléfono', quote.customer.phone)}
            ${optionalLine('Dirección', quote.customer.address)}
          </article>
          <article class="quote-card">
            <h3>Información del documento</h3>
            <div class="quote-dates">
              <div class="quote-date">
                <small>Fecha de emisión</small>
                <strong>${dateFormatter.format(new Date(quote.issueDate))}</strong>
              </div>
              <div class="quote-date">
                <small>Válida hasta</small>
                <strong>${quote.validUntil
                  ? dateFormatter.format(new Date(quote.validUntil))
                  : 'Sin vencimiento'}</strong>
              </div>
            </div>
          </article>
        </section>

        <table class="quote-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
              <th>ITBIS</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <section class="quote-financials">
          <article class="quote-notes">
            <h3>Notas y condiciones</h3>
            <p>${escapeHtml(
              quote.notes
                ?? `Esta cotización es válida hasta la fecha indicada. Los precios están expresados en pesos dominicanos e incluyen ITBIS del ${FIXED_ITBIS_RATE}% según corresponda.`,
            )}</p>
          </article>
          <table class="totals">
            <tr><th>Subtotal</th><td>${escapeHtml(money.format(Number(quote.subtotal)))}</td></tr>
            <tr><th>Descuento (${escapeHtml(discountPercentage.toFixed(2))}%)</th><td>-${escapeHtml(money.format(Number(quote.discount)))}</td></tr>
            <tr><th>Base imponible</th><td>${escapeHtml(money.format(taxableSubtotal))}</td></tr>
            <tr><th>ITBIS (${FIXED_ITBIS_RATE}%)</th><td>${escapeHtml(money.format(Number(quote.tax)))}</td></tr>
            <tr class="grand-total"><th>Total</th><td><strong>${escapeHtml(money.format(Number(quote.total)))}</strong></td></tr>
          </table>
        </section>

        <section style="display:grid;grid-template-columns:1fr 126px;gap:20px;align-items:center;margin-top:24px;padding:16px;border:1px solid #dce4ed;border-radius:14px;background:#f7fbf9;break-inside:avoid">
          <div>
            <h3 style="margin:0 0 6px;color:#16805c;font-size:12px;letter-spacing:.08em;text-transform:uppercase">Verificación de autenticidad</h3>
            <strong style="display:block;margin-bottom:5px">Escanea este código QR para consultar la cotización en AdminGest.</strong>
            <span style="display:block;color:#66788d;font-size:10px;word-break:break-all">${escapeHtml(verificationUrl)}</span>
          </div>
          <img src="${escapeHtml(qrDataUrl)}" alt="QR de verificación" style="display:block;width:126px;height:126px;padding:5px;border:1px solid #dce4ed;border-radius:10px;background:#fff" />
        </section>

        <footer class="quote-footer">
          <div>
            <strong>Gracias por considerar nuestra propuesta.</strong><br/>
            Documento generado por AdminGest el ${escapeHtml(new Date().toLocaleString('es-DO'))}.
          </div>
          <div class="signature">Firma autorizada</div>
        </footer>`,
      );
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <EntityPage
      buildPayload={(values) => {
        const quantity = Number(values.quantity || 0);
        const unitPrice = Number(values.unitPrice || 0);
        const discountPercentage = clampPercentage(Number(values.discountPercentage || 0));
        const subtotal = quantity * unitPrice;

        return {
          customerId: values.customerId,
          validUntil: values.validUntil,
          discount: Number((subtotal * (discountPercentage / 100)).toFixed(2)),
          notes: values.notes,
          items: [
            {
              description: values.itemDescription,
              quantity,
              unitPrice,
              taxRate: FIXED_ITBIS_RATE,
            },
          ],
        };
      }}
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
          exportValue: (item) => String(item.issueDate),
          exportFormat: 'date',
          render: (item) => new Date(String(item.issueDate)).toLocaleDateString('es-DO'),
        },
        {
          label: 'Total',
          exportValue: (item) => Number(item.total ?? 0),
          exportFormat: 'currency',
          exportAlign: 'right',
          render: (item) => money.format(Number(item.total)),
        },
        {
          label: 'Estado',
          exportValue: (item) => String(item.status),
          exportFormat: 'status',
          render: (item) => <span className="status-badge">{statusLabels[String(item.status)] ?? String(item.status)}</span>,
        },
        {
          label: 'Líneas',
          exportValue: (item) => Number((item._count as Entity)?.items ?? 0),
          exportAlign: 'center',
          render: (item) => String((item._count as Entity)?.items ?? 0),
        },
      ]}
      description="Genera propuestas comerciales con descuento configurable, ITBIS fijo del 18% y verificación mediante QR."
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
        { name: 'discountPercentage', label: 'Descuento (%)', type: 'number', defaultValue: 0 },
        { name: 'itemDescription', label: 'Concepto', required: true },
        { name: 'quantity', label: 'Cantidad', type: 'number', defaultValue: 1, required: true },
        { name: 'unitPrice', label: 'Precio unitario', type: 'number', required: true },
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
      reportMetrics={(items) => [
        { label: 'Cotizaciones', value: items.length, tone: 'blue', icon: '📄' },
        {
          label: 'Monto total',
          value: money.format(items.reduce((sum, item) => sum + Number(item.total ?? 0), 0)),
          tone: 'green',
          icon: '💰',
        },
        {
          label: 'Borradores',
          value: items.filter((item) => item.status === 'DRAFT').length,
          tone: 'neutral',
          icon: '📝',
        },
        {
          label: 'Aceptadas',
          value: items.filter((item) => item.status === 'ACCEPTED').length,
          tone: 'green',
          icon: '✅',
        },
      ]}
      singular="cotización"
      title="Cotizaciones"
    />
  );
}
