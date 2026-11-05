// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { buildCorporateReport } from './corporate-report';
import { buildPrintableDocument } from './export';
import { buildGanttPrintBody } from './gantt-print';
import { escapeHtml, html, safeImageSource, SafeHtml } from './html';
import { neutralizeFormula, buildMicrosoftProjectCsv, parseMicrosoftProjectCsv } from './ms-project-csv';
import { buildQuotePrintBody, PrintableQuote, summarizeQuote } from './quote-print';

const PAYLOADS = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  "'><svg onload=alert(1)>",
  '</style><script>alert(1)</script>',
  '`${alert(1)}`',
  'Tarea & "comillas" <b>negrita</b> ñ á',
];

/** No payload may survive as markup: only escaped text is allowed. */
const expectInert = (output: string) => {
  // Payloads may only appear as escaped text, never as tags or attributes.
  expect(output).not.toMatch(/<script>alert/i);
  expect(output).not.toMatch(/<img src=x/i);
  expect(output).not.toMatch(/<svg[^>]*onload/i);
  expect(output).not.toMatch(/<b>negrita/i);
  expect(output).not.toMatch(/<[a-z]+[^>]*\son(error|load)=/i);
};

describe('html escaping', () => {
  it('escapes every special character', () => {
    expect(escapeHtml(`<>&"'\``)).toBe('&lt;&gt;&amp;&quot;&#39;&#96;');
    expect(escapeHtml(null)).toBe('');
  });

  it('escapes interpolations but keeps nested SafeHtml', () => {
    const inner = html`<b>${'<i>'}</b>`;
    expect(String(html`<p>${inner}${'<script>'}</p>`)).toBe('<p><b>&lt;i&gt;</b>&lt;script&gt;</p>');
    expect(String(html`${['<a>', html`<br/>`]}`)).toBe('&lt;a&gt;<br/>');
  });

  it('only allows same-origin, HTTPS or image data URLs as image sources', () => {
    const origin = 'https://app.admingest.test';
    expect(safeImageSource('/brand/logo.png', origin)).toBe(`${origin}/brand/logo.png`);
    expect(safeImageSource('data:image/png;base64,iVBORw0KGgo=', origin)).toMatch(/^data:image\/png/);
    expect(safeImageSource('javascript:alert(1)', origin)).toBe('');
    expect(safeImageSource('data:text/html;base64,PHNjcmlwdD4=', origin)).toBe('');
    expect(safeImageSource('http://evil.test/x.png', origin)).toBe('');
  });
});

