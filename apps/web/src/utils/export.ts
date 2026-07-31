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

const safeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export function exportToExcel<T>(
  title: string,
  items: T[],
  columns: ExportColumn<T>[],
) {
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
 <Worksheet ss:Name="${escapeXml(title).slice(0, 31)}">
  <Table><Row>${header}</Row>${rows}</Table>
 </Worksheet>
</Workbook>`;

  downloadBlob(
    new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' }),
    `${safeFileName(title)}-${new Date().toISOString().slice(0, 10)}.xls`,
  );
}

export function printTable<T>(
  title: string,
  items: T[],
  columns: ExportColumn<T>[],
) {
  const rows = items
    .map(
      (item) =>
        `<tr>${columns
          .map((column) => `<td>${escapeXml(column.value(item))}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeXml(title)}</title>
<style>
  body{font-family:Arial,sans-serif;color:#17263a;margin:32px}
  header{display:flex;justify-content:space-between;align-items:end;margin-bottom:24px}
  h1{margin:0;font-size:24px} small{color:#66788d}
  button{padding:9px 14px;border:0;border-radius:8px;color:#fff;background:#1677df;font-weight:700;cursor:pointer}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #dce4ed;padding:8px;text-align:left;vertical-align:top}
  th{background:#edf5ff;color:#153452}
  @page{size:landscape;margin:12mm}
  @media print{body{margin:0}button{display:none}}
</style>
</head>
<body>
<header><div><h1>${escapeXml(title)}</h1><small>AdminGest · ${new Date().toLocaleString('es-DO')}</small></div><button type="button" onclick="window.print()">Guardar como PDF</button></header>
<table><thead><tr>${columns.map((column) => `<th>${escapeXml(column.label)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
<script>
  window.addEventListener('load', () => {
    window.focus();
    window.setTimeout(() => window.print(), 300);
  });
</script>
</body></html>`;

  openPrintWindow(html);
}

export function printDocument(title: string, body: string) {
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><title>${escapeXml(title)}</title><style>
  body{font-family:Arial,sans-serif;color:#17263a;margin:32px;line-height:1.45}
  .document{max-width:900px;margin:0 auto}.brand{font-size:28px;font-weight:800;color:#1267d5}
  .brand span{color:#18a96f}.muted{color:#66788d}.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0}
  .summary div{border:1px solid #dce4ed;border-radius:8px;padding:12px}table{width:100%;border-collapse:collapse;margin-top:20px}
  th,td{border:1px solid #dce4ed;padding:9px;text-align:left}th{background:#edf5ff}.totals{margin-left:auto;width:320px;margin-top:20px}
  .no-print{padding:9px 14px;border:0;border-radius:8px;color:#fff;background:#1677df;font-weight:700;cursor:pointer}
  @page{margin:12mm}
  @media print{body{margin:0}.no-print{display:none}}
  </style></head><body><div class="document"><button class="no-print" type="button" onclick="window.print()">Guardar como PDF</button>${body}</div><script>
  window.addEventListener('load', () => {
    window.focus();
    window.setTimeout(() => window.print(), 300);
  });
  </script></body></html>`;

  openPrintWindow(html);
}

function openPrintWindow(html: string) {
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
