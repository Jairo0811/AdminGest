import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findOne(companyId: string) {
    return this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        taxId: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        currency: true,
        timezone: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  update(companyId: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: dto,
      select: {
        id: true,
        name: true,
        taxId: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        currency: true,
        timezone: true,
      },
    });
  }
}

