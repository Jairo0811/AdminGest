export interface AuthUser {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

export interface DashboardData {
  company: { name: string; currency: string };
  metrics: {
    newLeads: number;
    activeCustomers: number;
    openOpportunities: number;
    pipelineValue: number;
    pendingQuotes: number;
    pendingQuotesValue: number;
    activeProjects: number;
    overdueTasks: number;
    monthlyExpenses: number;
    lowStockItems: number;
  };
  pipeline: Array<{ id: string; name: string; count: number; value: number }>;
  recentOpportunities: Array<{
    id: string;
    name: string;
    estimatedValue: number | string;
    customer: { name: string };
    pipelineStage: { name: string };
  }>;
  upcomingActivities: Array<{
    id: string;
    subject: string;
    type: string;
    scheduledAt: string;
    customer?: { name: string };
  }>;
}
