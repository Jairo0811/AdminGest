const required = ['DATABASE_URL', 'JWT_SECRET'] as const;

export function validateEnvironment(config: Record<string, unknown>) {
  const missing = required.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length) {
    throw new Error(
      `Variables de entorno requeridas ausentes: ${missing.join(', ')}`,
    );
  }

  const jwtSecret = String(config.JWT_SECRET);
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe contener al menos 32 caracteres.');
  }

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT debe ser un puerto TCP válido.');
  }

  return {
    ...config,
    PORT: port,
    NODE_ENV: String(config.NODE_ENV ?? 'development'),
    JWT_EXPIRES_IN: String(config.JWT_EXPIRES_IN ?? '8h'),
    CORS_ORIGIN: String(config.CORS_ORIGIN ?? 'http://localhost:5173'),
  };
}
