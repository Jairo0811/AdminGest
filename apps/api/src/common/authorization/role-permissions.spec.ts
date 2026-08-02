import {
  resolveAction,
  resolveResource,
  roleHasPermission,
} from './role-permissions';

describe('role permissions', () => {
  it('permite acceso total a administradores', () => {
    expect(roleHasPermission('ADMIN', 'users', 'write')).toBe(true);
    expect(roleHasPermission('SUPER_ADMIN', 'settings', 'write')).toBe(true);
  });

  it('restringe administración de usuarios a perfiles no administrativos', () => {
    expect(roleHasPermission('SALES_MANAGER', 'users', 'read')).toBe(false);
    expect(roleHasPermission('PROJECT_MANAGER', 'users', 'write')).toBe(false);
    expect(roleHasPermission('VIEWER', 'users', 'read')).toBe(false);
  });

  it('mantiene al visor en modo de solo lectura', () => {
    expect(roleHasPermission('VIEWER', 'customers', 'read')).toBe(true);
    expect(roleHasPermission('VIEWER', 'customers', 'write')).toBe(false);
    expect(roleHasPermission('VIEWER', 'projects', 'write')).toBe(false);
  });

  it('separa los alcances comercial y de proyectos', () => {
    expect(roleHasPermission('SALES_REP', 'opportunities', 'write')).toBe(true);
    expect(roleHasPermission('SALES_REP', 'projects', 'read')).toBe(false);
    expect(roleHasPermission('PROJECT_MANAGER', 'projects', 'write')).toBe(true);
    expect(roleHasPermission('PROJECT_MANAGER', 'opportunities', 'read')).toBe(false);
  });

  it('resuelve recurso y acción desde una solicitud HTTP', () => {
    expect(resolveResource('/api/opportunities/123?include=customer')).toBe(
      'opportunities',
    );
    expect(resolveAction('GET')).toBe('read');
    expect(resolveAction('PATCH')).toBe('write');
  });
});
