const REQUIRED_ALWAYS = ['DATABASE_URL', 'JWT_SECRET'] as const;

const REQUIRED_IN_PRODUCTION = [
  'CORS_ORIGIN',
  'PASSWORD_RESET_URL',
  'RESEND_API_KEY',
  'MAIL_FROM',
] as const;

/** Access tokens are short lived; long sessions rely on the rotating refresh token. */
export const MAX_ACCESS_TOKEN_SECONDS = 3600;

export function validateEnvironment(environment: Record<string, unknown>): Record<string, unknown> {
  const nodeEnv = String(environment.NODE_ENV ?? 'development');
  const required = [
    ...REQUIRED_ALWAYS,
    ...(nodeEnv === 'production' ? REQUIRED_IN_PRODUCTION : []),
  ];

  const missing = required.filter((key) => {
    const value = environment[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(', ')}`);
  }

  const jwtSecret = String(environment.JWT_SECRET);
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
  }

  const port = Number(environment.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un número entero entre 1 y 65535.');
  }

  const jwtExpiresIn = String(environment.JWT_EXPIRES_IN ?? '15m').trim();
  const expiresMatch = /^(\d+)([smh])$/.exec(jwtExpiresIn);
  const expiresSeconds = expiresMatch
    ? Number(expiresMatch[1]) * { s: 1, m: 60, h: 3600 }[expiresMatch[2] as 's' | 'm' | 'h']
    : NaN;
  if (!(expiresSeconds >= 60 && expiresSeconds <= MAX_ACCESS_TOKEN_SECONDS)) {
    throw new Error(
      'JWT_EXPIRES_IN debe expresarse como 15m, 900s o 1h y estar entre 1 minuto y 1 hora. ' +
        'La sesión se mantiene con el refresh token rotativo de 7 días.',
    );
  }

  const trustProxy = String(environment.TRUST_PROXY ?? '').trim();
  if (trustProxy && !/^(false|true|loopback|\d{1,2})$/.test(trustProxy)) {
    throw new Error('TRUST_PROXY admite false, true, loopback o el número de proxies (0-99).');
  }

  return {
    ...environment,
    JWT_EXPIRES_IN: jwtExpiresIn,
    NODE_ENV: nodeEnv,
    PORT: port,
  };
}
