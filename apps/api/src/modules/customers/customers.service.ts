import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  findAll(companyId: string, search?: string) {
    return this.prisma.customer.findMany({
      where: {
        companyId,
        isActive: true,
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { taxId: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        contacts: { where: { isPrimary: true }, take: 1 },
        _count: { select: { opportunities: true, projects: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      include: {
        contacts: true,
        opportunities: { include: { pipelineStage: true } },
        projects: true,
      },
    });
    if (!customer) throw new NotFoundException('Cliente no encontrado.');
    return customer;
  }

  async create(companyId: string, userId: string, dto: CreateCustomerDto) {
    if (
      dto.taxId &&
      (await this.prisma.customer.findFirst({ where: { companyId, taxId: dto.taxId } }))
    ) {
      throw new ConflictException('Ya existe un cliente con este RNC o identificación.');
    }

    const { primaryContact, ...data } = dto;
    const customer = await this.prisma.customer.create({
      data: {
        companyId,
        ...data,
        contacts: primaryContact
          ? { create: { ...primaryContact, isPrimary: true } }
          : undefined,
      },
      include: { contacts: true },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      newValues: dto,
    });
    return customer;
  }

  async update(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateCustomerDto,
  ) {
    const existing = await this.findOne(companyId, id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: dto,
      include: { contacts: true },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
      oldValues: existing,
      newValues: dto,
    });
    return customer;
  }

  async addContact(companyId: string, customerId: string, dto: CreateContactDto) {
    await this.findOne(companyId, customerId);
    return this.prisma.contact.create({
      data: { customerId, ...dto },
    });
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    await this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'ARCHIVE',
      entity: 'Customer',
      entityId: id,
      oldValues: existing,
    });
    return { archived: true };
  }
}

