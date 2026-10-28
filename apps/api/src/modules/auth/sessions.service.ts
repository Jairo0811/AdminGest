import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  REFRESH_TTL_DAYS, generateRefreshToken, hashesMatch, parseRefreshToken,
} from './session-tokens';

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

interface SessionIdentity {
  id: string;
  companyId: string;
  role: string;
}

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async create(user: SessionIdentity, metadata: SessionMetadata = {}) {
    const refresh = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86400_000);
    await this.prisma.authSession.create({
      data: {
        id: refresh.id, userId: user.id, refreshTokenHash: refresh.hash, expiresAt,
        ipAddress: metadata.ipAddress?.slice(0, 64),
        userAgent: metadata.userAgent?.slice(0, 500),
      },
    });
    return {
      accessToken: await this.accessToken(user, refresh.id),
      refreshToken: refresh.token,
    };
  }

  async rotate(value: string | undefined, metadata: SessionMetadata = {}) {
    const parsed = parseRefreshToken(value);
    if (!parsed) throw new UnauthorizedException('Sesión expirada o inválida.');
    const session = await this.prisma.authSession.findUnique({
      where: { id: parsed.id },
      include: { user: { include: { company: true } } },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()
      || session.user.status !== 'ACTIVE' || !session.user.company.isActive) {
      throw new UnauthorizedException('Sesión expirada o revocada.');
    }
    if (!hashesMatch(session.refreshTokenHash, parsed.hash)) {
      // Reutilizar un token viejo es una señal de posible robo de sesión.
      await this.prisma.authSession.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token de sesión reutilizado.');
    }
    const next = generateRefreshToken();
    const updated = await this.prisma.authSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: parsed.hash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        refreshTokenHash: next.hash,
        lastUsedAt: new Date(),
        ipAddress: metadata.ipAddress?.slice(0, 64),
        userAgent: metadata.userAgent?.slice(0, 500),
      },
    });
    if (updated.count !== 1) throw new UnauthorizedException('Sesión revocada.');
    const user = session.user;
    const accessToken = await this.accessToken(user, session.id);
    return {
      accessToken,
      refreshToken: session.id + '.' + next.token.split('.')[1],
      user: {
        id: user.id, companyId: user.companyId, email: user.email,
        firstName: user.firstName, lastName: user.lastName, role: user.role,
        company: { name: user.company.name, currency: user.company.currency, timezone: user.company.timezone },
      },
    };
  }

  async list(userId: string) {
    return this.prisma.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, createdAt: true, lastUsedAt: true, expiresAt: true, ipAddress: true, userAgent: true },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  async revoke(userId: string, id: string) {
    await this.prisma.authSession.updateMany({
      where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async revokeAll(userId: string) {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null }, data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async revokeByRefresh(value: string | undefined) {
    const parsed = parseRefreshToken(value);
    if (!parsed) return;
    await this.prisma.authSession.updateMany({
      where: { id: parsed.id, refreshTokenHash: parsed.hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private accessToken(user: SessionIdentity, sessionId: string) {
    return this.jwt.signAsync(
      { sub: user.id, companyId: user.companyId, sid: sessionId },
      { expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as never },
    );
  }
}
