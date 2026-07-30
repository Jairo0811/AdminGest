import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../common/types/auth-user';
import { ResourceQueryDto } from '../../common/types/resource-query.dto';
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

  async findAll(user: AuthUser, query: ResourceQueryDto) {
    const where = {
      companyId: user.companyId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { name: { contains: query.search.trim() } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          manager: { select: { firstName: true, lastName: true } },
          tasks: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.project.count({ where }),
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
    const project = await this.prisma.project.findFirst({
      where: { id, companyId: user.companyId },
      include: {
        customer: true,
        opportunity: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        tasks: {
          include: { assignee: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado.');
    return project;
  }

  async create(user: AuthUser, dto: CreateProjectDto) {
    await this.validateRelations(user.companyId, dto.customerId, dto.opportunityId);
    const project = await this.prisma.project.create({
      data: {
        companyId: user.companyId,
        managerId: user.id,
        ...dto,
      },
      include: { customer: true, tasks: true },
    });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'CREATE',
      entity: 'Project',
      entityId: project.id,
      newValues: project,
    });
    return project;
  }

  async update(user: AuthUser, id: string, dto: UpdateProjectDto) {
    const before = await this.findOne(user, id);
    await this.validateRelations(
      user.companyId,
      dto.customerId ?? before.customerId,
      dto.opportunityId,
    );
    const project = await this.prisma.project.update({ where: { id }, data: dto });
    await this.audit.log({
      companyId: user.companyId,
      userId: user.id,
      action: 'UPDATE',
      entity: 'Project',
      entityId: id,
      oldValues: before,
      newValues: project,
    });
    return project;
  }

  async addTask(user: AuthUser, projectId: string, dto: CreateTaskDto) {
    await this.findOne(user, projectId);
    await this.validateTaskRelations(user.companyId, projectId, dto.assigneeId, dto.parentId);
    return this.prisma.projectTask.create({
      data: { projectId, ...dto },
    });
  }

  async updateTask(user: AuthUser, projectId: string, taskId: string, dto: UpdateTaskDto) {
    await this.findOne(user, projectId);
    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, projectId },
    });
    if (!task) throw new NotFoundException('Tarea no encontrada.');
    await this.validateTaskRelations(user.companyId, projectId, dto.assigneeId, dto.parentId);
    const data = {
      ...dto,
      progress: dto.status === 'COMPLETED' && dto.progress === undefined ? 100 : dto.progress,
    };
    const updated = await this.prisma.projectTask.update({ where: { id: taskId }, data });
    await this.recalculateProgress(projectId);
    return updated;
  }

  async archive(user: AuthUser, id: string) {
    await this.findOne(user, id);
    return this.prisma.project.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
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

  private async validateRelations(companyId: string, customerId: string, opportunityId?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId, isActive: true },
    });
    if (!customer) throw new BadRequestException('El cliente indicado no es válido.');
    if (opportunityId) {
      const opportunity = await this.prisma.opportunity.findFirst({
        where: { id: opportunityId, companyId },
      });
      if (!opportunity) throw new BadRequestException('La oportunidad indicada no es válida.');
    }
  }

  private async validateTaskRelations(
    companyId: string,
    projectId: string,
    assigneeId?: string,
    parentId?: string,
  ) {
    if (assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: assigneeId, companyId, status: 'ACTIVE' },
      });
      if (!assignee) throw new BadRequestException('El responsable indicado no es válido.');
    }
    if (parentId) {
      const parent = await this.prisma.projectTask.findFirst({
        where: { id: parentId, projectId },
      });
      if (!parent) throw new BadRequestException('La tarea principal no es válida.');
    }
  }
}
