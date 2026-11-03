import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  list(companyId: string) {
    return this.prisma.documentRecord.findMany({
      where: { companyId }, orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async create(companyId: string, creatorId: string, dto: CreateDocumentDto) {
    const url = this.validateUrl(dto.url);
    const [project, customer] = await Promise.all([
      dto.projectId
        ? this.prisma.project.findFirst({ where: { companyId, id: dto.projectId } })
        : Promise.resolve(null),
      dto.customerId
        ? this.prisma.customer.findFirst({ where: { companyId, id: dto.customerId } })
        : Promise.resolve(null),
    ]);
    if (dto.projectId && !project) throw new NotFoundException('Proyecto no encontrado.');
    if (dto.customerId && !customer) throw new NotFoundException('Cliente no encontrado.');
    if (project && customer && project.customerId !== customer.id) {
      throw new BadRequestException('El proyecto no corresponde al cliente indicado.');
    }
    return this.prisma.documentRecord.create({
      data: {
        companyId, creatorId, title: dto.title.trim(),
        category: dto.category, url,
        projectId: project?.id, customerId: customer?.id,
      },
    });
  }

  async remove(companyId: string, id: string) {
    const result = await this.prisma.documentRecord.deleteMany({ where: { id, companyId } });
    if (result.count === 0) throw new NotFoundException('Documento no encontrado.');
    return { deleted: true };
  }

  private validateUrl(value: string) {
    let parsed: URL;
    try { parsed = new URL(value); }
    catch { throw new BadRequestException('URL de documento inválida.'); }
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
      throw new BadRequestException('Solo se permiten enlaces HTTPS sin credenciales.');
    }
    const allowList = this.config.get<string>('DOCUMENT_ALLOWED_HOSTS', '')
      .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
    const production = this.config.get<string>('NODE_ENV') === 'production';
    if (production && allowList.length === 0) {
      throw new BadRequestException('El repositorio documental requiere DOCUMENT_ALLOWED_HOSTS.');
    }
    if (allowList.length && !allowList.includes(parsed.hostname.toLowerCase())) {
      throw new BadRequestException('El dominio de almacenamiento no está autorizado.');
    }
    return parsed.toString();
  }
}
