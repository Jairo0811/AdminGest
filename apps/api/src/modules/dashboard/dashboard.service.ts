import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(companyId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      company,
      newLeads,
      activeCustomers,
      openOpportunities,
      pendingQuotes,
      activeProjects,
      overdueTasks,
      opportunityGroups,
      stages,
      recentOpportunities,
      upcomingActivities,
      monthlyExpenses,
      inventory,
    ] = await Promise.all([
      this.prisma.company.findUniqueOrThrow({
        where: { id: companyId },
        select: { name: true, currency: true },
      }),
      this.prisma.lead.count({
        where: { companyId, createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      this.prisma.customer.count({ where: { companyId, isActive: true } }),
      this.prisma.opportunity.aggregate({
        where: { companyId, status: 'OPEN' },
        _count: true,
        _sum: { estimatedValue: true },
      }),
      this.prisma.quote.aggregate({
        where: { companyId, status: { in: ['DRAFT', 'SENT'] } },
        _count: true,
        _sum: { total: true },
      }),
      this.prisma.project.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.projectTask.count({
        where: {
          project: { companyId },
          dueDate: { lt: now },
          status: { not: 'COMPLETED' },
        },
      }),
      this.prisma.opportunity.groupBy({
        by: ['pipelineStageId'],
        where: { companyId, status: 'OPEN' },
        _count: true,
        _sum: { estimatedValue: true },
      }),
      this.prisma.pipelineStage.findMany({
        where: { companyId },
        orderBy: { position: 'asc' },
      }),
      this.prisma.opportunity.findMany({
        where: { companyId },
        include: {
          customer: { select: { name: true } },
          pipelineStage: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.activity.findMany({
        where: { companyId, status: 'PENDING', scheduledAt: { gte: now } },
        include: { customer: { select: { name: true } } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      this.prisma.expense.aggregate({
        where: { companyId, expenseDate: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.catalogItem.findMany({
        where: { companyId, type: 'PRODUCT', isActive: true },
        select: { stockQuantity: true, reorderPoint: true },
      }),
    ]);

    const groupedByStage = new Map(
      opportunityGroups.map((group) => [
        group.pipelineStageId,
        {
          count: group._count,
          value: Number(group._sum.estimatedValue ?? 0),
        },
      ]),
    );

    return {
      company,
      metrics: {
        newLeads,
        activeCustomers,
        openOpportunities: openOpportunities._count,
        pipelineValue: Number(openOpportunities._sum.estimatedValue ?? 0),
        pendingQuotes: pendingQuotes._count,
        pendingQuotesValue: Number(pendingQuotes._sum.total ?? 0),
        activeProjects,
        overdueTasks,
        monthlyExpenses: Number(monthlyExpenses._sum.amount ?? 0),
        lowStockItems: inventory.filter(
          (item) => Number(item.stockQuantity) <= Number(item.reorderPoint),
        ).length,
      },
      pipeline: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        position: stage.position,
        ...groupedByStage.get(stage.id),
        count: groupedByStage.get(stage.id)?.count ?? 0,
        value: groupedByStage.get(stage.id)?.value ?? 0,
      })),
      recentOpportunities,
      upcomingActivities,
    };
  }
}
