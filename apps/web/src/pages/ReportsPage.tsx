import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp } from 'lucide-react';
import { api, formatCurrency } from '../lib/api';
import { DashboardData } from '../types';

export function ReportsPage() {
  const report = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<DashboardData>('/dashboard'),
  });
  if (report.isPending) return <div className="loading-card">Generando reporte…</div>;
  if (report.isError) return <div className="error-card">{report.error.message}</div>;

  const data = report.data;
  const maximum = Math.max(...data.pipeline.map((stage) => stage.value), 1);
  const netProjection = data.metrics.pipelineValue - data.metrics.monthlyExpenses;

  function exportCsv() {
    const rows = [
      ['Indicador', 'Valor'],
      ['Prospectos nuevos', data.metrics.newLeads],
      ['Clientes activos', data.metrics.activeCustomers],
      ['Oportunidades abiertas', data.metrics.openOpportunities],
      ['Valor del pipeline', data.metrics.pipelineValue],
      ['Cotizaciones pendientes', data.metrics.pendingQuotes],
      ['Proyectos activos', data.metrics.activeProjects],
      ['Gastos del mes', data.metrics.monthlyExpenses],
      ...data.pipeline.map((stage) => [`Pipeline - ${stage.name}`, stage.value]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `admingest-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-stack">
      <section className="page-toolbar">
        <div className="toolbar-summary"><TrendingUp size={20} /><span>Resumen ejecutivo de {data.company.name}</span></div>
        <button className="secondary-button" type="button" onClick={exportCsv}><Download size={17} /> Exportar CSV</button>
      </section>
      <section className="report-summary">
        <article><span>Valor en pipeline</span><strong>{formatCurrency(data.metrics.pipelineValue, data.company.currency)}</strong><small>{data.metrics.openOpportunities} oportunidades</small></article>
        <article><span>Cotizaciones en curso</span><strong>{formatCurrency(data.metrics.pendingQuotesValue, data.company.currency)}</strong><small>{data.metrics.pendingQuotes} documentos</small></article>
        <article><span>Gastos registrados</span><strong>{formatCurrency(data.metrics.monthlyExpenses, data.company.currency)}</strong><small>mes en curso</small></article>
        <article className={netProjection >= 0 ? 'positive' : 'negative'}><span>Proyección bruta</span><strong>{formatCurrency(netProjection, data.company.currency)}</strong><small>pipeline menos gastos</small></article>
      </section>
      <article className="panel">
        <div className="panel-header"><div><p className="eyebrow">Análisis comercial</p><h2>Distribución del pipeline</h2></div></div>
        <div className="report-bars">
          {data.pipeline.map((stage) => (
            <div className="report-bar" key={stage.id}>
              <div><strong>{stage.name}</strong><span>{stage.count} oportunidades</span></div>
              <div className="report-bar-track"><span style={{ width: `${(stage.value / maximum) * 100}%` }} /></div>
              <strong>{formatCurrency(stage.value, data.company.currency)}</strong>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
