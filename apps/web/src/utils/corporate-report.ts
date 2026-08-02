export interface CorporateReportColumn<T> {
  label: string;
  value: (item: T) => string | number | null | undefined;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'currency' | 'percent' | 'date' | 'datetime' | 'status';
}

export interface CorporateReportMetric {
  label: string;
  value: string | number;
  tone?: 'blue' | 'green' | 'neutral';
}

export interface CorporateReportOptions<T> {
  title: string;
  subtitle?: string;
  companyName?: string;
  generatedBy?: string;
  items: T[];
  columns: CorporateReportColumn<T>[];
  metrics?: CorporateReportMetric[];
}

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 2,
});

const statusLabels: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  DISQUALIFIED: 'Descartado',
  CONVERTED: 'Convertido',
  OPEN: 'Abierta',
  WON: 'Ganada',
  LOST: 'Perdida',
  PENDING: 'Pendiente',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  PLANNED: 'Planificado',
  ACTIVE: 'Activo',
  ON_HOLD: 'En pausa',
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
};

const formatValue = (
  value: string | number | null | undefined,
  format: CorporateReportColumn<unknown>['format'],
) => {
  if (value == null || value === '') return '—';

  if (format === 'currency') return money.format(Number(value));
  if (format === 'percent') return `${Number(value)}%`;
  if (format === 'date') return new Date(String(value)).toLocaleDateString('es-DO');
  if (format === 'datetime') return new Date(String(value)).toLocaleString('es-DO');
  if (format === 'status') return statusLabels[String(value)] ?? String(value);

  return String(value);
};

const metricMarkup = (metrics: CorporateReportMetric[]) =>
  metrics
    .map(
      (metric) => `
        <article class="report-metric report-metric--${metric.tone ?? 'neutral'}">
          <span>${escapeHtml(metric.label)}</span>
          <strong>${escapeHtml(metric.value)}</strong>
        </article>`,
    )
    .join('');

export function buildCorporateReportHtml<T>({
  title,
  subtitle,
  companyName = 'AdminGest',
  generatedBy,
  items,
  columns,
  metrics = [],
}: CorporateReportOptions<T>) {
  const generatedAt = new Date();
  const rows = items
    .map(
      (item) => `
        <tr>
          ${columns
            .map((column) => {
              const formatted = formatValue(column.value(item), column.format);
              const statusClass = column.format === 'status' ? ' report-status' : '';
              return `<td class="align-${column.align ?? 'left'}${statusClass}">${escapeHtml(formatted)}</td>`;
            })
            .join('')}
        </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  :root{color-scheme:light;--navy:#0b2441;--blue:#176fca;--green:#16805c;--ink:#17263a;--muted:#687b90;--line:#dce5ee;--soft:#f3f7fb}
  *{box-sizing:border-box}
  body{margin:0;background:#eaf0f6;color:var(--ink);font-family:Arial,Helvetica,sans-serif;line-height:1.45}
  .report{width:min(1120px,calc(100% - 32px));margin:24px auto;padding:30px;background:#fff;border-radius:22px;box-shadow:0 22px 60px rgba(15,35,60,.14)}
  .report-print{float:right;padding:10px 16px;border:0;border-radius:10px;color:#fff;background:linear-gradient(135deg,#176fca,#164f88);font-weight:700;cursor:pointer}
  .report-header{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:start;padding-bottom:20px;border-bottom:3px solid var(--green)}
  .report-brand{display:flex;gap:16px;align-items:center}.report-logo{width:76px;height:76px;border-radius:18px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#176fca,#16805c);font-size:24px;font-weight:900;letter-spacing:-.08em}
  .report-company{display:grid;gap:3px}.report-company strong{font-size:18px}.report-company span{color:var(--muted);font-size:12px}
  .report-title{text-align:right}.report-title small{display:block;color:var(--green);font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.report-title h1{margin:4px 0 6px;font-size:30px;line-height:1.08}.report-title p{margin:0;color:var(--muted);font-size:12px}
  .report-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}
  .report-metric{min-height:92px;padding:15px;border:1px solid var(--line);border-radius:14px;background:#fbfdff}.report-metric span{display:block;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.report-metric strong{display:block;margin-top:8px;font-size:22px}.report-metric--blue{border-color:#cfe3f8;background:#f3f8fe}.report-metric--green{border-color:#cfe9dc;background:#f2faf6}
  .report-section-title{display:flex;justify-content:space-between;align-items:end;margin:22px 0 10px}.report-section-title h2{margin:0;font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:var(--blue)}.report-section-title span{color:var(--muted);font-size:11px}
  .report-table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;font-size:10px}
  .report-table th{padding:11px;background:var(--navy);color:#fff;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em}.report-table td{padding:10px;border-top:1px solid #e6edf4;vertical-align:top}.report-table tbody tr:nth-child(even){background:#f8fbfe}.align-center{text-align:center}.align-right{text-align:right}.report-status{font-weight:800;color:var(--green)}
  .report-empty{padding:34px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px;background:var(--soft)}
  .report-footer{display:grid;grid-template-columns:1fr auto;gap:20px;margin-top:24px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:10px}.report-footer strong{color:#40546c}.report-page-note{text-align:right}
  @page{size:A4 landscape;margin:10mm}
  @media print{body{background:#fff}.report{width:100%;margin:0;padding:0;border-radius:0;box-shadow:none}.report-print{display:none}.report-header,.report-metrics,.report-table,.report-footer{break-inside:avoid}}
</style>
</head>
<body>
<main class="report">
  <button class="report-print" type="button" onclick="window.print()">Guardar como PDF</button>
  <header class="report-header">
    <div class="report-brand">
      <div class="report-logo">AG</div>
      <div class="report-company">
        <strong>${escapeHtml(companyName)}</strong>
        <span>Gestión Empresarial Inteligente</span>
        <span>${generatedBy ? `Generado por ${escapeHtml(generatedBy)}` : 'Documento corporativo AdminGest'}</span>
      </div>
    </div>
    <div class="report-title">
      <small>Reporte ejecutivo</small>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(subtitle ?? `Emitido el ${generatedAt.toLocaleString('es-DO')}`)}</p>
    </div>
  </header>
  ${metrics.length ? `<section class="report-metrics">${metricMarkup(metrics)}</section>` : ''}
  <div class="report-section-title"><h2>Detalle del reporte</h2><span>${items.length} registros</span></div>
  ${items.length ? `<table class="report-table"><thead><tr>${columns.map((column) => `<th class="align-${column.align ?? 'left'}">${escapeHtml(column.label)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>` : '<div class="report-empty">No hay registros para mostrar.</div>'}
  <footer class="report-footer">
    <div><strong>AdminGest</strong><br/>Documento generado automáticamente el ${escapeHtml(generatedAt.toLocaleString('es-DO'))}.</div>
    <div class="report-page-note">Confidencial · Uso empresarial<br/>Gestión Empresarial Inteligente</div>
  </footer>
</main>
<script>
window.addEventListener('load',()=>{window.focus();window.setTimeout(()=>window.print(),350)});
</script>
</body>
</html>`;
}
