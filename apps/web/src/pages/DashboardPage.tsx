import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CircleDollarSign,
  ContactRound,
  FileText,
  FolderKanban,
  Target,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Metric = {
  value: number;
  variation: number | null;
};

interface Dashboard {
  metrics: {
    newLeads: Metric;
    customers: Metric;
    openOpportunities: Metric;
    pipelineValue: Metric;
    pendingQuotes: Metric;
    activeProjects: Metric;
  };
  salesEvolution: Array<{
    key: string;
    month: string;
    value: number;
    wonValue: number;
    count: number;
  }>;
  opportunitiesByStage: Array<{
    id: string;
    name: string;
    probability: number;
    count: number;
    value: number;
  }>;
  upcomingActivities: Array<{
    id: string;
    subject: string;
    type: string;
    scheduledAt: string;
    customer?: { name: string };
    opportunity?: { name: string };
  }>;
  recentOpportunities: Array<{
    id: string;
    name: string;
    estimatedValue: number;
    customer: { name: string };
    pipelineStage: { name: string };
  }>;
}

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat('es-DO', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function MetricTrend({ variation }: { variation: number | null }) {
  if (variation === null) {
    return <span className="metric-trend neutral">Sin período comparable</span>;
  }

  const positive = variation >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;

  return (
    <span className={`metric-trend ${positive ? 'positive' : 'negative'}`}>
      <Icon size={14} />
      {Math.abs(variation)}% vs. 30 días previos
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="metrics">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="metric-card skeleton-card" key={index}>
            <span className="skeleton skeleton-icon" />
            <div className="skeleton-stack">
              <span className="skeleton skeleton-line short" />
              <span className="skeleton skeleton-line value" />
              <span className="skeleton skeleton-line trend" />
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-premium-grid">
        <div className="panel skeleton-panel" />
        <div className="panel skeleton-panel" />
      </div>
    </>
  );
}

function SalesChart({ data }: { data: Dashboard['salesEvolution'] }) {
  const width = 720;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 42, left: 58 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((item) => item.value), 1);
  const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const points = data.map((item, index) => ({
    x: padding.left + index * step,
    y: padding.top + chartHeight - (item.value / max) * chartHeight,
    ...item,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${padding.left},${padding.top + chartHeight} ${line} ${padding.left + chartWidth},${padding.top + chartHeight}`;

  return (
    <div className="chart-shell" aria-label="Evolución mensual del valor de oportunidades">
      <svg className="sales-chart" role="img" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="salesArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#1677df" stopOpacity="0.28" />
            <stop offset="1" stopColor="#1677df" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          return (
            <g key={ratio}>
              <line className="chart-grid-line" x1={padding.left} x2={padding.left + chartWidth} y1={y} y2={y} />
              <text className="chart-axis-label" x={padding.left - 10} y={y + 4} textAnchor="end">
                {compactNumber.format(max * ratio)}
              </text>
            </g>
          );
        })}

        <polygon fill="url(#salesArea)" points={area} />
        <polyline className="chart-line" fill="none" points={line} />

        {points.map((point) => (
          <g key={point.key}>
            <circle className="chart-point" cx={point.x} cy={point.y} r="5" />
            <text className="chart-axis-label month" x={point.x} y={height - 14} textAnchor="middle">
              {point.month}
            </text>
            <title>{`${point.month}: ${currency.format(point.value)} · ${point.count} oportunidades`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

function PipelineFunnel({ stages }: { stages: Dashboard['opportunitiesByStage'] }) {
  const maxCount = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <div className="funnel-list">
      {stages.map((stage, index) => {
        const width = 44 + (stage.count / maxCount) * 56;
        return (
          <div className="funnel-stage" key={stage.id}>
            <div className="funnel-stage-meta">
              <span>{stage.name}</span>
              <strong>{stage.count}</strong>
            </div>
            <div className="funnel-track">
              <div className="funnel-fill" style={{ width: `${width}%`, opacity: 1 - index * 0.08 }}>
                <span>{currency.format(stage.value)}</span>
              </div>
            </div>
            <small>{stage.probability}% de probabilidad</small>
          </div>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Dashboard>('/dashboard'),
  });

  const metrics = data
    ? [
        { label: 'Prospectos nuevos', metric: data.metrics.newLeads, icon: ContactRound },
        { label: 'Clientes activos', metric: data.metrics.customers, icon: UsersRound },
        { label: 'Oportunidades', metric: data.metrics.openOpportunities, icon: Target },
        { label: 'Pipeline estimado', metric: data.metrics.pipelineValue, icon: CircleDollarSign, currency: true },
        { label: 'Cotizaciones pendientes', metric: data.metrics.pendingQuotes, icon: FileText },
        { label: 'Proyectos activos', metric: data.metrics.activeProjects, icon: FolderKanban },
      ]
    : [];

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Resumen ejecutivo</p>
          <h1>Buenos días, {user?.firstName}</h1>
          <p>Estas son las prioridades comerciales y operativas de tu empresa.</p>
        </div>
        <span className="date-chip">
          <CalendarDays size={17} />
          {new Intl.DateTimeFormat('es-DO', { dateStyle: 'long' }).format(new Date())}
        </span>
      </div>

      {error && <div className="alert error">{(error as Error).message}</div>}
      {isLoading && <DashboardSkeleton />}

      {data && (
        <>
          <div className="metrics">
            {metrics.map(({ label, metric, icon: Icon, currency: isCurrency }) => (
              <article className="metric-card metric-card-premium" key={label}>
                <div className="metric-icon"><Icon size={21} /></div>
                <div className="metric-content">
                  <p>{label}</p>
                  <strong>{isCurrency ? currency.format(metric.value) : metric.value}</strong>
                  <MetricTrend variation={metric.variation} />
                </div>
              </article>
            ))}
          </div>

          <div className="dashboard-premium-grid">
            <article className="panel chart-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Últimos 6 meses</p>
                  <h2>Evolución comercial</h2>
                </div>
                <span className="panel-caption">Valor de oportunidades creadas</span>
              </div>
              {data.salesEvolution.some((item) => item.value > 0)
                ? <SalesChart data={data.salesEvolution} />
                : <div className="empty-state chart-empty">Aún no hay datos suficientes para mostrar la evolución comercial.</div>}
            </article>

            <article className="panel funnel-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Embudo comercial</p>
                  <h2>Oportunidades por etapa</h2>
                </div>
              </div>
              {data.opportunitiesByStage.length
                ? <PipelineFunnel stages={data.opportunitiesByStage} />
                : <div className="empty-state compact">No hay etapas configuradas.</div>}
            </article>
          </div>

          <div className="dashboard-grid dashboard-detail-grid">
            <article className="panel">
              <div className="panel-header">
                <div><p className="eyebrow">Pipeline comercial</p><h2>Oportunidades recientes</h2></div>
              </div>
              <div className="opportunity-list">
                {data.recentOpportunities.length ? data.recentOpportunities.map((item) => (
                  <div className="opportunity-row" key={item.id}>
                    <div className="opportunity-main">
                      <strong>{item.name}</strong><span>{item.customer.name}</span>
                    </div>
                    <span className="status-badge blue">{item.pipelineStage.name}</span>
                    <strong>{currency.format(Number(item.estimatedValue))}</strong>
                  </div>
                )) : <div className="empty-state compact">No hay oportunidades abiertas.</div>}
              </div>
            </article>

            <article className="panel">
              <div className="panel-header">
                <div><p className="eyebrow">Próximos 7 días</p><h2>Actividades próximas</h2></div>
              </div>
              <div className="activity-list">
                {data.upcomingActivities.length ? data.upcomingActivities.map((item) => (
                  <div className="activity-item" key={item.id}>
                    <CalendarDays size={18} />
                    <div>
                      <strong>{item.subject}</strong>
                      <span>
                        {new Intl.DateTimeFormat('es-DO', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(new Date(item.scheduledAt))}
                        {item.customer ? ` · ${item.customer.name}` : ''}
                        {!item.customer && item.opportunity ? ` · ${item.opportunity.name}` : ''}
                      </span>
                    </div>
                  </div>
                )) : <div className="empty-state compact">Tu agenda está despejada.</div>}
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
