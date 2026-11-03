import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../common/auth-user.interface';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

interface JwtPayload {
  sub: string;
  companyId: string;
  sid: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (!payload.sid) throw new UnauthorizedException('Token de sesión sin identificador.');
    const session = await this.prisma.authSession.findFirst({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (!session) throw new UnauthorizedException('Sesión revocada.');
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        companyId: payload.companyId,
        status: 'ACTIVE',
        company: { isActive: true },
      },
      select: {
        id: true,
        companyId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('La sesión ya no es válida.');
    }

    return user;
  }
}

