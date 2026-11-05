const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

/** Message used across tabs so that a logout in one tab closes the others. */
export const AUTH_CHANNEL = 'admingest-auth';

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

const REFRESH_LOCK = 'admingest-session-refresh';
const RETRY_DELAY_MS = 400;

async function refreshOnce(): Promise<Response> {
  return fetch(API_URL + '/auth/refresh', { method: 'POST', credentials: 'include' });
}

/**
 * All tabs share the same rotating refresh cookie. Without coordination two tabs
 * refreshing at the same time send the same token: one rotates it and the other is
 * rejected. The Web Locks API serialises refreshes across tabs; where it is not
 * available, a single delayed retry picks up the cookie rotated by the other tab.
 */
async function refreshSession(): Promise<SessionPayload | null> {
  const run = async () => {
    let response = await refreshOnce();
    if (response.status === 401) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      response = await refreshOnce();
    }
    return response.ok ? ((await response.json()) as SessionPayload) : null;
  };
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  return locks ? locks.request(REFRESH_LOCK, run) : run();
}

export async function restoreSession(): Promise<SessionPayload | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession()
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
