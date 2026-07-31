import { useEffect, useState } from 'react';
import { CheckCircle2, FileSearch, ShieldCheck, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { ApiError, api } from '../api/client';
import { BrandLogo } from '../components/BrandLogo';
import './quote-verification.css';

interface QuoteVerification {
  valid: boolean;
  publicCode: string;
  number: string;
  status: string;
  issueDate: string;
  validUntil?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  company: { name: string };
  customer: { name: string };
}

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
});

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
};

export function QuoteVerificationPage() {
  const { publicCode = '' } = useParams();
  const [quote, setQuote] = useState<QuoteVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<QuoteVerification>(`/quotes/verify/${encodeURIComponent(publicCode)}`)
      .then(setQuote)
      .catch((reason: unknown) => {
        setError(
          reason instanceof ApiError && reason.status === 404
            ? 'No encontramos una cotización asociada a este código.'
            : 'No fue posible verificar el documento en este momento.',
        );
      });
  }, [publicCode]);

  if (error) {
    return (
      <main className="verification-shell">
        <section className="verification-card verification-error">
          <BrandLogo />
          <XCircle size={48} />
          <h1>Documento no verificado</h1>
          <p>{error}</p>
          <small>Comprueba que el enlace esté completo o solicita una nueva copia al emisor.</small>
        </section>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="verification-shell">
        <section className="verification-card verification-loading">
          <BrandLogo />
          <FileSearch className="spin" size={42} />
          <h1>Verificando cotización…</h1>
          <p>Consultando la fuente oficial de AdminGest.</p>
        </section>
      </main>
    );
  }

  const accepted = quote.status === 'ACCEPTED';
  const invalid = quote.status === 'REJECTED';

  return (
    <main className="verification-shell">
      <section className="verification-card">
        <header className="verification-header">
          <BrandLogo />
          <span className={`verification-badge ${invalid ? 'invalid' : accepted ? 'accepted' : ''}`}>
            {invalid ? <XCircle size={18} /> : <ShieldCheck size={18} />}
            {invalid ? 'Documento rechazado' : 'Documento auténtico'}
          </span>
        </header>

        <div className="verification-hero">
          <CheckCircle2 size={44} />
          <div>
            <span>Cotización verificada</span>
            <h1>{quote.number}</h1>
            <p>Emitida por {quote.company.name}</p>
          </div>
        </div>

        <dl className="verification-grid">
          <div><dt>Estado</dt><dd>{statusLabels[quote.status] ?? quote.status}</dd></div>
          <div><dt>Cliente</dt><dd>{quote.customer.name}</dd></div>
          <div><dt>Fecha de emisión</dt><dd>{new Date(quote.issueDate).toLocaleDateString('es-DO')}</dd></div>
          <div><dt>Válida hasta</dt><dd>{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('es-DO') : 'Sin vencimiento'}</dd></div>
          <div><dt>Subtotal</dt><dd>{money.format(Number(quote.subtotal))}</dd></div>
          <div><dt>Descuento</dt><dd>{money.format(Number(quote.discount))}</dd></div>
          <div><dt>ITBIS</dt><dd>{money.format(Number(quote.tax))}</dd></div>
          <div className="verification-total"><dt>Total</dt><dd>{money.format(Number(quote.total))}</dd></div>
        </dl>

        <footer className="verification-footer">
          <p>La información fue consultada directamente en AdminGest.</p>
          <code>{quote.publicCode}</code>
        </footer>
      </section>
    </main>
  );
}
