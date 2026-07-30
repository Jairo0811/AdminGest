import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CircleDollarSign,
  ContactRound,
  FileText,
  FolderKanban,
  Target,
  UsersRound,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Dashboard {
  metrics: {
    newLeads: number;
    customers: number;
    openOpportunities: number;
    pipelineValue: number;
    pendingQuotes: number;
    activeProjects: number;
  };
  upcomingActivities: Array<{
    id: string;
    subject: string;
    type: string;
    scheduledAt: string;
    customer?: { name: string };
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

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Dashboard>('/dashboard'),
  });

  const metrics = [
    { label: 'Prospectos nuevos', value: data?.metrics.newLeads ?? 0, icon: ContactRound },
    { label: 'Clientes activos', value: data?.metrics.customers ?? 0, icon: UsersRound },
    { label: 'Oportunidades', value: data?.metrics.openOpportunities ?? 0, icon: Target },
    {
      label: 'Pipeline estimado',
      value: currency.format(data?.metrics.pipelineValue ?? 0),
      icon: CircleDollarSign,
    },
    { label: 'Cotizaciones pendientes', value: data?.metrics.pendingQuotes ?? 0, icon: FileText },
    { label: 'Proyectos activos', value: data?.metrics.activeProjects ?? 0, icon: FolderKanban },
  ];

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
      <div className="metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div className="metric-icon"><Icon size={21} /></div>
            <div><p>{label}</p><strong>{isLoading ? '—' : value}</strong></div>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-header">
            <div><p className="eyebrow">Pipeline comercial</p><h2>Oportunidades recientes</h2></div>
          </div>
          <div className="opportunity-list">
            {data?.recentOpportunities.length ? data.recentOpportunities.map((item) => (
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
            <div><p className="eyebrow">Próximos 7 días</p><h2>Agenda</h2></div>
          </div>
          <div className="activity-list">
            {data?.upcomingActivities.length ? data.upcomingActivities.map((item) => (
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
                  </span>
                </div>
              </div>
            )) : <div className="empty-state compact">Tu agenda está despejada.</div>}
          </div>
        </article>
      </div>
    </section>
  );
}
