import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JWT session isolation', () => {
  const config = { getOrThrow: () => 'test-jwt-secret-at-least-32-characters' } as unknown as ConfigService;

  it('rechaza sesiones revocadas o desconocidas', async () => {
    const prisma = {
      authSession: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findFirst: jest.fn() },
    } as unknown as PrismaService;
    const strategy = new JwtStrategy(config, prisma);
    await expect(strategy.validate({
      sub: 'usuario-a', companyId: 'empresa-a', sid: 'sesion-1',
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it('usa simultáneamente identidad, sesión activa y tenant', async () => {
    const prisma = {
      authSession: { findFirst: jest.fn().mockResolvedValue({ id: 'sesion-1' }) },
      user: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const strategy = new JwtStrategy(config, prisma);
    await expect(strategy.validate({
      sub: 'usuario-a', companyId: 'empresa-b', sid: 'sesion-1',
    })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'usuario-a', companyId: 'empresa-b', status: 'ACTIVE',
        }),
      }),
    );
  });
});
