import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadStatus } from './dto/update-lead-status.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.lead.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(companyId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        companyId,
        ...dto,
      },
    });
  }

  async updateStatus(companyId: string, id: string, status: LeadStatus) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, companyId },
      select: { id: true },
    });

    if (!lead) {
      throw new NotFoundException('Prospecto no encontrado.');
    }

    return this.prisma.lead.update({
      where: { id },
      data: { status },
    });
  }
}
