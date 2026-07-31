import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  const validConfig = {
    DATABASE_URL: 'sqlserver://localhost:1433;database=AdminGestDb',
    JWT_SECRET: 'a-secure-development-secret-with-32-chars',
  };

  it('normalizes defaults for a valid configuration', () => {
    expect(validateEnvironment(validConfig)).toMatchObject({
      PORT: 3000,
      NODE_ENV: 'development',
      JWT_EXPIRES_IN: '8h',
      CORS_ORIGIN: 'http://localhost:5173',
    });
  });

  it('rejects missing required variables', () => {
    expect(() => validateEnvironment({ JWT_SECRET: validConfig.JWT_SECRET })).toThrow(
      'DATABASE_URL',
    );
  });

  it('rejects weak JWT secrets', () => {
    expect(() =>
      validateEnvironment({ ...validConfig, JWT_SECRET: 'short-secret' }),
    ).toThrow('32 caracteres');
  });

  it('rejects invalid ports', () => {
    expect(() => validateEnvironment({ ...validConfig, PORT: 70_000 })).toThrow(
      'puerto TCP válido',
    );
  });
});
