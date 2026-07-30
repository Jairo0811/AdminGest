import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  CircleDollarSign,
  ContactRound,
  FileText,
  FolderKanban,
  Target,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, formatCurrency, formatDate } from '../lib/api';
import { DashboardData } from '../types';

export function DashboardPage() {
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardData>('/dashboard'),
  });

  if (dashboard.isPending) return <div className="loading-card">Preparando tus indicadores…</div>;
  if (dashboard.isError) return <div className="error-card">{dashboard.error.message}</div>;

  const data = dashboard.data;
  const currency = data.company.currency;
  const maxPipeline = Math.max(...data.pipeline.map((stage) => stage.value), 1);
  const metrics = [
    {
      label: 'Prospectos nuevos',
      value: data.metrics.newLeads,
      detail: 'registrados este mes',
      icon: ContactRound,
      tone: 'blue',
    },
    {
      label: 'Clientes activos',
      value: data.metrics.activeCustomers,
      detail: 'en la cartera actual',
      icon: UsersRound,
      tone: 'green',
    },
    {
      label: 'Pipeline abierto',
      value: data.metrics.openOpportunities,
      detail: formatCurrency(data.metrics.pipelineValue, currency),
      icon: Target,
      tone: 'purple',
    },
    {
      label: 'Cotizaciones pendientes',
      value: data.metrics.pendingQuotes,
      detail: formatCurrency(data.metrics.pendingQuotesValue, currency),
      icon: FileText,
      tone: 'orange',
    },
    {
      label: 'Proyectos activos',
      value: data.metrics.activeProjects,
      detail: `${data.metrics.overdueTasks} tareas vencidas`,
      icon: FolderKanban,
      tone: 'cyan',
    },
    {
      label: 'Gastos del mes',
      value: formatCurrency(data.metrics.monthlyExpenses, currency),
      detail: `${data.metrics.lowStockItems} productos por reponer`,
      icon: CircleDollarSign,
      tone: 'red',
    },
  ];

  return (
    <div className="page-stack">
      <section className="welcome-banner">
        <div>
          <p className="eyebrow light">Hoy en {data.company.name}</p>
          <h2>Tu operación, de un vistazo</h2>
          <p>Prioriza las oportunidades, actividades y proyectos que necesitan atención.</p>
        </div>
        <div className="quick-actions">
          <Link className="secondary-button light-button" to="/prospectos">Nuevo prospecto</Link>
          <Link className="primary-button compact" to="/proyectos">Ver proyectos</Link>
        </div>
      </section>

      <section className="metrics" aria-label="Indicadores principales">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className="metric-card" key={label}>
            <div className={`metric-icon tone-${tone}`}><Icon size={21} /></div>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel pipeline-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Embudo comercial</p>
              <h2>Valor por etapa</h2>
            </div>
            <Link className="text-link" to="/oportunidades">Abrir pipeline</Link>
          </div>
          <div className="pipeline-chart">
            {data.pipeline.filter((stage) => !['Ganada', 'Perdida'].includes(stage.name)).map((stage) => (
              <div className="pipeline-row" key={stage.id}>
                <div className="pipeline-label">
                  <span>{stage.name}</span>
                  <small>{stage.count} oportunidades</small>
                </div>
                <div className="pipeline-track">
                  <span style={{ width: `${Math.max((stage.value / maxPipeline) * 100, stage.count ? 8 : 0)}%` }} />
                </div>
                <strong>{formatCurrency(stage.value, currency)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="panel activities-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Agenda</p>
              <h2>Próximas actividades</h2>
            </div>
            <Link className="text-link" to="/actividades">Ver agenda</Link>
          </div>
          <div className="activity-list">
            {data.upcomingActivities.length === 0 && (
              <div className="empty-inline">No hay actividades pendientes.</div>
            )}
            {data.upcomingActivities.map((activity) => (
              <div className="activity-item" key={activity.id}>
                <CalendarDays size={18} />
                <div>
                  <strong>{activity.subject}</strong>
                  <span>{activity.customer?.name ?? activity.type} · {formatDate(activity.scheduledAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Movimiento reciente</p>
            <h2>Oportunidades actualizadas</h2>
          </div>
          {data.metrics.overdueTasks > 0 && (
            <span className="attention-chip"><AlertTriangle size={16} /> {data.metrics.overdueTasks} tareas vencidas</span>
          )}
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Oportunidad</th><th>Cliente</th><th>Etapa</th><th className="align-right">Valor</th></tr>
            </thead>
            <tbody>
              {data.recentOpportunities.map((opportunity) => (
                <tr key={opportunity.id}>
                  <td><strong>{opportunity.name}</strong></td>
                  <td>{opportunity.customer.name}</td>
                  <td><span className="stage">{opportunity.pipelineStage.name}</span></td>
                  <td className="align-right"><strong>{formatCurrency(opportunity.estimatedValue, currency)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
