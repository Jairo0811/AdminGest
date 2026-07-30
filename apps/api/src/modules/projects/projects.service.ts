import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  findAll(companyId: string, status?: string) {
    return this.prisma.project.findMany({
      where: { companyId, ...(status ? { status } : {}) },
      include: {
        customer: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId },
      include: {
        customer: true,
        opportunity: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        },
      },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado.');
    return project;
  }

  async create(companyId: string, userId: string, dto: CreateProjectDto) {
    await this.validateReferences(companyId, dto.customerId, dto.opportunityId);
    const project = await this.prisma.project.create({
      data: {
        companyId,
        ...dto,
        managerId: dto.managerId ?? userId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: { customer: true, manager: true },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'Project',
      entityId: project.id,
      newValues: dto,
    });
    return project;
  }

  async update(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateProjectDto,
  ) {
    const existing = await this.findOne(companyId, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'Project',
      entityId: id,
      oldValues: existing,
      newValues: dto,
    });
    return project;
  }

  async addTask(
    companyId: string,
    userId: string,
    projectId: string,
    dto: CreateTaskDto,
  ) {
    await this.findOne(companyId, projectId);
    const task = await this.prisma.projectTask.create({
      data: {
        projectId,
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'CREATE',
      entity: 'ProjectTask',
      entityId: task.id,
      newValues: dto,
    });
    await this.recalculateProgress(projectId);
    return task;
  }

  async updateTask(
    companyId: string,
    userId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    const existing = await this.prisma.projectTask.findFirst({
      where: { id: taskId, project: { companyId } },
    });
    if (!existing) throw new NotFoundException('Tarea no encontrada.');
    const task = await this.prisma.projectTask.update({
      where: { id: taskId },
      data: {
        ...dto,
        progress: dto.status === 'COMPLETED' ? 100 : dto.progress,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
    await this.audit.record({
      companyId,
      userId,
      action: 'UPDATE',
      entity: 'ProjectTask',
      entityId: taskId,
      oldValues: existing,
      newValues: dto,
    });
    await this.recalculateProgress(task.projectId);
    return task;
  }

  async remove(companyId: string, userId: string, id: string) {
    const existing = await this.findOne(companyId, id);
    await this.prisma.$transaction([
      this.prisma.projectTask.deleteMany({ where: { projectId: id } }),
      this.prisma.project.delete({ where: { id } }),
    ]);
    await this.audit.record({
      companyId,
      userId,
      action: 'DELETE',
      entity: 'Project',
      entityId: id,
      oldValues: existing,
    });
    return { deleted: true };
  }

  private async recalculateProgress(projectId: string) {
    const aggregate = await this.prisma.projectTask.aggregate({
      where: { projectId },
      _avg: { progress: true },
    });
    await this.prisma.project.update({
      where: { id: projectId },
      data: { progress: Math.round(aggregate._avg.progress ?? 0) },
    });
  }

  private async validateReferences(
    companyId: string,
    customerId: string,
    opportunityId?: string,
  ) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId },
    });
    const opportunity = opportunityId
      ? await this.prisma.opportunity.findFirst({
          where: { id: opportunityId, companyId },
        })
      : true;
    if (!customer || !opportunity) {
      throw new NotFoundException('Cliente u oportunidad no válidos.');
    }
  }
}

