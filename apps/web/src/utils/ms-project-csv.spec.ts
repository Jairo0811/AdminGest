import { describe, expect, it } from 'vitest';
import {
  buildMicrosoftProjectCsv,
  parseMicrosoftProjectCsv,
} from './ms-project-csv';

describe('Microsoft Project CSV interoperability', () => {
  it('parses English Microsoft Project headers', () => {
    const rows = parseMicrosoftProjectCsv(
      'ID,Name,Start,Finish,Duration,% Complete,Resource Names,Predecessors,Milestone\n1,Analysis,2026-08-01,2026-08-03,2 days,50%,Jairo,,No\n2,Approval,2026-08-03,2026-08-03,0 days,0%,,1,Yes',
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: 1, name: 'Analysis', durationDays: 2, percentComplete: 50 });
    expect(rows[1].predecessors).toEqual([1]);
    expect(rows[1].milestone).toBe(true);
  });

  it('supports Spanish headers and exports a BOM CSV', () => {
    const rows = parseMicrosoftProjectCsv(
      'ID,Nombre de tarea,Inicio,Fin,Duración,Porcentaje completado,Recursos,Predecesoras,Hito\n1,Diseño,2026-08-01,2026-08-05,4 días,25%,Equipo,,No',
    );

    const csv = buildMicrosoftProjectCsv(rows);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('ID,Name,Start,Finish,Duration,% Complete');
    expect(csv).toContain('Diseño');
  });

  it('rejects files without a task name column', () => {
    expect(() => parseMicrosoftProjectCsv('ID,Start\n1,2026-08-01')).toThrow(
      'Name o Nombre de tarea',
    );
  });
});
