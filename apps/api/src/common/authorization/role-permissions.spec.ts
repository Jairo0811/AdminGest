import {
  resolveAction,
  resolveResource,
  roleHasPermission,
} from './role-permissions';

describe('role permissions', () => {
  it('permite acceso total a administradores', () => {
    expect(roleHasPermission('ADMIN', 'users', 'write')).toBe(true);
    expect(roleHasPermission('SUPER_ADMIN', 'settings', 'write')).toBe(true);
    expect(roleHasPermission('ADMIN', 'projects', 'write')).toBe(true);
    expect(roleHasPermission('SUPER_ADMIN', 'reports', 'read')).toBe(true);
  });

  it('restringe administración de usuarios a perfiles no administrativos', () => {
    expect(roleHasPermission('SALES_MANAGER', 'users', 'read')).toBe(false);
    expect(roleHasPermission('PROJECT_MANAGER', 'users', 'write')).toBe(false);
    expect(roleHasPermission('VIEWER', 'users', 'read')).toBe(false);
    expect(roleHasPermission('SALES_REP', 'settings', 'read')).toBe(false);
  });

  it('mantiene al visor en modo de solo lectura', () => {
    const readableResources = [
      'dashboard',
      'leads',
      'customers',
      'opportunities',
      'activities',
      'catalog',
      'quotes',
      'projects',
      'reports',
    ] as const;

    readableResources.forEach((resource) => {
      expect(roleHasPermission('VIEWER', resource, 'read')).toBe(true);
      expect(roleHasPermission('VIEWER', resource, 'write')).toBe(false);
    });
  });

  it('aplica el alcance comercial del gerente comercial', () => {
    const writableResources = [
      'leads',
      'customers',
      'opportunities',
      'activities',
      'catalog',
      'quotes',
    ] as const;

    writableResources.forEach((resource) => {
      expect(roleHasPermission('SALES_MANAGER', resource, 'write')).toBe(true);
    });

    expect(roleHasPermission('SALES_MANAGER', 'projects', 'read')).toBe(true);
    expect(roleHasPermission('SALES_MANAGER', 'projects', 'write')).toBe(false);
    expect(roleHasPermission('SALES_MANAGER', 'reports', 'read')).toBe(true);
  });

  it('aplica el alcance operativo del representante de ventas', () => {
    expect(roleHasPermission('SALES_REP', 'leads', 'write')).toBe(true);
    expect(roleHasPermission('SALES_REP', 'opportunities', 'write')).toBe(true);
    expect(roleHasPermission('SALES_REP', 'activities', 'write')).toBe(true);
    expect(roleHasPermission('SALES_REP', 'quotes', 'write')).toBe(true);
    expect(roleHasPermission('SALES_REP', 'customers', 'read')).toBe(true);
    expect(roleHasPermission('SALES_REP', 'customers', 'write')).toBe(false);
    expect(roleHasPermission('SALES_REP', 'catalog', 'read')).toBe(true);
    expect(roleHasPermission('SALES_REP', 'catalog', 'write')).toBe(false);
    expect(roleHasPermission('SALES_REP', 'projects', 'read')).toBe(false);
    expect(roleHasPermission('SALES_REP', 'reports', 'read')).toBe(false);
  });

  it('aplica el alcance del gerente de proyectos', () => {
    expect(roleHasPermission('PROJECT_MANAGER', 'projects', 'read')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'projects', 'write')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'customers', 'read')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'activities', 'read')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'catalog', 'read')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'quotes', 'read')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'reports', 'read')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'opportunities', 'read')).toBe(false);
    expect(roleHasPermission('PROJECT_MANAGER', 'customers', 'write')).toBe(false);
  });

  it('resuelve recurso y acción desde una solicitud HTTP', () => {
    expect(resolveResource('/api/opportunities/123?include=customer')).toBe(
      'opportunities',
    );
    expect(resolveResource('/api/projects/import/ms-project')).toBe('projects');
    expect(resolveResource('/api/users')).toBe('users');
    expect(resolveAction('GET')).toBe('read');
    expect(resolveAction('HEAD')).toBe('write');
    expect(resolveAction('POST')).toBe('write');
    expect(resolveAction('PATCH')).toBe('write');
    expect(resolveAction('PUT')).toBe('write');
    expect(resolveAction('DELETE')).toBe('write');
  });

  it('rechaza roles, recursos o métodos desconocidos de forma segura', () => {
    expect(roleHasPermission('UNKNOWN_ROLE', 'customers', 'read')).toBe(false);
    expect(roleHasPermission('', 'customers', 'read')).toBe(false);
    expect(resolveResource('/api/unknown-resource')).toBeNull();
    expect(resolveAction('OPTIONS')).toBe('write');
  });
});
