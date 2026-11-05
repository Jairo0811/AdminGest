import { useState } from 'react';
import { LoaderCircle, Printer } from 'lucide-react';
import { api } from '../api/client';
import { Entity, EntityPage } from '../components/EntityPage';
import { printDocument } from '../utils/export';
import {
  buildQuotePrintBody,
  PrintableCompany,
  PrintableQuote,
  QUOTE_STATUS_LABELS,
} from '../utils/quote-print';
import {
  buildQuoteVerificationUrl,
  createQuoteVerificationQr,
} from '../utils/quote-verification';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

const clampPercentage = (value: number) => Math.min(100, Math.max(0, value));

export function QuotesPage() {
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [printError, setPrintError] = useState('');

  const printQuote = async (id: string) => {
    if (printingId) return;
    setPrintingId(id);
    setPrintError('');
    try {
      const [quote, company] = await Promise.all([
        api<PrintableQuote & { publicCode?: string }>(`/quotes/${id}`),
        api<PrintableCompany>('/company'),
      ]);

      if (!quote.publicCode) {
        throw new Error('La cotización no tiene un código público de verificación.');
      }

      const verificationUrl = buildQuoteVerificationUrl(quote.publicCode);
      const qrDataUrl = await createQuoteVerificationQr(verificationUrl);
      const logoUrl = new URL('/brand/logo.png', window.location.origin).href;
      printDocument(
        `Cotización ${quote.number}`,
        buildQuotePrintBody({ quote, company, verificationUrl, qrDataUrl, logoUrl }),
      );
    } catch (error) {
      setPrintError(error instanceof Error ? error.message : 'No fue posible preparar la cotización.');
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
        // Same integer-cent rounding as the server, so the discount never exceeds the
        // subtotal. The server recalculates and persists every amount.
        const subtotalCents = Math.round(
          (Math.round(quantity * 100) * Math.round(unitPrice * 100)) / 100,
        );
        const discountCents = Math.round((subtotalCents * discountPercentage) / 100);

        return {
          customerId: values.customerId,
          validUntil: values.validUntil || undefined,
          discount: discountCents / 100,
          notes: values.notes || undefined,
          items: [
            {
              description: values.itemDescription,
              quantity,
              unitPrice,
              taxRate: Number(values.taxRate ?? 18),
            },
          ],
        };
      }}
      canEdit={false}
      gender="f"
      pageAlert={printError ? <div className="alert error" role="alert">{printError}</div> : null}
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
          render: (item) => <span className="status-badge">{QUOTE_STATUS_LABELS[String(item.status)] ?? String(item.status)}</span>,
        },
        {
          label: 'Líneas',
          exportValue: (item) => Number((item._count as Entity)?.items ?? 0),
          exportAlign: 'center',
          render: (item) => String((item._count as Entity)?.items ?? 0),
        },
      ]}
      description="Propuestas comerciales con descuento, ITBIS por línea (18 % o exento) calculado por el servidor y verificación mediante QR."
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
        { name: 'discountPercentage', label: 'Descuento (%)', type: 'number', defaultValue: 0, min: 0, max: 100, step: '0.01' },
        { name: 'itemDescription', label: 'Concepto', required: true, maxLength: 500 },
        { name: 'quantity', label: 'Cantidad', type: 'number', defaultValue: 1, required: true, min: 0.01, step: '0.01' },
        { name: 'unitPrice', label: 'Precio unitario (RD$)', type: 'number', required: true, min: 0, step: '0.01' },
        {
          name: 'taxRate',
          label: 'ITBIS',
          type: 'select',
          required: true,
          defaultValue: '18',
          options: [
            { value: '18', label: 'Gravado 18 %' },
            { value: '0', label: 'Exento (0 %)' },
          ],
        },
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
