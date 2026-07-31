import { useQuery } from '@tanstack/react-query';
import { BarChart3, CircleDollarSign, Target, TrendingUp } from 'lucide-react';
import { api } from '../api/client';

type Metric = {
  value: number;
  variation: number | null;
};

interface Summary {
  metrics: {
    newLeads: Metric;
    customers: Metric;
    openOpportunities: Metric;
    pipelineValue: Metric;
    pendingQuotes: Metric;
    activeProjects: Metric;
  };
}

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function ReportsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Summary>('/dashboard'),
  });

  const metrics = data?.metrics;
  const newLeads = metrics?.newLeads.value ?? 0;
  const customers = metrics?.customers.value ?? 0;
  const openOpportunities = metrics?.openOpportunities.value ?? 0;
  const pipelineValue = metrics?.pipelineValue.value ?? 0;
  const pendingQuotes = metrics?.pendingQuotes.value ?? 0;
  const activeProjects = metrics?.activeProjects.value ?? 0;
  const conversionBase = newLeads + customers;
  const customerShare = conversionBase
    ? Math.round((customers / conversionBase) * 100)
    : 0;

  const distribution = [
    ['Prospectos nuevos', newLeads],
    ['Cotizaciones pendientes', pendingQuotes],
    ['Proyectos activos', activeProjects],
  ] as const;
  const maxDistribution = Math.max(...distribution.map(([, amount]) => amount), 1);

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inteligencia de negocio</p>
          <h1>Reportes</h1>
          <p>Indicadores ejecutivos calculados desde la operación actual.</p>
        </div>
      </div>

      {error && <div className="alert error">{(error as Error).message}</div>}

      {isLoading ? (
        <div className="report-grid" aria-label="Cargando reportes">
          {Array.from({ length: 3 }, (_, index) => (
            <article className="report-card skeleton-card" key={index}>
              <span className="skeleton skeleton-icon" />
              <span className="skeleton-stack">
                <span className="skeleton skeleton-line short" />
                <span className="skeleton skeleton-line value" />
              </span>
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="report-grid">
            <article className="report-card">
              <Target />
              <span>
                <small>Oportunidades abiertas</small>
                <strong>{openOpportunities}</strong>
              </span>
            </article>
            <article className="report-card">
              <CircleDollarSign />
              <span>
                <small>Valor del pipeline</small>
                <strong>{currency.format(pipelineValue)}</strong>
              </span>
            </article>
            <article className="report-card">
              <TrendingUp />
              <span>
                <small>Participación de clientes</small>
                <strong>{customerShare}%</strong>
              </span>
            </article>
          </div>

          <article className="panel report-visual">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Carga operativa</p>
                <h2>Distribución actual</h2>
              </div>
              <BarChart3 />
            </div>
            {distribution.map(([label, amount]) => (
              <div className="bar-row" key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${(amount / maxDistribution) * 100}%` }} />
                </div>
                <strong>{amount}</strong>
              </div>
            ))}
          </article>
        </>
      )}
    </section>
  );
}
