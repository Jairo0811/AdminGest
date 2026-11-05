import { cssPercent, html, SafeHtml } from './html';

export interface GanttTask {
  title: string;
  status: string;
  progress: number;
  startDate?: string;
  dueDate?: string;
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  BLOCKED: 'Bloqueada',
  COMPLETED: 'Completada',
};

const DAY = 86_400_000;

/**
 * Printable Gantt chart of a project. Project and task names come from users and are
 * always escaped; bar positions are numbers clamped to 0–100 %.
 */
export function buildGanttPrintBody(
  projectName: string,
  tasks: GanttTask[],
  now = new Date(),
): SafeHtml {
  const dated = tasks.filter((task) => task.startDate && task.dueDate);
  const min = Math.min(...dated.map((task) => new Date(task.startDate!).getTime()));
  const max = Math.max(...dated.map((task) => new Date(task.dueDate!).getTime()));
  const span = Math.max(DAY, max - min);
  const date = (value: string) => new Date(value).toLocaleDateString('es-DO');

  const rows = dated.map((task) => {
    const start = new Date(task.startDate!).getTime();
    const end = new Date(task.dueDate!).getTime();
    const left = ((start - min) / span) * 100;
    const width = Math.min(100 - left, Math.max(2, ((end - start) / span) * 100));
    const late = task.status !== 'COMPLETED' && new Date(task.dueDate!) < now;
    const progress = Math.min(100, Math.max(0, Math.round(Number(task.progress) || 0)));
    return html`<tr${late ? html` class="late"` : ''}>
      <td>${task.title}</td>
      <td>${TASK_STATUS_LABELS[task.status] ?? task.status}${late ? ' · Atrasada' : ''}</td>
      <td>${date(task.startDate!)}</td>
      <td>${date(task.dueDate!)}</td>
      <td>${progress} %</td>
      <td><div class="gantt-track"><span class="gantt-bar" style="left:${cssPercent(left)};width:${cssPercent(width)}"></span></div></td>
    </tr>`;
  });

  return html`<header class="gantt-header">
      <div><span class="label">Cronograma del proyecto</span><h1>${projectName}</h1>
      <p class="muted">${dated.length} tareas · ${dated.length ? `${date(new Date(min).toISOString())} – ${date(new Date(max).toISOString())}` : ''}</p></div>
    </header>
    <table class="gantt-table">
      <thead><tr><th>Tarea</th><th>Estado</th><th>Inicio</th><th>Fin</th><th>Avance</th><th>Gantt</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
