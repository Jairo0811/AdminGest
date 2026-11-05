export interface ProjectCsvRow {
  id: number;
  name: string;
  start?: string;
  finish?: string;
  durationDays: number;
  percentComplete: number;
  resourceNames?: string;
  predecessors?: number[];
  milestone: boolean;
}

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replaceAll(' ', '').replaceAll('_', '');

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  values.push(current.trim());
  return values;
};

const parseDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const parsePercent = (value?: string) => {
  const parsed = Number(
    String(value ?? '0')
      .replace('%', '')
      .trim(),
  );
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
};

const parseDuration = (value?: string) => {
  const parsed = Number(
    String(value ?? '0')
      .replace(/[^0-9.,-]/g, '')
      .replace(',', '.'),
  );
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export function parseMicrosoftProjectCsv(content: string): ProjectCsvRow[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(Boolean);
  if (lines.length < 2) throw new Error('El CSV no contiene tareas para importar.');

  const headers = splitCsvLine(lines[0]).map(normalizeHeader);
  const indexOf = (...aliases: string[]) =>
    headers.findIndex((header) => aliases.map(normalizeHeader).includes(header));

  const indexes = {
    id: indexOf('ID', 'Identificador'),
    name: indexOf('Name', 'Task Name', 'Nombre', 'Nombre de tarea'),
    start: indexOf('Start', 'Inicio'),
    finish: indexOf('Finish', 'Fin', 'Finalización'),
    duration: indexOf('Duration', 'Duración'),
    percent: indexOf('% Complete', 'Percent Complete', 'Porcentaje completado', 'Completado'),
    resources: indexOf('Resource Names', 'Resources', 'Nombres de recursos', 'Recursos'),
    predecessors: indexOf('Predecessors', 'Predecesoras', 'Predecesores'),
    milestone: indexOf('Milestone', 'Hito'),
  };

  if (indexes.name < 0) {
    throw new Error('El CSV debe incluir la columna Name o Nombre de tarea.');
  }

  return lines
    .slice(1)
    .map((line, rowIndex) => {
      const values = splitCsvLine(line);
      const id = indexes.id >= 0 ? Number(values[indexes.id]) : rowIndex + 1;
      const durationDays = indexes.duration >= 0 ? parseDuration(values[indexes.duration]) : 0;
      const milestoneValue = indexes.milestone >= 0 ? values[indexes.milestone]?.toLowerCase() : '';
      const predecessorText = indexes.predecessors >= 0 ? values[indexes.predecessors] : '';

      return {
        id: Number.isFinite(id) ? id : rowIndex + 1,
        name: restoreFormulaText(values[indexes.name]?.trim() ?? ''),
        start: indexes.start >= 0 ? parseDate(values[indexes.start]) : undefined,
        finish: indexes.finish >= 0 ? parseDate(values[indexes.finish]) : undefined,
        durationDays,
        percentComplete: indexes.percent >= 0 ? parsePercent(values[indexes.percent]) : 0,
        resourceNames:
          indexes.resources >= 0
            ? restoreFormulaText(values[indexes.resources]?.trim() ?? '')
            : undefined,
        predecessors: predecessorText
          ? predecessorText
              .split(/[;,]/)
              .map((value) => Number(value.trim()))
              .filter(Number.isFinite)
          : [],
        milestone: ['yes', 'true', 'sí', 'si', '1'].includes(milestoneValue) || durationDays === 0,
      };
    })
    .filter((row) => row.name);
}

/** Characters that make spreadsheets interpret a cell as a formula (CSV injection). */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Neutralises formulas in free-text cells by prefixing an apostrophe (OWASP). */
export const neutralizeFormula = (text: string) => (FORMULA_PREFIX.test(text) ? `'${text}` : text);

/** Reverts {@link neutralizeFormula} when AdminGest reads back its own export. */
const restoreFormulaText = (text: string) =>
  text.startsWith("'") && FORMULA_PREFIX.test(text.slice(1)) ? text.slice(1) : text;

const csvValue = (value: unknown) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const MAX_IMPORT_ROWS = 500;
export const MAX_TASK_TITLE_LENGTH = 150;

/** Validates every row before any task is created, so an import never stops halfway. */
export function validateImportRows(rows: ProjectCsvRow[]): void {
  if (!rows.length) throw new Error('El CSV no contiene tareas para importar.');
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error(`El CSV supera el máximo de ${MAX_IMPORT_ROWS} tareas por importación.`);
  }
  const invalid = rows.findIndex((row) => row.name.length > MAX_TASK_TITLE_LENGTH);
  if (invalid >= 0) {
    throw new Error(
      `La fila ${invalid + 2} tiene un nombre de tarea de más de ${MAX_TASK_TITLE_LENGTH} caracteres.`,
    );
  }
  const reversed = rows.findIndex(
    (row) => row.start && row.finish && new Date(row.finish) < new Date(row.start),
  );
  if (reversed >= 0) {
    throw new Error(`La fila ${reversed + 2} termina antes de su fecha de inicio.`);
  }
}

export function buildMicrosoftProjectCsv(rows: ProjectCsvRow[]) {
  const headers = [
    'ID',
    'Name',
    'Start',
    'Finish',
    'Duration',
    '% Complete',
    'Resource Names',
    'Predecessors',
    'Milestone',
  ];
  const body = rows.map((row) =>
    [
      row.id,
      neutralizeFormula(row.name),
      row.start ? new Date(row.start).toLocaleDateString('en-US') : '',
      row.finish ? new Date(row.finish).toLocaleDateString('en-US') : '',
      `${row.durationDays} days`,
      `${row.percentComplete}%`,
      neutralizeFormula(row.resourceNames ?? ''),
      row.predecessors?.join(',') ?? '',
      row.milestone ? 'Yes' : 'No',
    ]
      .map(csvValue)
      .join(','),
  );

  return `\uFEFF${headers.join(',')}\n${body.join('\n')}`;
}

export function downloadMicrosoftProjectCsv(fileName: string, rows: ProjectCsvRow[]) {
  const blob = new Blob([buildMicrosoftProjectCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
