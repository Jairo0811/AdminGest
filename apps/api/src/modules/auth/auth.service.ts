import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
          taxId: dto.taxId?.trim() || null,
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

  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
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
