import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.catalogItem.findMany({
      where: { companyId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  create(companyId: string, dto: CreateCatalogItemDto) {
    return this.prisma.catalogItem.create({ data: { companyId, ...dto } });
  }

  async update(companyId: string, id: string, dto: UpdateCatalogItemDto) {
    const exists = await this.prisma.catalogItem.findFirst({
      where: { id, companyId },
    });
    if (!exists) throw new NotFoundException('Producto o servicio no encontrado.');
    return this.prisma.catalogItem.update({ where: { id }, data: dto });
  }
}

