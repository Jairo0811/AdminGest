/**
 * Classification of API failures so that the interface never shows a misleading message
 * (for example "invalid credentials" when the backend is not even configured).
 *
 * Codes come from the Cloudflare Pages Function (functions/api/[[path]].js) and from the
 * API (GlobalExceptionFilter); other cases are inferred from the HTTP status.
 */
export type ApiErrorKind =
  | 'not-configured'
  | 'unavailable'
  | 'database'
  | 'network'
  | 'auth'
  | 'session-expired'
  | 'forbidden'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'rate-limit'
  | 'registration-disabled'
  | 'server';

export const SERVICE_MESSAGES: Record<
  'not-configured' | 'unavailable' | 'database' | 'network',
  string
> = {
  'not-configured':
    'El servidor de AdminGest todavía no está configurado en este despliegue. La interfaz está publicada, pero aún no puede iniciar sesión ni guardar datos.',
  unavailable:
    'El servidor de AdminGest no responde en este momento. Si estaba inactivo puede tardar hasta un minuto en iniciar; inténtalo de nuevo en unos instantes.',
  database:
    'La base de datos no está disponible en este momento. Inténtalo de nuevo en unos minutos.',
  network: 'No hay conexión con el servidor. Revisa tu conexión a Internet e inténtalo de nuevo.',
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly kind: ApiErrorKind = classifyStatus(status),
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** The service itself is unavailable (as opposed to a problem with the request). */
  get isServiceProblem(): boolean {
    return ['not-configured', 'unavailable', 'database', 'network'].includes(this.kind);
  }
}

export function classifyStatus(status: number): ApiErrorKind {
  if (status === 0) return 'network';
  if (status === 401) return 'auth';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rate-limit';
  if (status === 400 || status === 422) return 'validation';
  if (status === 502 || status === 503 || status === 504) return 'unavailable';
  return 'server';
}

const KIND_BY_CODE: Record<string, ApiErrorKind> = {
  API_NOT_CONFIGURED: 'not-configured',
  API_UNREACHABLE: 'unavailable',
  DATABASE_UNAVAILABLE: 'database',
  REGISTRATION_DISABLED: 'registration-disabled',
};

interface ErrorBody {
  message?: string | string[];
  code?: string;
}

/**
 * Builds an ApiError from a failed response. Bodies that are not AdminGest JSON (an HTML
 * error page of the hosting provider, an empty gateway response) never reach the user.
 */
export async function errorFromResponse(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? ((await response.json().catch(() => null)) as ErrorBody | null)
    : null;
  const kind = (body?.code && KIND_BY_CODE[body.code]) || classifyStatus(response.status);

  if (kind === 'not-configured' || kind === 'unavailable' || kind === 'database') {
    return new ApiError(SERVICE_MESSAGES[kind], response.status, kind, body?.code);
  }
  if (kind === 'rate-limit') {
    return new ApiError(
      'Demasiadas solicitudes en poco tiempo. Espera un minuto e inténtalo de nuevo.',
      response.status,
      kind,
      body?.code,
    );
  }
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : (body?.message ??
      (kind === 'server'
        ? 'Ocurrió un error en el servidor. Inténtalo nuevamente.'
        : 'No fue posible completar la operación.'));
  return new ApiError(message, response.status, kind, body?.code);
}

export const networkError = () => new ApiError(SERVICE_MESSAGES.network, 0, 'network');

/**
 * TanStack Query retry policy: requests that the server rejected (4xx) or that cannot
 * succeed (API not configured) are not repeated, and a sleeping or failing backend is
 * retried at most once, so a suspended server is not flooded with requests.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!(error instanceof ApiError)) return failureCount < 1;
  if (!['unavailable', 'network', 'server'].includes(error.kind)) return false;
  return failureCount < 1;
}

export const retryDelay = () => 3_000;
