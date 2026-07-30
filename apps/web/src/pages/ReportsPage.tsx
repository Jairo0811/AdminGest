import { useQuery } from '@tanstack/react-query';
import { BarChart3, CircleDollarSign, Target, TrendingUp } from 'lucide-react';
import { api } from '../api/client';

interface Summary {
  metrics: {
    newLeads: number;
    customers: number;
    openOpportunities: number;
    pipelineValue: number;
    pendingQuotes: number;
    activeProjects: number;
  };
}

export function ReportsPage() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Summary>('/dashboard'),
  });
  const metrics = data?.metrics;
  const conversionBase = (metrics?.newLeads ?? 0) + (metrics?.customers ?? 0);
  const customerShare = conversionBase
    ? Math.round(((metrics?.customers ?? 0) / conversionBase) * 100)
    : 0;

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Inteligencia de negocio</p>
          <h1>Reportes</h1>
          <p>Indicadores ejecutivos calculados desde la operación actual.</p>
        </div>
      </div>
      <div className="report-grid">
        <article className="report-card">
          <Target />
          <span><small>Oportunidades abiertas</small><strong>{metrics?.openOpportunities ?? 0}</strong></span>
        </article>
        <article className="report-card">
          <CircleDollarSign />
          <span>
            <small>Valor del pipeline</small>
            <strong>{new Intl.NumberFormat('es-DO', {
              style: 'currency',
              currency: 'DOP',
              notation: 'compact',
            }).format(metrics?.pipelineValue ?? 0)}</strong>
          </span>
        </article>
        <article className="report-card">
          <TrendingUp />
          <span><small>Participación de clientes</small><strong>{customerShare}%</strong></span>
        </article>
      </div>
      <article className="panel report-visual">
        <div className="panel-header">
          <div><p className="eyebrow">Carga operativa</p><h2>Distribución actual</h2></div>
          <BarChart3 />
        </div>
        {[
          ['Prospectos nuevos', metrics?.newLeads ?? 0],
          ['Cotizaciones pendientes', metrics?.pendingQuotes ?? 0],
          ['Proyectos activos', metrics?.activeProjects ?? 0],
        ].map(([label, amount]) => (
          <div className="bar-row" key={label}>
            <span>{label}</span>
            <div><i style={{ width: `${Math.min(Number(amount) * 10, 100)}%` }} /></div>
            <strong>{amount}</strong>
          </div>
        ))}
      </article>
    </section>
  );
}

