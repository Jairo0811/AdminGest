import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con este correo.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const result = await this.prisma.$transaction(async (transaction) => {
      const company = await transaction.company.create({
        data: {
          name: dto.companyName.trim(),
          taxId: dto.taxId?.trim() || null,
          email,
        },
      });
      const user = await transaction.user.create({
        data: {
          companyId: company.id,
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          role: 'ADMIN',
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
      return { company, user };
    });

    return this.issueSession(result.user, result.company.name);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });
    const matches = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    if (!user || !matches || user.status !== 'ACTIVE' || !user.company.isActive) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.issueSession(user, user.company.name);
  }

  private async issueSession(
    user: {
      id: string;
      companyId: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    },
    companyName: string,
  ) {
    const expiresIn = this.config.get<string>(
      'JWT_EXPIRES_IN',
      '8h',
    ) as JwtSignOptions['expiresIn'];
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, companyId: user.companyId, role: user.role },
      { expiresIn },
    );
    return {
      accessToken,
      user: {
        id: user.id,
        companyId: user.companyId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName,
      },
    };
  }
}
