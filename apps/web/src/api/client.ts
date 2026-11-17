// Relative by default: Cloudflare Pages Functions and the Vite dev proxy both serve /api.
const API_URL = import.meta.env.VITE_API_URL ?? '/api';

/** Message used across tabs so that a logout in one tab closes the others. */
export const AUTH_CHANNEL = 'admingest-auth';

import { ApiError, errorFromResponse, networkError } from './errors';

export { ApiError };

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

/** Last reason why restoring the session failed for a service problem, if any. */
let lastRestoreProblem: ApiError | null = null;
export const getRestoreProblem = () => lastRestoreProblem;

/**
 * All tabs share the same rotating refresh cookie. Without coordination two tabs
 * refreshing at the same time send the same token: one rotates it and the other is
 * rejected. The Web Locks API serialises refreshes across tabs; where it is not
 * available, a single delayed retry picks up the cookie rotated by the other tab.
 */
async function refreshSession(): Promise<SessionPayload | null> {
  const run = async () => {
    let response: Response;
    try {
      response = await refreshOnce();
      if (response.status === 401) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        response = await refreshOnce();
      }
    } catch {
      lastRestoreProblem = networkError();
      return null;
    }
    if (response.ok) {
      lastRestoreProblem = null;
      return (await response.json()) as SessionPayload;
    }
    const problem = response.status === 401 ? null : await errorFromResponse(response);
    lastRestoreProblem = problem?.isServiceProblem ? problem : null;
    return null;
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
      .finally(() => {
        refreshInFlight = null;
      });
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
  try {
    return await fetch(API_URL + path, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch only rejects when the server cannot be reached (offline, DNS, CORS).
    throw networkError();
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response = await request(path, options, accessToken);
  const isAuthCall =
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/logout');
  if (response.status === 401 && !isAuthCall) {
    const renewed = await restoreSession();
    if (renewed) response = await request(path, options, renewed.accessToken);
  }

  if (response.status === 401 && !isAuthCall) {
    clearAccessToken();
    window.dispatchEvent(new Event('admingest:unauthorized'));
  }

  if (!response.ok) {
    const error = await errorFromResponse(response);
    // A 401 on a protected call after the refresh failed means the session ended.
    if (response.status === 401 && !isAuthCall) {
      throw new ApiError('Tu sesión expiró. Inicia sesión nuevamente.', 401, 'session-expired');
    }
    throw error;
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}
