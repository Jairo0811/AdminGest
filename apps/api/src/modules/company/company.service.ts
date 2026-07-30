import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            leads: true,
            projects: true,
          },
        },
      },
    });
    if (!company) throw new NotFoundException('Empresa no encontrada.');
    return company;
  }

  async update(user: AuthUser, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.update({
      where: { id: user.companyId },
      data: { ...dto, email: dto.email?.toLowerCase(), currency: dto.currency?.toUpperCase() },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Company',
      entityId: user.companyId,
      newValues: company,
    });
    return company;
  }

  listUsers(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
    });
  }

  async createUser(user: AuthUser, dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Ya existe un usuario con este correo.');
    }
    const created = await this.prisma.user.create({
      data: {
        companyId: user.companyId,
        email,
        passwordHash: await bcrypt.hash(dto.password, 12),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: dto.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: created.id,
      newValues: created,
    });
    return created;
  }

  async updateUser(user: AuthUser, id: string, dto: UpdateUserDto) {
    const target = await this.prisma.user.findFirst({
      where: { id, companyId: user.companyId },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado.');
    if (target.id === user.id && dto.status !== 'ACTIVE') {
      throw new ConflictException('No puedes desactivar tu propia cuenta.');
    }
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });
  }
}
