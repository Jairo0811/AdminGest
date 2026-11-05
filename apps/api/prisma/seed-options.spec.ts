import { resolveSeedOptions } from './seed-options';

describe('resolveSeedOptions', () => {
  it('creates demo data by default only outside production', () => {
    expect(resolveSeedOptions({ NODE_ENV: 'development' })).toMatchObject({
      production: false,
      demoData: true,
      syncPlans: false,
      resetAdminPassword: false,
    });
    expect(resolveSeedOptions({ NODE_ENV: 'production' })).toMatchObject({
      production: true,
      demoData: false,
    });
  });

  it('never resets credentials implicitly', () => {
    expect(
      resolveSeedOptions({ NODE_ENV: 'development', SEED_ADMIN_PASSWORD: 'Segura-2026!' }),
    ).toMatchObject({ resetAdminPassword: false });
  });

  it('requires an explicit password to reset it, and forbids it in production', () => {
    expect(() =>
      resolveSeedOptions({ NODE_ENV: 'development', SEED_RESET_ADMIN_PASSWORD: 'true' }),
    ).toThrow(/requiere SEED_ADMIN_PASSWORD/);
    expect(() =>
      resolveSeedOptions({
        NODE_ENV: 'production',
        SEED_RESET_ADMIN_PASSWORD: 'true',
        SEED_ADMIN_PASSWORD: 'Segura-2026!',
      }),
    ).toThrow(/no está permitido en producción/);
  });

  it('requires an explicit password for demo data in production', () => {
    expect(() => resolveSeedOptions({ NODE_ENV: 'production', SEED_DEMO_DATA: 'true' })).toThrow(
      /SEED_ADMIN_PASSWORD/,
    );
    expect(
      resolveSeedOptions({
        NODE_ENV: 'production',
        SEED_DEMO_DATA: 'true',
        SEED_ADMIN_PASSWORD: 'Segura-2026!',
      }),
    ).toMatchObject({ demoData: true });
  });

  it('rejects short passwords', () => {
    expect(() => resolveSeedOptions({ SEED_ADMIN_PASSWORD: 'corta' })).toThrow(/al menos 10/);
  });
});
