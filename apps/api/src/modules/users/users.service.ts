import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { assertCanChangeUserStatus } from './user-policy';

const PUBLIC_USER_SELECT = {
  id: true,
  companyId: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function auditSnapshot(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: PUBLIC_USER_SELECT,
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
    });
  }

  findProfile(companyId: string, userId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: { id: userId, companyId },
      select: PUBLIC_USER_SELECT,
    });
  }

  async create(companyId: string, actorId: string, dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Ya existe un usuario con este correo.');
    }

    const { password, ...profile } = dto;
    const created = await this.prisma.user.create({
      data: {
        ...profile,
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        email,
        passwordHash: await hash(password, 12),
        companyId,
      },
      select: PUBLIC_USER_SELECT,
    });
    await this.audit.record({
      companyId,
      userId: actorId,
      action: 'CREATE',
      entity: 'User',
      entityId: created.id,
      newValues: auditSnapshot(created),
    });
    return created;
  }

  async update(companyId: string, actorId: string, id: string, dto: UpdateUserDto) {
    const existing = await this.requireUser(companyId, id);
    assertCanChangeUserStatus(actorId, id, dto.status);

    const email = dto.email?.trim().toLowerCase();
    if (email && email !== existing.email) {
      const duplicate = await this.prisma.user.findUnique({ where: { email } });
      if (duplicate) throw new ConflictException('Ya existe un usuario con este correo.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        email,
        firstName: dto.firstName?.trim(),
        lastName: dto.lastName?.trim(),
      },
      select: PUBLIC_USER_SELECT,
    });
    await this.audit.record({
      companyId,
      userId: actorId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValues: auditSnapshot(existing),
      newValues: auditSnapshot(updated),
    });
    return updated;
  }

  async updateProfile(companyId: string, userId: string, dto: UpdateProfileDto) {
    const existing = await this.requireUser(companyId, userId);
    const email = dto.email.trim().toLowerCase();
    if (email !== existing.email) {
      const duplicate = await this.prisma.user.findUnique({ where: { email } });
      if (duplicate) throw new ConflictException('Ya existe un usuario con este correo.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
      },
      select: PUBLIC_USER_SELECT,
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE_PROFILE',
      entity: 'User',
      entityId: userId,
      oldValues: auditSnapshot(existing),
      newValues: auditSnapshot(updated),
    });
    return updated;
  }

  async changePassword(companyId: string, userId: string, dto: ChangePasswordDto) {
    const user = await this.requireUser(companyId, userId);
    if (!(await compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual no es correcta.');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('La nueva contraseña debe ser diferente.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(dto.newPassword, 12) },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: userId,
    });
    return { changed: true };
  }

  async resetPassword(companyId: string, actorId: string, id: string, dto: ResetPasswordDto) {
    await this.requireUser(companyId, id);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await hash(dto.password, 12) },
    });
    await this.audit.record({
      companyId,
      userId: actorId,
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: id,
    });
    return { reset: true };
  }

  private async requireUser(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }
}
