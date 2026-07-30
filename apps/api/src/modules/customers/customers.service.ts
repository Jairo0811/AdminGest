import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResourceQueryDto } from '../../common/types/resource-query.dto';
import { AuthUser } from '../../common/types/auth-user';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateContactDto, CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(user: AuthUser, query: ResourceQueryDto) {
    const search = query.search?.trim();
    const where: Prisma.CustomerWhereInput = {
      companyId: user.companyId,
      ...(query.status ? { isActive: query.status === 'ACTIVE' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { taxId: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        include: { contacts: { orderBy: { isPrimary: 'desc' } } },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.customer.count({ where }),
    ]);
    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        pages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        contacts: true,
        opportunities: { include: { pipelineStage: true } },
        projects: { include: { tasks: true } },
        quotes: true,
      },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado.');
    }
    return customer;
  }

  async create(user: AuthUser, dto: CreateCustomerDto) {
    const { primaryContact, ...customerData } = dto;
    const customer = await this.prisma.customer.create({
      data: {
        companyId: user.companyId,
        ...customerData,
        email: customerData.email?.toLowerCase(),
        contacts: primaryContact
          ? { create: { ...primaryContact, email: primaryContact.email?.toLowerCase(), isPrimary: true } }
          : undefined,
      },
      include: { contacts: true },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      newValues: customer,
    });
    return customer;
  }

  async update(user: AuthUser, id: string, dto: UpdateCustomerDto) {
    const before = await this.findOne(user, id);
    const data = {
      name: dto.name,
      taxId: dto.taxId,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      website: dto.website,
      isActive: dto.isActive,
    };
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { ...data, email: data.email?.toLowerCase() },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
      oldValues: before,
      newValues: customer,
    });
    return customer;
  }

  async addContact(user: AuthUser, customerId: string, dto: CreateContactDto) {
    await this.findOne(user, customerId);
    if (dto.isPrimary) {
      await this.prisma.contact.updateMany({
        where: { customerId },
        data: { isPrimary: false },
      });
    }
    return this.prisma.contact.create({
      data: { customerId, ...dto, email: dto.email?.toLowerCase() },
    });
  }

  async archive(user: AuthUser, id: string) {
    await this.findOne(user, id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'ARCHIVE',
      entity: 'Customer',
      entityId: id,
    });
    return customer;
  }
}
