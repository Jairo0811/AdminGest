import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type TrendMetric = {
  value: number;
  variation: number | null;
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(companyId: string) {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(now.getDate() + 7);

    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - 30);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(currentPeriodStart.getDate() - 30);

    const chartStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      newLeads,
      customers,
      openOpportunities,
      pipeline,
      pendingQuotes,
      activeProjects,
      upcomingActivities,
      opportunities,
      stages,
      chartOpportunities,
      leadTrend,
      customerTrend,
      opportunityTrend,
      quoteTrend,
      projectTrend,
      pipelineTrend,
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
        include: {
          customer: { select: { name: true } },
          opportunity: { select: { name: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 6,
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
      this.prisma.pipelineStage.findMany({
        where: { companyId },
        orderBy: { position: 'asc' },
        include: {
          opportunities: {
            where: { status: 'OPEN' },
            select: { estimatedValue: true },
          },
        },
      }),
      this.prisma.opportunity.findMany({
        where: { companyId, createdAt: { gte: chartStart } },
        select: { createdAt: true, estimatedValue: true, status: true },
      }),
      this.periodCount('lead', companyId, currentPeriodStart, now, previousPeriodStart),
      this.periodCount('customer', companyId, currentPeriodStart, now, previousPeriodStart),
      this.periodCount('opportunity', companyId, currentPeriodStart, now, previousPeriodStart),
      this.periodCount('quote', companyId, currentPeriodStart, now, previousPeriodStart),
      this.periodCount('project', companyId, currentPeriodStart, now, previousPeriodStart),
      this.periodPipeline(companyId, currentPeriodStart, now, previousPeriodStart),
    ]);

    return {
      metrics: {
        newLeads: this.metric(newLeads, leadTrend),
        customers: this.metric(customers, customerTrend),
        openOpportunities: this.metric(openOpportunities, opportunityTrend),
        pipelineValue: this.metric(
          Number(pipeline._sum.estimatedValue ?? 0),
          pipelineTrend,
        ),
        pendingQuotes: this.metric(pendingQuotes, quoteTrend),
        activeProjects: this.metric(activeProjects, projectTrend),
      },
      salesEvolution: this.buildMonthlySeries(chartOpportunities, chartStart, now),
      opportunitiesByStage: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        probability: stage.probability,
        count: stage.opportunities.length,
        value: stage.opportunities.reduce(
          (total, opportunity) => total + Number(opportunity.estimatedValue),
          0,
        ),
      })),
      upcomingActivities,
      recentOpportunities: opportunities,
    };
  }

  private metric(value: number, trend: TrendMetric): TrendMetric {
    return { value, variation: trend.variation };
  }

  private async periodCount(
    model: 'lead' | 'customer' | 'opportunity' | 'quote' | 'project',
    companyId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
  ): Promise<TrendMetric> {
    const repository = this.prisma[model] as unknown as {
      count(args: { where: Record<string, unknown> }): Promise<number>;
    };

    const [current, previous] = await Promise.all([
      repository.count({
        where: { companyId, createdAt: { gte: currentStart, lte: currentEnd } },
      }),
      repository.count({
        where: { companyId, createdAt: { gte: previousStart, lt: currentStart } },
      }),
    ]);

    return { value: current, variation: this.variation(current, previous) };
  }

  private async periodPipeline(
    companyId: string,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
  ): Promise<TrendMetric> {
    const [current, previous] = await Promise.all([
      this.prisma.opportunity.aggregate({
        where: {
          companyId,
          createdAt: { gte: currentStart, lte: currentEnd },
        },
        _sum: { estimatedValue: true },
      }),
      this.prisma.opportunity.aggregate({
        where: {
          companyId,
          createdAt: { gte: previousStart, lt: currentStart },
        },
        _sum: { estimatedValue: true },
      }),
    ]);

    const currentValue = Number(current._sum.estimatedValue ?? 0);
    const previousValue = Number(previous._sum.estimatedValue ?? 0);

    return {
      value: currentValue,
      variation: this.variation(currentValue, previousValue),
    };
  }

  private variation(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }

  private buildMonthlySeries(
    opportunities: Array<{
      createdAt: Date;
      estimatedValue: unknown;
      status: string;
    }>,
    start: Date,
    now: Date,
  ) {
    const formatter = new Intl.DateTimeFormat('es-DO', { month: 'short' });
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: formatter.format(date).replace('.', ''),
        value: 0,
        wonValue: 0,
        count: 0,
      };
    });

    const indexed = new Map(months.map((month) => [month.key, month]));

    for (const opportunity of opportunities) {
      const key = `${opportunity.createdAt.getFullYear()}-${opportunity.createdAt.getMonth()}`;
      const month = indexed.get(key);
      if (!month) continue;

      const value = Number(opportunity.estimatedValue);
      month.value += value;
      month.count += 1;
      if (opportunity.status === 'WON') month.wonValue += value;
    }

    return months.filter((month, index) => index < 5 || now >= start);
  }
}
