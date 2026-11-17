import { APIRequestContext, expect, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export const API = process.env.E2E_API_URL ?? 'http://localhost:3000/api';
export const PASSWORD = 'E2E-Navegador-2026!';
export const RUN = randomUUID().slice(0, 6);

export interface Account {
  email: string;
  password: string;
  token: string;
  companyId: string;
  userId: string;
}

/** Registers a company through the API (setup only; the UI flow is tested separately). */
export async function registerCompany(request: APIRequestContext, label: string): Promise<Account> {
  const email = `${label}-${RUN}@e2e.test`.toLowerCase();
  const response = await request.post(`${API}/auth/register`, {
    data: {
      companyName: `E2E ${label} ${RUN}`,
      firstName: 'Admin',
      lastName: `Empresa ${label}`,
      email,
      password: PASSWORD,
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  return {
    email,
    password: PASSWORD,
    token: body.accessToken,
    companyId: body.user.companyId,
    userId: body.user.id,
  };
}

export async function createUser(
  request: APIRequestContext,
  admin: Account,
  role: string,
  label: string,
) {
  const email = `${label}-${RUN}@e2e.test`.toLowerCase();
  const response = await request.post(`${API}/users`, {
    headers: { Authorization: `Bearer ${admin.token}` },
    data: { email, password: PASSWORD, firstName: 'Usuario', lastName: `Prueba ${label}`, role },
  });
  expect(response.status()).toBe(201);
  return { email, password: PASSWORD };
}

export async function apiPost<T>(
  request: APIRequestContext,
  account: Account,
  path: string,
  data: unknown,
): Promise<T> {
  const response = await request.post(`${API}${path}`, {
    headers: { Authorization: `Bearer ${account.token}` },
    data,
  });
  expect(response.ok(), `${path} → ${response.status()} ${await response.text()}`).toBeTruthy();
  return response.json() as Promise<T>;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Entrar/ }).click();
  await expect(page.getByRole('navigation').first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
}
