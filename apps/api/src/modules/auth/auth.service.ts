import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { normalizeDominicanTaxId } from '../../common/validation/dominican-tax-id';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetMailService } from './password-reset-mail.service';

const PASSWORD_RESET_RESPONSE =
  'Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.';
const PASSWORD_RESET_TTL_MINUTES = 30;

const USER_PUBLIC_SELECT = {
  id: true,
  companyId: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  company: {
    select: {
      name: true,
      currency: true,
      timezone: true,
    },
  },
} as const;

interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly passwordResetMail: PasswordResetMailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const exists = await this.prisma.user.findUnique({ where: { email } });

    if (exists) {
      throw new ConflictException('Ya existe una cuenta con este correo.');
    }

    const passwordHash = await hash(dto.password, 12);
    const user = await this.prisma.$transaction(async (transaction) => {
      const company = await transaction.company.create({
        data: {
          name: dto.companyName.trim(),
          taxId: dto.taxId ? normalizeDominicanTaxId(dto.taxId) : null,
          email,
        },
      });

      await transaction.pipelineStage.createMany({
        data: [
          { companyId: company.id, name: 'Prospección', position: 1, probability: 10 },
          { companyId: company.id, name: 'Calificación', position: 2, probability: 30 },
          { companyId: company.id, name: 'Propuesta', position: 3, probability: 60 },
          { companyId: company.id, name: 'Negociación', position: 4, probability: 80 },
          { companyId: company.id, name: 'Ganada', position: 5, probability: 100, isWon: true },
          { companyId: company.id, name: 'Perdida', position: 6, probability: 0, isLost: true },
        ],
      });

      return transaction.user.create({
        data: {
          companyId: company.id,
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          role: 'ADMIN',
        },
        select: USER_PUBLIC_SELECT,
      });
    });

    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const userWithPassword = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (
      !userWithPassword ||
      userWithPassword.status !== 'ACTIVE' ||
      !userWithPassword.company.isActive ||
      !(await compare(dto.password, userWithPassword.passwordHash))
    ) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    await this.prisma.user.update({
      where: { id: userWithPassword.id },
      data: { lastLoginAt: new Date() },
    });

    return this.createSession({
      id: userWithPassword.id,
      companyId: userWithPassword.companyId,
      email: userWithPassword.email,
      firstName: userWithPassword.firstName,
      lastName: userWithPassword.lastName,
      role: userWithPassword.role,
      company: {
        name: userWithPassword.company.name,
        currency: userWithPassword.company.currency,
        timezone: userWithPassword.company.timezone,
      },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto, metadata: RequestMetadata) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || user.status !== 'ACTIVE' || !user.company.isActive) {
      return { message: PASSWORD_RESET_RESPONSE };
    }

    const token = randomBytes(64).toString('base64url');
    const tokenHash = this.hashResetToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TTL_MINUTES * 60_000);

    const resetRecord = await this.prisma.$transaction(async (transaction) => {
      await transaction.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });

      const created = await transaction.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
          createdIp: metadata.ipAddress,
          userAgent: metadata.userAgent?.slice(0, 500),
        },
      });

      await transaction.auditLog.create({
        data: {
          companyId: user.companyId,
          userId: user.id,
          action: 'PASSWORD_RESET_REQUEST',
          entity: 'User',
          entityId: user.id,
          ipAddress: metadata.ipAddress,
        },
      });

      return created;
    });

    const frontendUrl = this.config
      .get<string>('PASSWORD_RESET_URL', 'http://localhost:5173/reset-password')
      .replace(/\/$/, '');
    const resetUrl = `${frontendUrl}?token=${encodeURIComponent(token)}`;

    try {
      await this.passwordResetMail.send({
        to: user.email,
        firstName: user.firstName,
        resetUrl,
      });
    } catch (error) {
      await this.prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
      this.logger.error('No fue posible entregar el correo de recuperación.', error);
    }

    return { message: PASSWORD_RESET_RESPONSE };
  }

  async resetPassword(dto: ResetPasswordDto, metadata: RequestMetadata) {
    const tokenHash = this.hashResetToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { company: true } } },
    });
    const now = new Date();

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= now ||
      resetToken.user.status !== 'ACTIVE' ||
      !resetToken.user.company.isActive
    ) {
      if (resetToken) {
        await this.prisma.auditLog.create({
          data: {
            companyId: resetToken.user.companyId,
            userId: resetToken.userId,
            action: 'PASSWORD_RESET_FAILED',
            entity: 'User',
            entityId: resetToken.userId,
            ipAddress: metadata.ipAddress,
          },
        });
      }
      throw new BadRequestException('El enlace no es válido o ha expirado.');
    }

    const passwordHash = await hash(dto.password, 12);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      });

      await transaction.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: now },
      });

      await transaction.auditLog.create({
        data: {
          companyId: resetToken.user.companyId,
          userId: resetToken.userId,
          action: 'PASSWORD_RESET_SUCCESS',
          entity: 'User',
          entityId: resetToken.userId,
          ipAddress: metadata.ipAddress,
        },
      });
    });

    return { message: 'Tu contraseña fue restablecida correctamente.' };
  }

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createSession(user: {
    id: string;
    companyId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    company: { name: string; currency: string; timezone: string };
  }) {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '8h');
    const accessToken = await this.jwt.signAsync(
      {
        sub: user.id,
        companyId: user.companyId,
        role: user.role,
      },
      { expiresIn: expiresIn as never },
    );

    return { accessToken, user };
  }
}
