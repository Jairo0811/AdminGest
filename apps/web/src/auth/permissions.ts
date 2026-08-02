export type AppRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_REP'
  | 'PROJECT_MANAGER'
  | 'VIEWER';

export type AppResource =
  | 'dashboard'
  | 'leads'
  | 'customers'
  | 'opportunities'
  | 'activities'
  | 'catalog'
  | 'quotes'
  | 'projects'
  | 'reports'
  | 'users'
  | 'settings';

export type AppAction = 'read' | 'write';

type RoleMatrix = Partial<Record<AppResource, AppAction[]>>;

const READ: AppAction[] = ['read'];
const READ_WRITE: AppAction[] = ['read', 'write'];

const ROLE_PERMISSIONS: Record<AppRole, RoleMatrix> = {
  SUPER_ADMIN: {},
  ADMIN: {},
  SALES_MANAGER: {
    dashboard: READ,
    leads: READ_WRITE,
    customers: READ_WRITE,
    opportunities: READ_WRITE,
    activities: READ_WRITE,
    catalog: READ_WRITE,
    quotes: READ_WRITE,
    projects: READ,
    reports: READ,
  },
  SALES_REP: {
    dashboard: READ,
    leads: READ_WRITE,
    customers: READ,
    opportunities: READ_WRITE,
    activities: READ_WRITE,
    catalog: READ,
    quotes: READ_WRITE,
  },
  PROJECT_MANAGER: {
    dashboard: READ,
    customers: READ,
    activities: READ,
    catalog: READ,
    quotes: READ,
    projects: READ_WRITE,
    reports: READ,
  },
  VIEWER: {
    dashboard: READ,
    leads: READ,
    customers: READ,
    opportunities: READ,
    activities: READ,
    catalog: READ,
    quotes: READ,
    projects: READ,
    reports: READ,
  },
};

export function hasPermission(
  role: string | undefined,
  resource: AppResource,
  action: AppAction = 'read',
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;

  return (
    ROLE_PERMISSIONS[role as AppRole]?.[resource]?.includes(action) ?? false
  );
}

export function resourceFromEndpoint(endpoint: string): AppResource | null {
  const segment = endpoint.replace(/^\//, '').split('/')[0];
  const resources: AppResource[] = [
    'leads',
    'customers',
    'opportunities',
    'activities',
    'catalog',
    'quotes',
    'projects',
    'reports',
    'users',
    'settings',
  ];

  return resources.includes(segment as AppResource)
    ? (segment as AppResource)
    : null;
}
