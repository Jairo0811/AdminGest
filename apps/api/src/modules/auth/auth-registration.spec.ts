import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import type { PasswordResetMailService } from './password-reset-mail.service';
import type { SessionsService } from './sessions.service';
import type { PrismaService } from '../../infrastructure/prisma/prisma.service';

const configWith = (values: Record<string, string | undefined>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('AuthService registration switch', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const build = (values: Record<string, string | undefined>) =>
    new AuthService(
      prisma as unknown as PrismaService,
      configWith(values),
      {} as PasswordResetMailService,
      {} as SessionsService,
    );
  const dto = {
    companyName: 'Empresa Demo',
    firstName: 'Ana',
    lastName: 'Admin',
    email: 'ana@empresa.test',
    password: 'Segura-2026!',
  };

  beforeEach(() => prisma.user.findUnique.mockReset());

  it('rejects registration in the API when it is disabled, before touching the database', async () => {
    const service = build({ NODE_ENV: 'production' });
    expect(service.isRegistrationEnabled()).toBe(false);
    await expect(service.register(dto)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.register(dto)).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'REGISTRATION_DISABLED' }),
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('keeps registration available when explicitly enabled', async () => {
    const service = build({ NODE_ENV: 'production', PUBLIC_REGISTRATION: 'true' });
    expect(service.isRegistrationEnabled()).toBe(true);
    prisma.user.findUnique.mockResolvedValueOnce({ id: 'existing' });
    await expect(service.register(dto)).rejects.not.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });
});
