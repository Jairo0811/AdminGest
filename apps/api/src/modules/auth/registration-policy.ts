/**
 * Public self-service registration creates a new company with a trial subscription.
 * During demonstrations it can be closed with PUBLIC_REGISTRATION=false: the API rejects
 * POST /api/auth/register (hiding the button in the UI alone would not be enough).
 *
 * Default: enabled in development and test, disabled in production unless explicitly
 * enabled, so that a new deployment never opens sign-ups by accident.
 */
export function isPublicRegistrationEnabled(env: {
  NODE_ENV?: string;
  PUBLIC_REGISTRATION?: string;
}): boolean {
  const value = env.PUBLIC_REGISTRATION?.trim().toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  return env.NODE_ENV !== 'production';
}

export const REGISTRATION_DISABLED = {
  message:
    'El registro de nuevas empresas no está habilitado en este entorno. Solicita una cuenta al administrador.',
  error: 'Forbidden',
  code: 'REGISTRATION_DISABLED',
};
