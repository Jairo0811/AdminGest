import QRCode from 'qrcode';

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
  icon?: string;
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

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const shortDate = new Intl.DateTimeFormat('es-DO', {
  day: '2-digit', month: 'short', year: 'numeric',
});
const longDateTime = new Intl.DateTimeFormat('es-DO', {
  day: '2-digit', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
});

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const statusLabels: Record<string, string> = {
  NEW: 'Nuevo', CONTACTED: 'Contactado', QUALIFIED: 'Calificado',
  DISQUALIFIED: 'Descartado', CONVERTED: 'Convertido', OPEN: 'Abierta',
  WON: 'Ganada', LOST: 'Perdida', PENDING: 'Pendiente', IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada', CANCELLED: 'Cancelada', PLANNED: 'Planificado',
  ACTIVE: 'Activo', ON_HOLD: 'En pausa', DRAFT: 'Borrador', SENT: 'Enviada',
  ACCEPTED: 'Aceptada', APPROVED: 'Aprobada', REJECTED: 'Rechazada',
  EXPIRED: 'Vencida', PRODUCT: 'Producto', SERVICE: 'Servicio',
};

const inferFormat = (label: string): CorporateReportColumn<unknown>['format'] => {
  const text = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (text.includes('estado') || text.includes('tipo')) return 'status';
  if (['presupuesto', 'precio', 'total', 'monto'].some((x) => text.includes(x)) || text === 'valor') return 'currency';
  if (['progreso', 'probabilidad', 'itbis', 'porcentaje'].some((x) => text.includes(x))) return 'percent';
  if (text.includes('fecha y hora')) return 'datetime';
  if (['fecha', 'emision', 'inicio', 'finalizacion', 'vencimiento'].some((x) => text.includes(x))) return 'date';
  return 'text';
};

const statusTone = (value: unknown) => {
  const status = String(value ?? '').toUpperCase();
  if (['ACTIVE', 'WON', 'COMPLETED', 'QUALIFIED', 'CONVERTED', 'ACCEPTED', 'APPROVED'].includes(status)) return 'success';
  if (['PENDING', 'DRAFT', 'PLANNED', 'CONTACTED', 'SENT', 'IN_PROGRESS'].includes(status)) return 'warning';
  if (['LOST', 'CANCELLED', 'REJECTED', 'EXPIRED', 'DISQUALIFIED'].includes(status)) return 'danger';
  return 'info';
};

const formatValue = (value: string | number | null | undefined, format?: CorporateReportColumn<unknown>['format']) => {
  if (value == null || value === '') return '—';
  if (format === 'currency') return money.format(Number(value));
  if (format === 'percent') return `${Number(value)}%`;
  if (format === 'date') return shortDate.format(new Date(String(value)));
  if (format === 'datetime') return longDateTime.format(new Date(String(value)));
  if (format === 'status') return statusLabels[String(value)] ?? String(value);
  return String(value);
};

