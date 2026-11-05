import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { acquireTransactionLock, TRANSACTION_OPTIONS } from '../../common/tenant/app-lock';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EVENT_TYPES, BusinessEvent } from '../notifications/notifications.service';
import { recalculateProjectProgress } from '../projects/projects.service';
import { CreateTemplateDto } from './dto/create-template.dto';

const MAX_TEMPLATE_STEPS = 20;

/** Tolerates corrupted JSON instead of failing the whole listing. */
export function parseTemplateSteps(stepsJson: string): string[] {
  try {
    const parsed: unknown = JSON.parse(stepsJson);
    return Array.isArray(parsed)
      ? parsed.filter((step): step is string => typeof step === 'string' && step.trim() !== '')
      : [];
  } catch {
    return [];
  }
}

const normalizeTitle = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  async rules(companyId: string) {
    const saved = await this.prisma.workflowRule.findMany({ where: { companyId } });
    return EVENT_TYPES.map((eventType) => ({
      eventType,
      enabled: saved.find((rule) => rule.eventType === eventType)?.enabled ?? true,
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
      where: { companyId },
      orderBy: { name: 'asc' },
    });
    return records.map(({ stepsJson, ...row }) => ({
      ...row,
      steps: parseTemplateSteps(stepsJson),
    }));
  }

  createTemplate(companyId: string, dto: CreateTemplateDto) {
    const steps = dto.steps.map((step) => step.trim());
    if (steps.some((step) => !step || step.length > 150)) {
      throw new BadRequestException('Cada paso debe tener entre 1 y 150 caracteres.');
    }
    const unique = new Set(steps.map(normalizeTitle));
    if (unique.size !== steps.length) {
      throw new BadRequestException('La plantilla contiene tareas repetidas.');
    }
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('El nombre de la plantilla es obligatorio.');
    return this.prisma.projectTemplate.create({
      data: {
        companyId,
        name,
        description: dto.description?.trim() || null,
        stepsJson: JSON.stringify(steps),
      },
    });
  }

  async deleteTemplate(companyId: string, id: string) {
    const result = await this.prisma.projectTemplate.deleteMany({ where: { id, companyId } });
    if (!result.count) throw new NotFoundException('Plantilla no encontrada.');
    return { deleted: true };
  }

  /**
   * Creates the template tasks that the project does not already have (same title,
   * ignoring case and accents). Applying the same template twice therefore creates
   * nothing the second time. Runs in one transaction with a per-project lock.
   */
  async applyTemplate(companyId: string, templateId: string, projectId: string) {
    const [template, project] = await Promise.all([
      this.prisma.projectTemplate.findFirst({ where: { id: templateId, companyId } }),
      this.prisma.project.findFirst({ where: { id: projectId, companyId }, select: { id: true } }),
    ]);
    if (!template || !project) throw new NotFoundException('Plantilla o proyecto no encontrados.');
    const steps = parseTemplateSteps(template.stepsJson);
    if (!steps.length || steps.length > MAX_TEMPLATE_STEPS) {
      throw new BadRequestException('La plantilla no tiene pasos válidos.');
    }

    return this.prisma.$transaction(async (tx) => {
      await acquireTransactionLock(tx, `project-tasks:${projectId}`);
      const existing = await tx.projectTask.findMany({
        where: { projectId },
        select: { title: true },
      });
      const known = new Set(existing.map((task) => normalizeTitle(task.title)));
      const missing = steps.filter((title) => !known.has(normalizeTitle(title)));
      if (missing.length) {
        await tx.projectTask.createMany({ data: missing.map((title) => ({ projectId, title })) });
        await recalculateProjectProgress(tx, projectId);
      }
      return {
        created: missing.length,
        skipped: steps.length - missing.length,
        projectId,
      };
    }, TRANSACTION_OPTIONS);
  }
}
