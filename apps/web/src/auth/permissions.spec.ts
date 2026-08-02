import { describe, expect, it } from 'vitest';
import { hasPermission, resourceFromEndpoint } from './permissions';

describe('frontend permissions', () => {
  it('reserva usuarios y configuración para administradores', () => {
    expect(hasPermission('ADMIN', 'users', 'write')).toBe(true);
    expect(hasPermission('SALES_MANAGER', 'users')).toBe(false);
    expect(hasPermission('PROJECT_MANAGER', 'settings')).toBe(false);
  });

  it('mantiene al visor sin permisos de escritura', () => {
    expect(hasPermission('VIEWER', 'customers', 'read')).toBe(true);
    expect(hasPermission('VIEWER', 'customers', 'write')).toBe(false);
  });

  it('separa ventas de proyectos', () => {
    expect(hasPermission('SALES_REP', 'opportunities', 'write')).toBe(true);
    expect(hasPermission('SALES_REP', 'projects')).toBe(false);
    expect(hasPermission('PROJECT_MANAGER', 'projects', 'write')).toBe(true);
  });

  it('resuelve el recurso desde el endpoint', () => {
    expect(resourceFromEndpoint('/quotes')).toBe('quotes');
    expect(resourceFromEndpoint('/projects/123')).toBe('projects');
    expect(resourceFromEndpoint('/unknown')).toBeNull();
  });
});
