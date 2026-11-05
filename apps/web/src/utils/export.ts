import { createNonce, escapeHtml, html, printContentSecurityPolicy, SafeHtml } from './html';

export interface ExportColumn<T> {
  label: string;
  value: (item: T) => string | number | null | undefined;
}

const escapeXml = (value: unknown) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

/** Excel sheet names: at most 31 characters and none of : \\ / ? * [ ] */
export const sheetName = (value: string) =>
  value
    .replace(/[:\\/?*[\]]/g, ' ')
    .trim()
    .slice(0, 31) || 'Datos';

const safeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export function exportToExcel<T>(title: string, items: T[], columns: ExportColumn<T>[]) {
  const header = columns
    .map((column) => `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`)
    .join('');
  const rows = items
    .map(
      (item) =>
        `<Row>${columns
          .map((column) => {
            const value = column.value(item);
            const type = typeof value === 'number' ? 'Number' : 'String';
            return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
          })
          .join('')}</Row>`,
    )
    .join('');

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${escapeXml(sheetName(title))}">
  <Table><Row>${header}</Row>${rows}</Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(
    new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }),
    `${safeFileName(title)}-${new Date().toISOString().slice(0, 10)}.xls`,
  );
}

export function printTable<T>(title: string, items: T[], columns: ExportColumn<T>[]) {
  const styles = `
  body{font-family:Arial,sans-serif;color:#17263a;margin:32px}
  header{display:flex;justify-content:space-between;align-items:end;margin-bottom:24px}
  h1{margin:0;font-size:24px} small{color:#66788d}
  button{padding:9px 14px;border:0;border-radius:8px;color:#fff;background:#1677df;font-weight:700;cursor:pointer}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #dce4ed;padding:8px;text-align:left;vertical-align:top}
  th{background:#edf5ff;color:#153452}
  @page{size:landscape;margin:12mm}
  @media print{body{margin:0}button{display:none}}`;
  const body = html`<header>
      <div>
        <h1>${title}</h1>
        <small>AdminGest · ${new Date().toLocaleString('es-DO')}</small>
      </div>
      <button type="button" data-print>Guardar como PDF</button>
    </header>
    <table>
      <thead>
        <tr>
          ${columns.map((column) => html`<th>${column.label}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${items.map(
          (item) =>
            html`<tr>
              ${columns.map((column) => html`<td>${column.value(item)}</td>`)}
            </tr>`,
        )}
      </tbody>
    </table>`;

  openPrintWindow(buildPrintableDocument({ title, styles, body, autoPrintDelayMs: 300 }));
}

export function printDocument(title: string, body: SafeHtml) {
  const styles = `
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#17263a;margin:0;background:#eef3f8;line-height:1.45}
  .document{width:min(960px,calc(100% - 32px));margin:24px auto;padding:34px;border-radius:20px;background:#fff;box-shadow:0 18px 55px rgba(15,35,60,.12)}
  .no-print{float:right;padding:10px 16px;border:0;border-radius:10px;color:#fff;background:linear-gradient(135deg,#1677df,#148d75);font-weight:700;cursor:pointer}
  .quote-header{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:start;padding-bottom:24px;border-bottom:3px solid #18a96f}
  .quote-brand{display:flex;gap:18px;align-items:center}.quote-brand img{width:150px;max-height:76px;object-fit:contain}.quote-company{display:grid;gap:4px}.quote-company strong{font-size:18px}.quote-company span{color:#66788d;font-size:12px}
  .quote-title{text-align:right}.quote-title .label{display:block;color:#16805c;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.quote-title h1{margin:4px 0 8px;font-size:28px}.quote-status{display:inline-flex;padding:6px 10px;border-radius:999px;color:#125c45;background:#e8f8f1;font-size:11px;font-weight:800}
  .quote-meta{display:grid;grid-template-columns:1.15fr .85fr;gap:16px;margin:22px 0}.quote-card{padding:16px;border:1px solid #dfe7ef;border-radius:14px;background:#fbfdff}.quote-card h3{margin:0 0 10px;color:#176fca;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.quote-card strong{display:block;margin-bottom:4px}.quote-card p{margin:2px 0;color:#52667d;font-size:12px}.quote-dates{display:grid;grid-template-columns:1fr 1fr;gap:10px}.quote-date{padding:12px;border-radius:11px;background:#f1f6fb}.quote-date small{display:block;color:#6e8095;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.quote-date strong{margin-top:4px;font-size:13px}
  .quote-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:0;font-size:11px;overflow:hidden;border:1px solid #dce4ed;border-radius:13px}.quote-table th{padding:11px;background:#0b2441;color:#fff;text-align:left}.quote-table td{padding:11px;border-top:1px solid #e3eaf1}.quote-table tbody tr:nth-child(even){background:#f8fbfe}.quote-table td:nth-child(n+2),.quote-table th:nth-child(n+2){text-align:right;white-space:nowrap}
  .quote-financials{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:20px;align-items:start;margin-top:20px}.quote-notes{min-height:132px;padding:16px;border-radius:14px;background:#f5f8fb}.quote-notes h3{margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#176fca}.quote-notes p{margin:0;color:#52667d;font-size:12px;white-space:pre-wrap}.totals{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #dce4ed;border-radius:14px;overflow:hidden}.totals th,.totals td{padding:10px 12px;border-top:1px solid #e3eaf1;text-align:left}.totals tr:first-child th,.totals tr:first-child td{border-top:0}.totals td{text-align:right}.totals .grand-total th,.totals .grand-total td{padding:14px;color:#fff;background:linear-gradient(135deg,#1677df,#148d75);font-size:16px}
  .quote-footer{display:grid;grid-template-columns:1fr auto;gap:20px;align-items:end;margin-top:28px;padding-top:18px;border-top:1px solid #dce4ed;color:#6e8095;font-size:10px}.quote-footer strong{color:#40546c}.signature{width:210px;padding-top:30px;border-top:1px solid #9fb0c2;text-align:center;color:#40546c}
  .muted{color:#66788d}
  .quote-verification{display:grid;grid-template-columns:1fr 126px;gap:20px;align-items:center;margin-top:24px;padding:16px;border:1px solid #dce4ed;border-radius:14px;background:#f7fbf9;break-inside:avoid}.quote-verification h3{margin:0 0 6px;color:#16805c;font-size:12px;letter-spacing:.08em;text-transform:uppercase}.quote-verification strong{display:block;margin-bottom:5px}.quote-verification span{display:block;color:#66788d;font-size:10px;word-break:break-all}.quote-verification img{display:block;width:126px;height:126px;padding:5px;border:1px solid #dce4ed;border-radius:10px;background:#fff}
  .gantt-header{padding-bottom:16px;margin-bottom:18px;border-bottom:3px solid #18a96f}.gantt-header .label{color:#16805c;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.gantt-header h1{margin:4px 0;font-size:24px;overflow-wrap:anywhere}
  .gantt-table{width:100%;border-collapse:collapse;font-size:11px}.gantt-table th{padding:9px;background:#0b2441;color:#fff;text-align:left}.gantt-table td{padding:8px 9px;border-top:1px solid #e3eaf1;vertical-align:middle}.gantt-table td:first-child{overflow-wrap:anywhere;max-width:240px}.gantt-table th:last-child,.gantt-table td:last-child{width:38%}.gantt-track{position:relative;height:16px;background:#edf1f6;border-radius:5px}.gantt-bar{position:absolute;top:0;height:16px;border-radius:5px;background:#1677df}.gantt-table tr.late .gantt-bar{background:#c9344b}
  @page{size:A4;margin:10mm}
  @media print{body{background:#fff}.document{width:100%;margin:0;padding:0;border-radius:0;box-shadow:none}.no-print{display:none}.quote-header,.quote-card,.quote-table,.quote-financials,.quote-footer{break-inside:avoid}}`;

  openPrintWindow(
    buildPrintableDocument({
      title,
      styles,
      body: html`<div class="document">
        <button class="no-print" type="button" data-print>Guardar como PDF</button>${body}
      </div>`,
      autoPrintDelayMs: 350,
    }),
  );
}

interface PrintableDocument {
  title: string;
  styles: string;
  body: SafeHtml;
  /** Opens the print dialog automatically after load (omit to disable). */
  autoPrintDelayMs?: number;
  lang?: string;
}

/**
 * Wraps trusted styles and an escaped body in a standalone document protected by a
 * restrictive CSP. Buttons marked with `data-print` open the print dialog; inline event
 * handlers are not used (and would be blocked by the policy).
 */
export function buildPrintableDocument({
  title,
  styles,
  body,
  autoPrintDelayMs,
  lang = 'es',
}: PrintableDocument): string {
  const nonce = createNonce();
  const autoPrint =
    autoPrintDelayMs === undefined
      ? ''
      : `window.addEventListener('load',function(){window.focus();window.setTimeout(function(){window.print();},${Math.max(0, Math.round(autoPrintDelayMs))});});`;
  return `<!doctype html><html lang="${escapeHtml(lang)}"><head><meta charset="utf-8"/><meta http-equiv="Content-Security-Policy" content="${escapeHtml(
    printContentSecurityPolicy(nonce),
  )}"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="referrer" content="no-referrer"/><title>${escapeHtml(
    title,
  )}</title><style>${styles.replace(/</g, '')}</style></head><body>${body}<script nonce="${nonce}">document.querySelectorAll('[data-print]').forEach(function(button){button.addEventListener('click',function(){window.print();});});${autoPrint}</script></body></html>`;
}

export function openPrintWindow(html: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error(
      'El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes para AdminGest e inténtalo nuevamente.',
    );
  }

  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
