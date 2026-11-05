import { expect, test } from '@playwright/test';
import { API, apiPost, createUser, login, PASSWORD, registerCompany, RUN } from './helpers';

const SEED_EMAIL = 'admin@admingest.com.do';
const SEED_PASSWORD = process.env.SEED_FIRST_PASSWORD ?? '';

test.describe('Flujos principales en el navegador (API y SQL Server reales)', () => {
  test('inicia sesión con el administrador de demostración', async ({ page }) => {
    test.skip(!SEED_PASSWORD, 'Requiere SEED_FIRST_PASSWORD');
    await login(page, SEED_EMAIL, SEED_PASSWORD);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // The access token lives in memory only.
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toMatch(/eyJ/);
  });

  test('registra una empresa desde la interfaz @mobile', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Crea una cuenta/ }).click();
    await page.getByLabel('Empresa').fill(`Registro UI ${RUN}`);
    await page.getByLabel('Nombre', { exact: true }).fill('Laura');
    await page.getByLabel('Apellido').fill('Registro');
    await page
      .getByLabel('Correo electrónico')
      .fill(`registro-ui-${RUN}-${test.info().project.name}@e2e.test`);
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: /Crear cuenta/ }).click();
    await expect(page).not.toHaveURL(/\/login/);
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Suscripción y capacidad' })).toBeVisible();
    await expect(page.getByText('Prueba gratuita')).toBeVisible();
    await expect(page.getByRole('button', { name: /comprar|pagar|actualizar plan/i })).toHaveCount(
      0,
    );
  });

  test('CRUD de clientes, cotización con ITBIS exento y aislamiento entre empresas', async ({
    page,
    request,
  }) => {
    const a = await registerCompany(request, 'ui-a');
    const b = await registerCompany(request, 'ui-b');
    await apiPost(request, b, '/customers', { name: `Cliente privado B ${RUN}` });

    await login(page, a.email, a.password);
    await page.goto('/customers');
    await expect(page.getByText(`Cliente privado B ${RUN}`)).toHaveCount(0);

    await page.getByRole('button', { name: /Nuevo cliente/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo cliente' });
    await dialog.getByLabel('Nombre o razón social').fill(`Cliente UI ${RUN}`);
    await dialog.getByRole('button', { name: 'Guardar' }).dblclick();
    await expect(page.getByText('Cliente guardado correctamente.')).toBeVisible();
    await expect(page.getByText(`Cliente UI ${RUN}`)).toHaveCount(1);

    await page.getByRole('button', { name: 'Editar cliente' }).first().click();
    await page.getByRole('dialog').getByLabel('Teléfono').fill('809-555-0199');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('809-555-0199')).toBeVisible();

    await page.goto('/quotes');
    await page.getByRole('button', { name: /Nueva cotización/ }).click();
    const quote = page.getByRole('dialog', { name: 'Nueva cotización' });
    await quote.getByLabel('Cliente').selectOption({ label: `Cliente UI ${RUN}` });
    await quote.getByLabel('Concepto').fill('Capacitación exenta');
    await quote.getByLabel('Cantidad').fill('2');
    await quote.getByLabel('Precio unitario (RD$)').fill('1250.50');
    await quote.getByLabel('ITBIS').selectOption('0');
    await quote.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Cotización guardada correctamente.')).toBeVisible();
    await expect(page.getByText(/COT-\d{4}-00001/)).toBeVisible();
    await expect(page.getByText(/2[.,]501[.,]00/)).toBeVisible();

    await page.goto('/customers');
    await page.getByRole('button', { name: 'Eliminar cliente' }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('Cliente eliminado.')).toBeVisible();

    // Empresa B never sees Empresa A data.
    const bCustomers = await request.get(`${API}/customers`, {
      headers: { Authorization: `Bearer ${b.token}` },
    });
    expect(JSON.stringify(await bCustomers.json())).not.toContain(`Cliente UI ${RUN}`);
  });

  test('proyecto, importación CSV con nombre hostil, Gantt imprimible seguro y plantilla', async ({
    page,
    request,
  }) => {
    const account = await registerCompany(request, 'proyectos');
    const customer = await apiPost<{ id: string }>(request, account, '/customers', {
      name: 'Cliente Proyectos',
    });
    const project = await apiPost<{ id: string; name: string }>(request, account, '/projects', {
      customerId: customer.id,
      name: `Proyecto <img src=x onerror=window.__xss=1> ${RUN}`,
    });

    await login(page, account.email, account.password);
    await page.goto('/projects');
    await page.getByRole('button', { name: /MS Project/ }).click();
    await page.getByLabel('Proyecto', { exact: true }).selectOption(project.id);
    const csv = [
      'ID,Name,Start,Finish,Duration,% Complete',
      '1,"<script>window.__xss=1</script> Análisis",2026-11-02,2026-11-06,4 days,50%',
      '2,Diseño,2026-11-06,2026-11-12,6 days,0%',
    ].join('\n');
    await page
      .locator('input[type=file]')
      .setInputFiles({ name: 'plan.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await expect(page.getByText('2 tareas importadas desde el CSV.')).toBeVisible();
    await expect(page.getByText('<script>window.__xss=1</script> Análisis')).toBeVisible();

    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /Imprimir Gantt/ }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    await expect(popup.getByRole('heading', { level: 1 })).toContainText(
      '<img src=x onerror=window.__xss=1>',
    );
    await expect(popup.getByText('<script>window.__xss=1</script> Análisis')).toBeVisible();
    expect(
      await popup.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    expect(
      await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
    ).toBeUndefined();
    await popup.close();

    await page.goto('/workflows');
    await page.getByLabel('Nombre').fill(`Plantilla ${RUN}`);
    await page.getByLabel('Tareas').fill('Diseño\nPruebas');
    await page.getByRole('button', { name: 'Crear plantilla' }).click();
    await expect(page.getByText('Plantilla registrada.')).toBeVisible();
    await page.getByLabel('Aplicar al proyecto').first().selectOption(project.id);
    await page.getByRole('button', { name: 'Crear tareas' }).first().click();
    await page
      .getByRole('dialog', { name: 'Aplicar plantilla' })
      .getByRole('button', { name: 'Crear tareas' })
      .click();
    await expect(page.getByText(/Se crearon 1 tareas y se omitieron 1/)).toBeVisible();
  });

  test('notificaciones, revocación de sesión y cambio de contraseña', async ({ page, request }) => {
    const account = await registerCompany(request, 'sesiones');
    await apiPost(request, account, '/activities', {
      type: 'CALL',
      subject: 'Llamada asignada E2E',
      scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    });
    // A second device for the same user.
    const other = await request.post(`${API}/auth/login`, {
      data: { email: account.email, password: account.password },
    });
    expect(other.status()).toBe(200);

    await login(page, account.email, account.password);
    await page.goto('/notifications');
    await expect(page.getByText('Llamada asignada E2E')).toBeVisible();
    await page.getByRole('button', { name: /Marcar todas como leídas/ }).click();
    await expect(page.getByText(/todas leídas/)).toBeVisible();

    await page.goto('/profile');
    const revokeButtons = page.getByRole('button', { name: /^Revocar sesión/ });
    await expect(revokeButtons).toHaveCount(3);
    await revokeButtons.last().click();
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText(/Sesión revocada/)).toBeVisible();

    await page.getByLabel('Contraseña actual').fill(account.password);
    await page.getByLabel('Nueva contraseña').fill('E2E-Cambiada-2026!');
    await page.getByLabel('Confirmar contraseña').fill('E2E-Cambiada-2026!');
    await page.getByRole('button', { name: /Actualizar contraseña/ }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/Contraseña actualizada/)).toBeVisible();
    await login(page, account.email, 'E2E-Cambiada-2026!');
  });

  test('un usuario de solo lectura no ve acciones de escritura ni rutas administrativas @mobile', async ({
    page,
    request,
  }) => {
    const admin = await registerCompany(request, `lectura-${test.info().project.name}`);
    const viewer = await createUser(request, admin, 'VIEWER', `lector-${test.info().project.name}`);
    await login(page, viewer.email, viewer.password);
    await page.goto('/customers');
    await expect(page.getByRole('heading', { name: 'Clientes', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nuevo cliente/ })).toHaveCount(0);
    await page.goto('/users');
    await expect(page).not.toHaveURL(/\/users/);
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /perfil/i }).first()).toBeVisible();
  });
});
