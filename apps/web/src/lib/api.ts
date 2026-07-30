const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const SESSION_KEY = 'admingest.session';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function getToken(): string | undefined {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return undefined;
  try {
    return (JSON.parse(raw) as { accessToken?: string }).accessToken;
  } catch {
    return undefined;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && token) {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('admingest:unauthorized'));
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;
    const message = Array.isArray(payload?.message)
      ? payload.message.join(' ')
      : payload?.message ?? 'No se pudo completar la solicitud.';
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const sessionKey = SESSION_KEY;

export function formatCurrency(value: number | string, currency = 'DOP'): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
