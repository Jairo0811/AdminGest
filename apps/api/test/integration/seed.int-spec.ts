import { createHarness, Harness } from './harness';

/**
 * CI runs the seed twice with different SEED_ADMIN_PASSWORD values. A safe seed keeps the
 * password of the first run: an existing administrator is never rewritten implicitly.
 */
const firstPassword = process.env.SEED_FIRST_PASSWORD;
const secondPassword = process.env.SEED_SECOND_PASSWORD;
const describeIfSeeded = firstPassword && secondPassword ? describe : describe.skip;

describeIfSeeded('Seed repetible (SQL Server real)', () => {
  let harness: Harness;
  beforeAll(async () => {
    harness = await createHarness();
  });
  afterAll(async () => harness?.close());

  it('conserva la contraseña, el rol y los datos del administrador existente', async () => {
    const email = 'admin@admingest.com.do';
    await harness
      .http()
      .post('/api/auth/login')
      .send({ email, password: firstPassword })
      .expect(200);
    await harness
      .http()
      .post('/api/auth/login')
      .send({ email, password: secondPassword })
      .expect(401);

    const admin = await harness.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(admin.role).toBe('ADMIN');
    expect(await harness.prisma.company.count({ where: { name: 'Empresa Demo SRL' } })).toBe(1);
    expect(
      await harness.prisma.customer.count({
        where: { companyId: admin.companyId, name: 'Cliente de Demostración' },
      }),
    ).toBe(1);
    expect(await harness.prisma.subscription.count({ where: { companyId: admin.companyId } })).toBe(
      1,
    );
    expect(
      await harness.prisma.plan.count({ where: { code: { in: ['STARTER', 'PRO', 'BUSINESS'] } } }),
    ).toBe(3);
  });
});
