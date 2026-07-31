const REQUIRED_ALWAYS = ['DATABASE_URL', 'JWT_SECRET'] as const;

const REQUIRED_IN_PRODUCTION = [
  'CORS_ORIGIN',
  'PASSWORD_RESET_URL',
  'RESEND_API_KEY',
  'MAIL_FROM',
] as const;

export function validateEnvironment(
  environment: Record<string, unknown>,
): Record<string, unknown> {
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
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missing.join(', ')}`,
    );
  }

  const jwtSecret = String(environment.JWT_SECRET);
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
  }

  const port = Number(environment.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un número entero entre 1 y 65535.');
  }

  return {
    ...environment,
    NODE_ENV: nodeEnv,
    PORT: port,
  };
}