const createReportId = (date: Date) =>
  `REP-${date.toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

const createQrSvg = (text: string) => {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const cells: string[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (qr.modules.get(row, column)) cells.push(`<rect x="${column}" y="${row}" width="1" height="1"/>`);
    }
  }
  return `<svg viewBox="-2 -2 ${size + 4} ${size + 4}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR de referencia"><rect x="-2" y="-2" width="${size + 4}" height="${size + 4}" fill="white"/><g fill="#0b2441">${cells.join('')}</g></svg>`;
};

const defaultMetrics = <T,>(title: string, items: T[], metrics: CorporateReportMetric[]) => {
  if (!title.toLowerCase().includes('proyecto')) return metrics;
  const rows = items as Array<Record<string, unknown>>;
  const budget = rows.reduce((sum, item) => sum + Number(item.budget ?? 0), 0);
  const progress = rows.length ? rows.reduce((sum, item) => sum + Number(item.progress ?? 0), 0) / rows.length : 0;
  return [
    { label: 'Proyectos', value: rows.length, tone: 'blue' as const, icon: '📁' },
    { label: 'Activos', value: rows.filter((x) => x.status === 'ACTIVE').length, tone: 'green' as const, icon: '▶' },
    { label: 'Completados', value: rows.filter((x) => x.status === 'COMPLETED').length, tone: 'green' as const, icon: '✓' },
    { label: 'Presupuesto total', value: money.format(budget), tone: 'blue' as const, icon: 'RD$' },
    { label: 'Avance promedio', value: `${progress.toFixed(1)}%`, tone: 'neutral' as const, icon: '%' },
  ];
};

const metricHtml = (metric: CorporateReportMetric) => `
  <article class="metric metric--${metric.tone ?? 'neutral'}">
    <span>${metric.icon ? `${escapeHtml(metric.icon)} ` : ''}${escapeHtml(metric.label)}</span>
    <strong>${escapeHtml(metric.value)}</strong>
  </article>`;

export function buildCorporateReportHtml<T>(options: CorporateReportOptions<T>) {
  const generatedAt = new Date();
  const reportId = createReportId(generatedAt);
  const companyName = options.companyName ?? 'AdminGest';
  const logoUrl = new URL('/brand/logo.png', window.location.origin).href;
  const portalUrl = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.trim() || window.location.origin;
  const metrics = defaultMetrics(options.title, options.items, options.metrics ?? []);
  const qr = createQrSvg(`AdminGest\n${reportId}\n${options.title}\n${companyName}\n${generatedAt.toISOString()}`);
  const firstPageSize = metrics.length ? 15 : 22;
  const pages: T[][] = [options.items.slice(0, firstPageSize)];
  for (let index = firstPageSize; index < options.items.length; index += 24) pages.push(options.items.slice(index, index + 24));
  if (!pages.length) pages.push([]);

  const table = (items: T[]) => items.length ? `
    <table><thead><tr>${options.columns.map((c) => `<th class="${c.align ?? 'left'}">${escapeHtml(c.label)}</th>`).join('')}</tr></thead>
    <tbody>${items.map((item) => `<tr>${options.columns.map((column) => {
      const raw = column.value(item);
      const format = column.format ?? inferFormat(column.label);
      const value = formatValue(raw, format);
      return format === 'status'
        ? `<td class="${column.align ?? 'left'}"><b class="status status--${statusTone(raw)}">${escapeHtml(value)}</b></td>`
        : `<td class="${column.align ?? 'left'}">${escapeHtml(value)}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table>` : '<div class="empty">No hay registros para mostrar.</div>';

  const pageHtml = pages.map((items, pageIndex) => `
    <section class="page">
      <div class="watermark">ADMINGEST</div>
      <header>
        <div class="brand"><img src="${escapeHtml(logoUrl)}" alt="AdminGest"/><div><strong>${escapeHtml(companyName)}</strong><span>Gestión Empresarial Inteligente</span><span>${options.generatedBy ? `Generado por ${escapeHtml(options.generatedBy)}` : 'Documento corporativo AdminGest'}</span><span class="folio">${escapeHtml(reportId)}</span></div></div>
        <div class="title"><small>Reporte ejecutivo</small><h1>${escapeHtml(options.title)}</h1><p>${escapeHtml(options.subtitle ?? `Emitido el ${longDateTime.format(generatedAt)}`)}</p></div>
      </header>
      ${pageIndex === 0 && metrics.length ? `<div class="metrics">${metrics.map(metricHtml).join('')}</div>` : ''}
      <div class="section-title"><h2>${pageIndex ? 'Continuación del reporte' : 'Detalle del reporte'}</h2><span>${options.items.length} registros</span></div>
      ${table(items)}
      <footer>
        <div><strong>AdminGest</strong><br/>Documento generado electrónicamente el ${escapeHtml(longDateTime.format(generatedAt))}.<br/>No requiere firma manuscrita.<span>Versión 1.0 · ${escapeHtml(companyName)} · ${escapeHtml(portalUrl)}</span></div>
        <div class="reference">${pageIndex === 0 ? qr : ''}<p><strong>${escapeHtml(reportId)}</strong><br/>Confidencial · Uso empresarial<br/>Página ${pageIndex + 1} de ${pages.length}</p></div>
      </footer>
    </section>`).join('');

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(options.title)} · ${escapeHtml(reportId)}</title><style>
    :root{--navy:#0b2441;--blue:#176fca;--green:#16805c;--ink:#17263a;--muted:#687b90;--line:#dce5ee}
    *{box-sizing:border-box}body{margin:0;background:#eaf0f6;color:var(--ink);font-family:Arial,sans-serif;line-height:1.45}.shell{width:min(1160px,calc(100% - 32px));margin:24px auto}.print{position:fixed;right:24px;top:20px;z-index:10;padding:10px 16px;border:0;border-radius:10px;color:#fff;background:#176fca;font-weight:700}.page{position:relative;min-height:770px;margin-bottom:24px;padding:30px;background:#fff;border-radius:22px;box-shadow:0 22px 60px #0f233c24;overflow:hidden;break-after:page}.page:last-child{break-after:auto}.watermark{position:absolute;left:50%;top:56%;transform:translate(-50%,-50%) rotate(-24deg);color:#0b244109;font-size:78px;font-weight:900;letter-spacing:.14em}.page>*:not(.watermark){position:relative}header{display:grid;grid-template-columns:1fr auto;gap:24px;padding-bottom:18px;border-bottom:3px solid var(--green)}.brand{display:flex;gap:16px;align-items:center}.brand img{width:100px;height:100px;object-fit:contain}.brand div{display:grid;gap:3px}.brand strong{font-size:19px}.brand span{color:var(--muted);font-size:12px}.brand .folio{color:var(--blue);font-weight:700}.title{text-align:right}.title small{color:var(--green);font-weight:800;letter-spacing:.14em;text-transform:uppercase}.title h1{margin:4px 0 6px;font-size:30px}.title p{margin:0;color:var(--muted);font-size:12px}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0}.metric{min-height:92px;padding:15px;border:1px solid var(--line);border-radius:14px;background:#fbfdff}.metric span{display:block;color:var(--muted);font-size:11px;font-weight:800;text-transform:uppercase}.metric strong{display:block;margin-top:8px;font-size:22px}.metric--blue{background:#f3f8fe}.metric--green{background:#f2faf6}.section-title{display:flex;justify-content:space-between;align-items:end;margin:22px 0 10px}.section-title h2{margin:0;color:var(--blue);font-size:15px;text-transform:uppercase;letter-spacing:.08em}.section-title span{color:var(--muted);font-size:11px}table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;font-size:10px}th{padding:11px;background:var(--navy);color:#fff;text-transform:uppercase}td{padding:10px;border-top:1px solid #e6edf4}tbody tr:nth-child(even){background:#f8fbfe}.center{text-align:center}.right{text-align:right}.status{display:inline-flex;padding:4px 8px;border-radius:999px}.status--success{color:#126142;background:#e8f7ef}.status--warning{color:#8a5700;background:#fff4d8}.status--danger{color:#9f2037;background:#fdecef}.status--info{color:#185f9f;background:#eaf4fd}.empty{padding:34px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:14px}footer{display:grid;grid-template-columns:1fr auto;gap:20px;margin-top:24px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);font-size:10px}footer span{display:block;margin-top:3px}.reference{display:flex;align-items:center;gap:10px;text-align:right}.reference svg{width:58px;height:58px;padding:3px;border:1px solid var(--line);border-radius:7px}.reference p{margin:0}@page{size:A4 landscape;margin:8mm}@media print{body{background:#fff}.shell{width:100%;margin:0}.page{min-height:0;margin:0;padding:0;border-radius:0;box-shadow:none;overflow:visible}.print{display:none}}
  </style></head><body><button class="print" onclick="window.print()">Guardar como PDF</button><main class="shell">${pageHtml}</main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),450));</script></body></html>`;
}
