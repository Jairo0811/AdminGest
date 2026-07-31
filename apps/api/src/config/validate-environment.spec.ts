import { validateEnvironment } from './validate-environment';

describe('validateEnvironment', () => {
  const baseEnvironment = {
    NODE_ENV: 'development',
    DATABASE_URL: 'sqlserver://localhost:1433;database=AdminGestDb',
    JWT_SECRET: '12345678901234567890123456789012',
  };

  it('acepta una configuración válida de desarrollo', () => {
    expect(validateEnvironment(baseEnvironment)).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
    });
  });

  it('rechaza secretos JWT demasiado cortos', () => {
    expect(() =>
      validateEnvironment({ ...baseEnvironment, JWT_SECRET: 'corto' }),
    ).toThrow('JWT_SECRET debe tener al menos 32 caracteres.');
  });

  it('exige configuración de correo y CORS en producción', () => {
    expect(() =>
      validateEnvironment({ ...baseEnvironment, NODE_ENV: 'production' }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('rechaza un puerto inválido', () => {
    expect(() =>
      validateEnvironment({ ...baseEnvironment, PORT: '70000' }),
    ).toThrow('PORT debe ser un número entero entre 1 y 65535.');
  });
});
