import { html, safeImageSource, SafeHtml } from './html';

/** Amounts as returned by the API (Prisma Decimal values arrive as strings). */
type Amount = number | string;

export interface PrintableQuoteItem {
  id: string;
  description: string;
  quantity: Amount;
  unitPrice: Amount;
  taxRate: Amount;
  lineTotal: Amount;
  /** Persisted by the server since v1.2.0; null for older quotes. */
  discountAmount?: Amount | null;
  taxAmount?: Amount | null;
}

export interface PrintableQuote {
  number: string;
  status: string;
  issueDate: string;
  validUntil?: string | null;
  subtotal: Amount;
  discount: Amount;
  tax: Amount;
  total: Amount;
  notes?: string | null;
  customer: {
    name: string;
    taxId?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  items: PrintableQuoteItem[];
}

export interface PrintableCompany {
  name: string;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};

export const formatMoney = (value: Amount) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(Number(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(value),
  );

const formatRate = (rate: number) =>
  rate === 0 ? 'Exento' : `${rate.toLocaleString('es-DO', { maximumFractionDigits: 2 })} %`;

const cents = (value: Amount | null | undefined) => Math.round(Number(value ?? 0) * 100);

export interface QuoteLineView {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discount: number | null;
  rate: number;
  tax: number | null;
  total: number | null;
}

export interface QuoteSummaryView {
  lines: QuoteLineView[];
  /** True when the quote predates per-line amounts (v1.2.0). */
  legacy: boolean;
  taxableBase: number | null;
  exemptBase: number | null;
  /** Single rate shared by all taxed lines, or null when rates are mixed. */
  uniformRate: number | null;
}

/**
 * Builds the printable view exclusively from values persisted by the server. Nothing is
 * recalculated with a fixed rate: each line shows its own stored rate, discount and
 * ITBIS, and the totals are the stored quote totals.
 */
export function summarizeQuote(quote: PrintableQuote): QuoteSummaryView {
  const legacy = quote.items.some((item) => item.taxAmount == null || item.discountAmount == null);
  const lines = quote.items.map((item) => {
    const subtotal = Number(item.lineTotal);
    const discount = legacy ? null : Number(item.discountAmount);
    const tax = legacy ? null : Number(item.taxAmount);
    return {
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal,
      discount,
      rate: Number(item.taxRate),
      tax,
      total:
        discount === null || tax === null
          ? null
          : (cents(subtotal) - cents(discount) + cents(tax)) / 100,
    };
  });

  const baseOf = (predicate: (line: QuoteLineView) => boolean) =>
    lines
      .filter(predicate)
      .reduce((sum, line) => sum + cents(line.subtotal) - cents(line.discount ?? 0), 0) / 100;

  const taxedRates = [...new Set(lines.filter((line) => line.rate > 0).map((line) => line.rate))];
  return {
    lines,
    legacy,
    taxableBase: legacy ? null : baseOf((line) => line.rate > 0),
    exemptBase: legacy ? null : baseOf((line) => line.rate === 0),
    uniformRate: taxedRates.length === 1 ? taxedRates[0] : null,
  };
}

const optionalLine = (label: string, value?: string | null) =>
  value ? html`<p><strong>${label}:</strong> ${value}</p>` : html``;

export interface QuotePrintInput {
  quote: PrintableQuote;
  company: PrintableCompany;
  verificationUrl: string;
  qrDataUrl: string;
  logoUrl: string;
  generatedAt?: Date;
}

export function buildQuotePrintBody({
  quote,
  company,
  verificationUrl,
  qrDataUrl,
  logoUrl,
  generatedAt = new Date(),
}: QuotePrintInput): SafeHtml {
  const summary = summarizeQuote(quote);
  const statusLabel = QUOTE_STATUS_LABELS[quote.status] ?? quote.status;
  const discount = Number(quote.discount);
  const discountPercentage = Number(quote.subtotal) > 0 ? (discount / Number(quote.subtotal)) * 100 : 0;
  const dash = '—';

  const rows = summary.lines.map(
    (line) => html`<tr>
      <td>${line.description}</td>
      <td>${line.quantity.toLocaleString('es-DO', { maximumFractionDigits: 2 })}</td>
      <td>${formatMoney(line.unitPrice)}</td>
      <td>${formatMoney(line.subtotal)}</td>
      <td>${line.discount === null ? dash : line.discount ? `-${formatMoney(line.discount)}` : dash}</td>
      <td>${formatRate(line.rate)}</td>
      <td>${line.tax === null ? dash : formatMoney(line.tax)}</td>
      <td><strong>${line.total === null ? dash : formatMoney(line.total)}</strong></td>
    </tr>`,
  );

  const taxLabel =
    summary.uniformRate !== null ? `ITBIS (${formatRate(summary.uniformRate)})` : 'ITBIS';
  const defaultNotes =
    'Los importes están expresados en pesos dominicanos (RD$). El ITBIS se calcula por línea según la tasa indicada. ' +
    'Este documento es una propuesta comercial; no constituye una factura ni un comprobante fiscal.';

  return html`<section class="quote-header">
      <div class="quote-brand">
        <img src="${safeImageSource(logoUrl)}" alt="AdminGest" />
        <div class="quote-company">
          <strong>${company.name}</strong>
          ${company.taxId ? html`<span>RNC: ${company.taxId}</span>` : ''}
          ${company.address ? html`<span>${company.address}</span>` : ''}
          ${company.email || company.phone
            ? html`<span>${[company.email, company.phone].filter(Boolean).join(' · ')}</span>`
            : ''}
        </div>
      </div>
      <div class="quote-title">
        <span class="label">Propuesta comercial</span>
        <h1>${quote.number}</h1>
        <span class="quote-status">${statusLabel}</span>
      </div>
    </section>

    <section class="quote-meta">
      <article class="quote-card">
        <h3>Cotización preparada para</h3>
        <strong>${quote.customer.name}</strong>
        ${optionalLine('RNC/Cédula', quote.customer.taxId)}
        ${optionalLine('Correo', quote.customer.email)}
        ${optionalLine('Teléfono', quote.customer.phone)}
        ${optionalLine('Dirección', quote.customer.address)}
      </article>
      <article class="quote-card">
        <h3>Información del documento</h3>
        <div class="quote-dates">
          <div class="quote-date"><small>Fecha de emisión</small><strong>${formatDate(quote.issueDate)}</strong></div>
          <div class="quote-date"><small>Válida hasta</small><strong>${quote.validUntil ? formatDate(quote.validUntil) : 'Sin vencimiento'}</strong></div>
        </div>
      </article>
    </section>

    <table class="quote-table">
      <thead>
        <tr><th>Concepto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th><th>Descuento</th><th>Tasa</th><th>ITBIS</th><th>Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${summary.legacy
      ? html`<p class="muted">Cotización emitida antes de la versión 1.2.0: el descuento y el ITBIS se muestran únicamente en los totales registrados.</p>`
      : ''}

    <section class="quote-financials">
      <article class="quote-notes">
        <h3>Notas y condiciones</h3>
        <p>${quote.notes?.trim() ? quote.notes : defaultNotes}</p>
      </article>
      <table class="totals">
        <tr><th>Subtotal</th><td>${formatMoney(quote.subtotal)}</td></tr>
        <tr><th>Descuento${discount ? ` (${discountPercentage.toFixed(2)} %)` : ''}</th><td>${discount ? `-${formatMoney(discount)}` : formatMoney(0)}</td></tr>
        ${summary.taxableBase !== null
          ? html`<tr><th>Base gravada</th><td>${formatMoney(summary.taxableBase)}</td></tr>`
          : html`<tr><th>Base imponible</th><td>${formatMoney(Number(quote.subtotal) - discount)}</td></tr>`}
        ${summary.exemptBase
          ? html`<tr><th>Base exenta</th><td>${formatMoney(summary.exemptBase)}</td></tr>`
          : ''}
        <tr><th>${taxLabel}</th><td>${formatMoney(quote.tax)}</td></tr>
        <tr class="grand-total"><th>Total</th><td><strong>${formatMoney(quote.total)}</strong></td></tr>
      </table>
    </section>

    <section class="quote-verification">
      <div>
        <h3>Verificación de autenticidad</h3>
        <strong>Escanea este código QR para consultar la cotización en AdminGest.</strong>
        <span>${verificationUrl}</span>
      </div>
      <img src="${safeImageSource(qrDataUrl)}" alt="QR de verificación" />
    </section>

    <footer class="quote-footer">
      <div>
        <strong>Gracias por considerar nuestra propuesta.</strong><br />
        Documento generado por AdminGest el ${generatedAt.toLocaleString('es-DO')}.
      </div>
      <div class="signature">Firma autorizada</div>
    </footer>`;
}
