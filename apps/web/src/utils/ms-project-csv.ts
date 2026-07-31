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
  const parsed = Number(String(value ?? '0').replace('%', '').trim());
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
};

const parseDuration = (value?: string) => {
  const parsed = Number(String(value ?? '0').replace(/[^0-9.,-]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export function parseMicrosoftProjectCsv(content: string): ProjectCsvRow[] {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
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

  return lines.slice(1).map((line, rowIndex) => {
    const values = splitCsvLine(line);
    const id = indexes.id >= 0 ? Number(values[indexes.id]) : rowIndex + 1;
    const durationDays = indexes.duration >= 0 ? parseDuration(values[indexes.duration]) : 0;
    const milestoneValue = indexes.milestone >= 0 ? values[indexes.milestone]?.toLowerCase() : '';
    const predecessorText = indexes.predecessors >= 0 ? values[indexes.predecessors] : '';

    return {
      id: Number.isFinite(id) ? id : rowIndex + 1,
      name: values[indexes.name]?.trim(),
      start: indexes.start >= 0 ? parseDate(values[indexes.start]) : undefined,
      finish: indexes.finish >= 0 ? parseDate(values[indexes.finish]) : undefined,
      durationDays,
      percentComplete: indexes.percent >= 0 ? parsePercent(values[indexes.percent]) : 0,
      resourceNames: indexes.resources >= 0 ? values[indexes.resources]?.trim() : undefined,
      predecessors: predecessorText
        ? predecessorText.split(/[;,]/).map((value) => Number(value.trim())).filter(Number.isFinite)
        : [],
      milestone: ['yes', 'true', 'sí', 'si', '1'].includes(milestoneValue) || durationDays === 0,
    };
  }).filter((row) => row.name);
}

const csvValue = (value: unknown) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function buildMicrosoftProjectCsv(rows: ProjectCsvRow[]) {
  const headers = ['ID', 'Name', 'Start', 'Finish', 'Duration', '% Complete', 'Resource Names', 'Predecessors', 'Milestone'];
  const body = rows.map((row) => [
    row.id,
    row.name,
    row.start ? new Date(row.start).toLocaleDateString('en-US') : '',
    row.finish ? new Date(row.finish).toLocaleDateString('en-US') : '',
    `${row.durationDays} days`,
    `${row.percentComplete}%`,
    row.resourceNames ?? '',
    row.predecessors?.join(',') ?? '',
    row.milestone ? 'Yes' : 'No',
  ].map(csvValue).join(','));

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
