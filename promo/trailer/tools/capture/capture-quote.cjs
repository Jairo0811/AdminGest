const { chromium } = require('playwright');
const path = require('node:path');
const { respond } = require('./mock-demo.cjs');
const theme = process.argv[2] || 'dark';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 2,
    locale: 'es-DO',
    timezoneId: 'America/Santo_Domingo',
  });
  await ctx.addInitScript((v) => localStorage.setItem('admingest-theme', v), theme);
  await ctx.route('**/api/**', (r) => {
    const u = new URL(r.request().url());
    const b = respond(r.request().method(), u.pathname + u.search);
    return r.fulfill({
      status: b ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(b ?? { message: 'x' }),
    });
  });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:4174/quotes', { waitUntil: 'networkidle' });
  const [popup] = await Promise.all([
    ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null),
    page
      .getByRole('button', { name: 'Imprimir cotización' })
      .nth(2)
      .click()
      .catch((e) => console.log('click', e.message)),
  ]);
  if (popup) {
    await popup.waitForLoadState();
    await popup.evaluate(() => {
      window.print = () => {};
    });
    await popup.setViewportSize({ width: 1100, height: 1400 });
    await popup.waitForTimeout(1200);
    await popup.screenshot({
      path: path.join(__dirname, 'shots', 'quote-document.png'),
      fullPage: true,
    });
    console.log('ok popup');
  } else console.log('no popup');
  await browser.close();
})();
