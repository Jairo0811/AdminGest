const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');
const { respond } = require('./mock-demo.cjs');
const OUT = path.join(__dirname, 'shots');
fs.mkdirSync(OUT, { recursive: true });
const theme = process.argv[2] || 'dark';
const BASE = 'http://127.0.0.1:4174';
async function context(browser, loggedIn) {
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
    if (!loggedIn && u.pathname.endsWith('/auth/refresh'))
      return r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: '{"message":"Sin sesión"}',
      });
    if (u.pathname.endsWith('/health/ready'))
      return r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"status":"ready"}',
      });
    if (u.pathname.endsWith('/auth/registration'))
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{"enabled":false}' });
    const body = respond(r.request().method(), u.pathname + u.search);
    return r.fulfill(
      body === null
        ? { status: 404, contentType: 'application/json', body: '{"message":"No encontrado"}' }
        : { status: 200, contentType: 'application/json', body: JSON.stringify(body) },
    );
  });
  return ctx;
}
const shot = (page, name) =>
  page
    .screenshot({ path: path.join(OUT, `${name}-${theme}.png`) })
    .then(() => console.log('ok', name));
(async () => {
  const browser = await chromium.launch();
  const anon = await (await context(browser, false)).newPage();
  await anon.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await anon.waitForTimeout(600);
  await shot(anon, 'login');
  await anon.fill('input[type=email]', 'ana@demo.example');
  await anon.fill('input[type=password]', '••••••••••');
  await shot(anon, 'login-filled');
  const page = await (await context(browser, true)).newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await shot(page, 'dashboard');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  await page.locator('main').evaluate((m) => m.scrollTo?.(0, 500));
  await page.waitForTimeout(300);
  await shot(page, 'dashboard-scrolled');
  await page.goto(BASE + '/opportunities', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Kanban/ }).click();
  await page.waitForTimeout(700);
  await shot(page, 'opportunities-kanban');
  await page.goto(BASE + '/projects', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Cronograma/ }).click();
  await page.waitForTimeout(900);
  await shot(page, 'projects-gantt');
  await page.goto(BASE + '/quotes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await shot(page, 'quotes');
  await page.getByRole('button', { name: /Nueva cotización/ }).click();
  await page.waitForTimeout(700);
  await shot(page, 'quotes-new');
  await page.goto(BASE + '/reports', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await shot(page, 'reports');
  await page.goto(BASE + '/opportunities', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await shot(page, 'opportunities');
  await page.goto(BASE + '/customers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await shot(page, 'customers');
  await browser.close();
})();
