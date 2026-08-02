export type AppRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SALES_MANAGER'
  | 'SALES_REP'
  | 'PROJECT_MANAGER'
  | 'VIEWER';

export type PermissionAction = 'read' | 'write';

export type PermissionResource =
  | 'dashboard'
  | 'navigation'
  | 'leads'
  | 'customers'
  | 'opportunities'
  | 'activities'
  | 'catalog'
  | 'quotes'
  | 'projects'
  | 'reports'
  | 'users'
  | 'settings'
  | 'profile';

type RolePermissions = Partial<Record<PermissionResource, PermissionAction[]>>;

const READ: PermissionAction[] = ['read'];
const READ_WRITE: PermissionAction[] = ['read', 'write'];

export const ROLE_PERMISSIONS: Record<AppRole, RolePermissions> = {
  SUPER_ADMIN: {},
  ADMIN: {},
  SALES_MANAGER: {
    dashboard: READ,
    navigation: READ,
    leads: READ_WRITE,
    customers: READ_WRITE,
    opportunities: READ_WRITE,
    activities: READ_WRITE,
    catalog: READ_WRITE,
    quotes: READ_WRITE,
    projects: READ,
    reports: READ,
    profile: READ_WRITE,
  },
  SALES_REP: {
    dashboard: READ,
    navigation: READ,
    leads: READ_WRITE,
    customers: READ,
    opportunities: READ_WRITE,
    activities: READ_WRITE,
    catalog: READ,
    quotes: READ_WRITE,
    profile: READ_WRITE,
  },
  PROJECT_MANAGER: {
    dashboard: READ,
    navigation: READ,
    customers: READ,
    activities: READ,
    catalog: READ,
    quotes: READ,
    projects: READ_WRITE,
    reports: READ,
    profile: READ_WRITE,
  },
  VIEWER: {
    dashboard: READ,
    navigation: READ,
    leads: READ,
    customers: READ,
    opportunities: READ,
    activities: READ,
    catalog: READ,
    quotes: READ,
    projects: READ,
    reports: READ,
    profile: READ_WRITE,
  },
};

const RESOURCE_ALIASES: Record<string, PermissionResource> = {
  dashboard: 'dashboard',
  navigation: 'navigation',
  leads: 'leads',
  customers: 'customers',
  opportunities: 'opportunities',
  activities: 'activities',
  catalog: 'catalog',
  quotes: 'quotes',
  projects: 'projects',
  reports: 'reports',
  users: 'users',
  settings: 'settings',
};

export function resolveResource(url: string): PermissionResource | null {
  const cleanPath = url.split('?')[0].replace(/^\/api\/?/, '').replace(/^\//, '');
  const firstSegment = cleanPath.split('/')[0];

  if (firstSegment === 'auth') return 'profile';
  return RESOURCE_ALIASES[firstSegment] ?? null;
}

export function resolveAction(method: string): PermissionAction {
  return method.toUpperCase() === 'GET' ? 'read' : 'write';
}

export function roleHasPermission(
  role: string,
  resource: PermissionResource,
  action: PermissionAction,
): boolean {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') return true;

  const permissions = ROLE_PERMISSIONS[role as AppRole]?.[resource] ?? [];
  return permissions.includes(action);
}
