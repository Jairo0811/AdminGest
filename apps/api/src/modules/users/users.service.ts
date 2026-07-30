import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: PUBLIC_USER_SELECT,
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
    });
  }

  async create(companyId: string, dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Ya existe un usuario con este correo.');
    }

    const { password, ...profile } = dto;
    return this.prisma.user.create({
      data: {
        ...profile,
        email,
        passwordHash: await hash(password, 12),
        companyId,
      },
      select: PUBLIC_USER_SELECT,
    });
  }

  async update(companyId: string, id: string, dto: UpdateUserDto) {
    const exists = await this.prisma.user.findFirst({ where: { id, companyId } });
    if (!exists) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: PUBLIC_USER_SELECT,
    });
  }
}
