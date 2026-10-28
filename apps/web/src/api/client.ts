const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

interface SessionPayload {
  accessToken: string;
  user: {
    id: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    company: { name: string; currency: string; timezone: string };
  };
}

let accessToken: string | null = null;
let refreshInFlight: Promise<SessionPayload | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export async function restoreSession(): Promise<SessionPayload | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(API_URL + '/auth/refresh', {
      method: 'POST', credentials: 'include',
    })
      .then(async (response) => response.ok ? (await response.json()) as SessionPayload : null)
      .then((session) => {
        accessToken = session?.accessToken ?? null;
        return session;
      })
      .catch(() => {
        accessToken = null;
        return null;
      })
      .finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

export async function closeSession(): Promise<void> {
  clearAccessToken();
  try {
    await fetch(API_URL + '/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // Client is already logged out even if the network is unavailable.
  }
}

async function request(path: string, options: RequestInit, token: string | null) {
  return fetch(API_URL + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...options.headers,
    },
  });
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await request(path, options, accessToken);
  const isAuthCall = path.startsWith('/auth/login') || path.startsWith('/auth/register')
    || path.startsWith('/auth/refresh') || path.startsWith('/auth/logout');
  if (response.status === 401 && !isAuthCall) {
    const renewed = await restoreSession();
    if (renewed) response = await request(path, options, renewed.accessToken);
  }

  if (response.status === 401 && !isAuthCall) {
    clearAccessToken();
    window.dispatchEvent(new Event('admingest:unauthorized'));
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : body?.message ?? 'No fue posible completar la operación.';
    throw new ApiError(message, response.status);
  }

  return response.status === 204
    ? (undefined as T)
    : ((await response.json()) as T);
}
