/**
 * Options of the seed script, resolved from environment variables.
 *
 * The seed is safe to run repeatedly:
 * - plans are created when missing; their limits are only overwritten with
 *   SEED_SYNC_PLANS=true (the plan catalogue may have been edited in production);
 * - an existing administrator is never modified (password, profile and role are kept)
 *   unless SEED_RESET_ADMIN_PASSWORD=true is set explicitly outside production;
 * - demo data (company, CRM records, catalog) is only created outside production, or in
 *   production with SEED_DEMO_DATA=true and an explicit SEED_ADMIN_PASSWORD;
 * - existing subscriptions are never changed.
 */
export interface SeedOptions {
  production: boolean;
  demoData: boolean;
  syncPlans: boolean;
  resetAdminPassword: boolean;
  adminPassword?: string;
}

export const MIN_SEED_PASSWORD_LENGTH = 10;

const flag = (value: string | undefined) => value?.trim().toLowerCase() === 'true';

export function resolveSeedOptions(env: NodeJS.ProcessEnv): SeedOptions {
  const production = env.NODE_ENV === 'production';
  const adminPassword = env.SEED_ADMIN_PASSWORD?.trim() || undefined;
  const demoData = env.SEED_DEMO_DATA === undefined ? !production : flag(env.SEED_DEMO_DATA);
  const resetAdminPassword = flag(env.SEED_RESET_ADMIN_PASSWORD);

  if (adminPassword && adminPassword.length < MIN_SEED_PASSWORD_LENGTH) {
    throw new Error(
      `SEED_ADMIN_PASSWORD debe tener al menos ${MIN_SEED_PASSWORD_LENGTH} caracteres.`,
    );
  }
  if (production && resetAdminPassword) {
    throw new Error('SEED_RESET_ADMIN_PASSWORD no está permitido en producción.');
  }
  if (production && demoData && !adminPassword) {
    throw new Error(
      'Para crear datos de demostración en producción define SEED_ADMIN_PASSWORD explícitamente.',
    );
  }
  if (resetAdminPassword && !adminPassword) {
    throw new Error('SEED_RESET_ADMIN_PASSWORD=true requiere SEED_ADMIN_PASSWORD.');
  }

  return {
    production,
    demoData,
    syncPlans: flag(env.SEED_SYNC_PLANS),
    resetAdminPassword,
    adminPassword,
  };
}