describe('printable documents', () => {
  it('declare a CSP without network access and a single nonce script', () => {
    const page = buildPrintableDocument({
      title: PAYLOADS[3],
      styles: 'body{color:red}</style><script>alert(1)</script>',
      body: html`<p>${PAYLOADS[0]}</p>`,
      autoPrintDelayMs: 100,
    });
    const csp = (/http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(page)?.[1] ?? '').replaceAll(
      '&#39;',
      "'",
    );
    expect(csp).toContain("default-src 'none'");
    expect(csp).toMatch(/script-src 'nonce-[a-f0-9]{32}'/);
    expect(csp).not.toContain('unsafe-inline\' \'unsafe-eval');
    expect(page.match(/<script/g)).toHaveLength(1);
    expect(page).not.toContain('onclick=');
    expectInert(page);
  });

  it('escape project and task names in the Gantt chart', () => {
    const tasks = PAYLOADS.map((title, index) => ({
      title,
      status: index % 2 ? 'COMPLETED' : 'PENDING',
      progress: 140,
      startDate: '2026-11-01T00:00:00.000Z',
      dueDate: `2026-11-${String(index + 2).padStart(2, '0')}T00:00:00.000Z`,
    }));
    const output = String(buildGanttPrintBody(PAYLOADS[1], tasks, new Date('2026-11-03')));
    expectInert(output);
    expect(output).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(output).toContain('100 %');
    const percentages = [...output.matchAll(/(?:left|width):(-?[\d.]+)%/g)].map((match) => Number(match[1]));
    expect(percentages.length).toBeGreaterThan(0);
    expect(percentages.every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it('escape the corporate report title, metrics and cells', () => {
    const report = buildCorporateReport({
      title: PAYLOADS[0],
      subtitle: PAYLOADS[1],
      companyName: PAYLOADS[2],
      generatedBy: PAYLOADS[3],
      items: [{ name: PAYLOADS[4], status: PAYLOADS[5] }],
      columns: [
        { label: PAYLOADS[5], value: (item) => item.name },
        { label: 'Estado', value: (item) => item.status },
      ],
      metrics: [{ label: PAYLOADS[0], value: PAYLOADS[1], icon: PAYLOADS[2] }],
    });
    expect(report.body).toBeInstanceOf(SafeHtml);
    expectInert(String(report.body));
    expectInert(buildPrintableDocument(report));
  });
});

const baseQuote: PrintableQuote = {
  number: 'COT-2026-00001',
  status: 'SENT',
  issueDate: '2026-11-05T12:00:00.000Z',
  validUntil: null,
  subtotal: '250.00',
  discount: '25.00',
  tax: '32.40',
  total: '257.40',
  notes: null,
  customer: { name: PAYLOADS[1], taxId: PAYLOADS[0], address: PAYLOADS[2] },
  items: [
    { id: '1', description: PAYLOADS[0], quantity: '2', unitPrice: '100', taxRate: '18', lineTotal: '200', discountAmount: '20', taxAmount: '32.40' },
    { id: '2', description: 'Servicio exento', quantity: '1', unitPrice: '50', taxRate: '0', lineTotal: '50', discountAmount: '5', taxAmount: '0' },
  ],
};

describe('quote printing', () => {
  it('uses the persisted per-line rate, discount and ITBIS', () => {
    const summary = summarizeQuote(baseQuote);
    expect(summary.legacy).toBe(false);
    expect(summary.lines.map((line) => [line.rate, line.discount, line.tax, line.total])).toEqual([
      [18, 20, 32.4, 212.4],
      [0, 5, 0, 45],
    ]);
    expect(summary.taxableBase).toBe(180);
    expect(summary.exemptBase).toBe(45);
    expect(summary.uniformRate).toBe(18);
  });

  it('prints the stored totals, marks exempt lines and escapes customer data', () => {
    const output = String(
      buildQuotePrintBody({
        quote: baseQuote,
        company: { name: PAYLOADS[3], taxId: '131-24589-3' },
        verificationUrl: 'https://app.admingest.test/verify/quote/abc',
        qrDataUrl: 'data:image/png;base64,iVBORw0KGgo=',
        logoUrl: 'javascript:alert(1)',
        generatedAt: new Date('2026-11-05T12:00:00Z'),
      }),
    );
    expectInert(output);
    expect(output).toContain('Exento');
    expect(output).toContain('Base exenta');
    expect(output).toMatch(/257[.,]40/);
    expect(output).toMatch(/32[.,]40/);
    expect(output).toContain('no constituye una factura ni un comprobante fiscal');
    expect(output).not.toContain('javascript:');
  });

  it('does not invent line amounts for quotes created before v1.2.0', () => {
    const legacy = {
      ...baseQuote,
      items: baseQuote.items.map((item) => ({ ...item, discountAmount: null, taxAmount: null })),
    };
    const summary = summarizeQuote(legacy);
    expect(summary.legacy).toBe(true);
    expect(summary.lines.every((line) => line.tax === null && line.total === null)).toBe(true);
    expect(String(buildQuotePrintBody({ quote: legacy, company: { name: 'A' }, verificationUrl: 'https://x.test', qrDataUrl: '', logoUrl: '' }))).toContain(
      'antes de la versión 1.2.0',
    );
  });
});

describe('CSV formula injection', () => {
  it('neutralises formulas on export and restores them on import', () => {
    expect(neutralizeFormula('=HYPERLINK("http://evil")')).toBe('\'=HYPERLINK("http://evil")');
    expect(neutralizeFormula('Diseño')).toBe('Diseño');
    const csv = buildMicrosoftProjectCsv([
      { id: 1, name: '=1+1', durationDays: 1, percentComplete: 0, resourceNames: '@SUM(A1)', milestone: false },
    ]);
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'@SUM(A1)");
    expect(parseMicrosoftProjectCsv(csv)[0]).toMatchObject({ name: '=1+1', resourceNames: '@SUM(A1)' });
  });
});
