import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EVENT_TYPES, BusinessEvent } from '../notifications/notifications.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async rules(companyId: string) {
    const saved = await this.prisma.workflowRule.findMany({ where: { companyId } });
    return EVENT_TYPES.map((eventType) => ({
      eventType, enabled: saved.find((rule) => rule.eventType === eventType)?.enabled ?? true,
    }));
  }

  async updateRule(companyId: string, eventType: string, enabled: boolean) {
    if (!EVENT_TYPES.includes(eventType as BusinessEvent)) {
      throw new BadRequestException('Tipo de automatización desconocido.');
    }
    return this.prisma.workflowRule.upsert({
      where: { companyId_eventType: { companyId, eventType } },
      create: { companyId, eventType, enabled },
      update: { enabled },
    });
  }

  async templates(companyId: string) {
    const records = await this.prisma.projectTemplate.findMany({
      where: { companyId }, orderBy: { name: 'asc' },
    });
    return records.map((row) => ({ ...row, steps: JSON.parse(row.stepsJson) as string[] }));
  }

  createTemplate(companyId: string, dto: CreateTemplateDto) {
    const steps = dto.steps.map((step) => step.trim());
    if (steps.some((step) => !step || step.length > 150)) {
      throw new BadRequestException('Cada paso debe tener entre 1 y 150 caracteres.');
    }
    return this.prisma.projectTemplate.create({
      data: {
        companyId, name: dto.name.trim(), description: dto.description?.trim(),
        stepsJson: JSON.stringify(steps),
      },
    });
  }

  async deleteTemplate(companyId: string, id: string) {
    const result = await this.prisma.projectTemplate.deleteMany({ where: { id, companyId } });
    if (!result.count) throw new NotFoundException('Plantilla no encontrada.');
    return { deleted: true };
  }

  async applyTemplate(companyId: string, templateId: string, projectId: string) {
    const [template, project] = await Promise.all([
      this.prisma.projectTemplate.findFirst({ where: { id: templateId, companyId } }),
      this.prisma.project.findFirst({ where: { id: projectId, companyId } }),
    ]);
    if (!template || !project) throw new NotFoundException('Plantilla o proyecto no encontrados.');
    const steps = JSON.parse(template.stepsJson) as string[];
    if (!steps.length || steps.length > 20) {
      throw new BadRequestException('La plantilla no tiene pasos válidos.');
    }
    const created = await this.prisma.projectTask.createMany({
      data: steps.map((title) => ({ projectId, title })),
    });
    const aggregate = await this.prisma.projectTask.aggregate({
      where: { projectId }, _avg: { progress: true },
    });
    await this.prisma.project.update({
      where: { id: projectId, companyId },
      data: { progress: Math.round(aggregate._avg.progress ?? 0) },
    });
    return { created: created.count, projectId };
  }
}
