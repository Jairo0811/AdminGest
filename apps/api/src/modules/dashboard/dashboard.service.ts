import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(companyId: string) {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    const [
      leads,
      customers,
      openOpportunities,
      pipeline,
      pendingQuotes,
      activeProjects,
      upcomingActivities,
      opportunities,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { companyId, status: 'NEW' } }),
      this.prisma.customer.count({ where: { companyId, isActive: true } }),
      this.prisma.opportunity.count({ where: { companyId, status: 'OPEN' } }),
      this.prisma.opportunity.aggregate({
        where: { companyId, status: 'OPEN' },
        _sum: { estimatedValue: true },
      }),
      this.prisma.quote.count({
        where: { companyId, status: { in: ['DRAFT', 'SENT'] } },
      }),
      this.prisma.project.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.activity.findMany({
        where: {
          companyId,
          status: 'PENDING',
          scheduledAt: { gte: now, lte: inSevenDays },
        },
        include: { customer: { select: { name: true } } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      this.prisma.opportunity.findMany({
        where: { companyId, status: 'OPEN' },
        include: {
          customer: { select: { name: true } },
          pipelineStage: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      metrics: {
        newLeads: leads,
        customers,
        openOpportunities,
        pipelineValue: Number(pipeline._sum.estimatedValue ?? 0),
        pendingQuotes,
        activeProjects,
      },
      upcomingActivities,
      recentOpportunities: opportunities,
    };
  }
}

