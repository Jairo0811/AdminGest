const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const { respond } = require('./mock-demo.cjs');
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const theme = process.argv[2] || 'dark';
const pages = (
  process.argv[3] ||
  '/,/customers,/opportunities,/leads,/quotes,/projects,/reports,/users,/settings,/activities,/workflows'
).split(',');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    locale: 'es-DO',
    timezoneId: 'America/Santo_Domingo',
  });
  await ctx.addInitScript((v) => localStorage.setItem('admingest-theme', v), theme);
  await ctx.route('**/api/**', (r) => {
    const u = new URL(r.request().url());
    const body = respond(r.request().method(), u.pathname + u.search);
    return r.fulfill(
      body === null
        ? { status: 404, contentType: 'application/json', body: '{"message":"No encontrado"}' }
        : { status: 200, contentType: 'application/json', body: JSON.stringify(body) },
    );
  });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto('http://127.0.0.1:4174' + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const name = (p === '/' ? 'dashboard' : p.slice(1).replace(/\//g, '-')) + '-' + theme;
    await page.screenshot({ path: path.join(OUT, name + '.png') });
    console.log('ok', name);
  }
  await browser.close();
})();
