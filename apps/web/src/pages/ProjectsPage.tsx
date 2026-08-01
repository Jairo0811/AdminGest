import { ChangeEvent, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarRange,
  Download,
  FileUp,
  List,
  Milestone,
  Printer,
} from 'lucide-react';
import { api } from '../api/client';
import { Entity, EntityPage } from '../components/EntityPage';
import { printDocument } from '../utils/export';
import {
  downloadMicrosoftProjectCsv,
  parseMicrosoftProjectCsv,
  ProjectCsvRow,
} from '../utils/ms-project-csv';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0,
});

interface ProjectTask extends Entity {
  title: string;
  status: string;
  progress: number;
  startDate?: string;
  dueDate?: string;
  parentId?: string;
  assignee?: { firstName: string; lastName: string };
}

interface Project extends Entity {
  name: string;
  status: string;
  progress: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  customer: { name: string };
  tasks?: ProjectTask[];
  _count?: { tasks: number };
}

const projectFields = [
  { name: 'name', label: 'Nombre', required: true },
  {
    name: 'customerId',
    label: 'Cliente',
    type: 'select' as const,
    required: true,
    optionsEndpoint: '/customers',
    optionLabel: (item: Entity) => String(item.name),
  },
  { name: 'startDate', label: 'Inicio', type: 'date' as const },
  { name: 'endDate', label: 'Finalización', type: 'date' as const },
  { name: 'budget', label: 'Presupuesto', type: 'number' as const },
  {
    name: 'status',
    label: 'Estado',
    type: 'select' as const,
    options: [
      { value: 'PLANNED', label: 'Planificado' },
      { value: 'ACTIVE', label: 'Activo' },
      { value: 'ON_HOLD', label: 'En pausa' },
      { value: 'COMPLETED', label: 'Completado' },
      { value: 'CANCELLED', label: 'Cancelado' },
    ],
  },
  { name: 'progress', label: 'Progreso (%)', type: 'number' as const },
  { name: 'description', label: 'Descripción', type: 'textarea' as const },
];

const daysBetween = (start?: string, finish?: string) => {
  if (!start || !finish) return 0;
  const milliseconds = new Date(finish).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(milliseconds / 86_400_000));
};

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'timeline' | 'interop'>('table');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');

  const projects = useQuery({
    queryKey: ['/projects'],
    queryFn: () => api<Project[]>('/projects'),
  });

  const selectedProject = useQuery({
    queryKey: ['/projects', selectedProjectId],
    queryFn: () => api<Project>(`/projects/${selectedProjectId}`),
    enabled: Boolean(selectedProjectId),
  });

  const timeline = useMemo(() => {
    const dated = (projects.data ?? []).filter(
      (project) => project.startDate && project.endDate,
    );
    if (!dated.length) return null;

    const min = Math.min(
      ...dated.map((project) => new Date(project.startDate!).getTime()),
    );
    const max = Math.max(
      ...dated.map((project) => new Date(project.endDate!).getTime()),
    );

    return {
      projects: dated,
      min,
      max,
      span: Math.max(86_400_000, max - min),
    };
  }, [projects.data]);

  const taskTimeline = useMemo(() => {
    const tasks = (selectedProject.data?.tasks ?? []).filter(
      (task) => task.startDate && task.dueDate,
    );
    if (!tasks.length) return null;

    const min = Math.min(
      ...tasks.map((task) => new Date(task.startDate!).getTime()),
    );
    const max = Math.max(
      ...tasks.map((task) => new Date(task.dueDate!).getTime()),
    );

    return {
      tasks,
      min,
      max,
      span: Math.max(86_400_000, max - min),
    };
  }, [selectedProject.data]);

  const toCsvRows = (project: Project): ProjectCsvRow[] => {
    const tasks = project.tasks ?? [];
    const idMap = new Map(tasks.map((task, index) => [task.id, index + 1]));

    return tasks.map((task, index) => ({
      id: index + 1,
      name: task.title,
      start: task.startDate,
      finish: task.dueDate,
      durationDays: daysBetween(task.startDate, task.dueDate),
      percentComplete: Number(task.progress ?? 0),
      resourceNames: task.assignee
        ? `${task.assignee.firstName} ${task.assignee.lastName}`
        : '',
      predecessors:
        task.parentId && idMap.has(task.parentId)
          ? [idMap.get(task.parentId)!]
          : [],
      milestone: Boolean(
        task.startDate &&
          task.dueDate &&
          daysBetween(task.startDate, task.dueDate) === 0,
      ),
    }));
  };

  const exportCsv = () => {
    const project = selectedProject.data;
    if (!project) return;

    downloadMicrosoftProjectCsv(
      `${project.name.replace(/[^a-zA-Z0-9-_]+/g, '-')}-microsoft-project.csv`,
      toCsvRows(project),
    );
    setMessage('CSV compatible con Microsoft Project generado correctamente.');
  };

  const importCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProjectId) return;

    setImporting(true);
    setMessage('');

    try {
      const rows = parseMicrosoftProjectCsv(await file.text());
      const createdIds = new Map<number, string>();

      for (const row of rows) {
        const predecessorId = row.predecessors?.length
          ? createdIds.get(row.predecessors[0])
          : undefined;
        const descriptionParts = [
          row.resourceNames
            ? `Recursos de Microsoft Project: ${row.resourceNames}`
            : '',
          row.milestone ? 'Hito importado desde Microsoft Project.' : '',
        ].filter(Boolean);

        const created = await api<ProjectTask>(
          `/projects/${selectedProjectId}/tasks`,
          {
            method: 'POST',
            body: JSON.stringify({
              title: row.name,
              description: descriptionParts.join(' '),
              parentId: predecessorId,
              startDate: row.start,
              dueDate: row.finish ?? row.start,
              priority: row.milestone ? 1 : 2,
            }),
          },
        );

        createdIds.set(row.id, created.id);

        if (row.percentComplete > 0) {
          await api(`/projects/tasks/${created.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              progress: row.percentComplete,
              status:
                row.percentComplete >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
            }),
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['/projects'] });
      await queryClient.invalidateQueries({
        queryKey: ['/projects', selectedProjectId],
      });
      setMessage(`${rows.length} tareas importadas desde el CSV.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'No se pudo importar el CSV.',
      );
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const printTaskGantt = () => {
    const project = selectedProject.data;
    if (!project || !taskTimeline) return;

    const rows = taskTimeline.tasks
      .map((task) => {
        const start = new Date(task.startDate!).getTime();
        const end = new Date(task.dueDate!).getTime();
        const left = ((start - taskTimeline.min) / taskTimeline.span) * 100;
        const width = Math.max(
          2,
          ((end - start) / taskTimeline.span) * 100,
        );
        const late =
          task.status !== 'COMPLETED' && new Date(task.dueDate!) < new Date();

        return `<tr><td>${task.title}</td><td>${new Date(task.startDate!).toLocaleDateString('es-DO')}</td><td>${new Date(task.dueDate!).toLocaleDateString('es-DO')}</td><td>${task.progress}%</td><td><div style="position:relative;height:18px;background:#edf1f6;border-radius:5px"><span style="position:absolute;left:${left}%;width:${width}%;height:18px;border-radius:5px;background:${late ? '#c9344b' : '#1677df'}"></span></div></td></tr>`;
      })
      .join('');

    printDocument(
      `Cronograma ${project.name}`,
      `<header><div class="brand">Admin<span>Gest</span></div><div><h1>${project.name}</h1><p class="muted">Cronograma compatible con Microsoft Project</p></div></header><table><thead><tr><th>Tarea</th><th>Inicio</th><th>Fin</th><th>Avance</th><th>Gantt</th></tr></thead><tbody>${rows}</tbody></table>`,
    );
  };

  const renderViewSwitcher = () => (
    <div className="view-switcher" role="group" aria-label="Vista de proyectos">
      <button
        className={view === 'table' ? 'active' : ''}
        onClick={() => setView('table')}
        type="button"
      >
        <List size={17} /> Lista
      </button>
      <button
        className={view === 'timeline' ? 'active' : ''}
        onClick={() => setView('timeline')}
        type="button"
      >
        <CalendarRange size={17} /> Cronograma
      </button>
      <button
        className={view === 'interop' ? 'active' : ''}
        onClick={() => setView('interop')}
        type="button"
      >
        <Milestone size={17} /> MS Project
      </button>
    </div>
  );

  const entityPage = (
    <EntityPage
      headerActions={renderViewSwitcher()}
      columns={[
        {
          label: 'Proyecto',
          exportValue: (item) => String(item.name),
          render: (item) => (
            <span className="primary-cell">
              <strong>{String(item.name)}</strong>
              <small>{String((item.customer as Entity)?.name ?? '—')}</small>
            </span>
          ),
        },
        {
          label: 'Estado',
          exportValue: (item) => String(item.status),
          render: (item) => (
            <span className="status-badge blue">{String(item.status)}</span>
          ),
        },
        {
          label: 'Progreso',
          exportValue: (item) => Number(item.progress ?? 0),
          render: (item) => (
            <span className="progress-cell">
              <span>
                <i style={{ width: `${Number(item.progress)}%` }} />
              </span>
              <small>{Number(item.progress)}%</small>
            </span>
          ),
        },
        {
          label: 'Presupuesto',
          exportValue: (item) => Number(item.budget ?? 0),
          render: (item) => money.format(Number(item.budget ?? 0)),
        },
        {
          label: 'Tareas',
          exportValue: (item) => Number((item._count as Entity)?.tasks ?? 0),
          render: (item) => String((item._count as Entity)?.tasks ?? 0),
        },
      ]}
      description={
        view === 'table'
          ? 'Controla alcance, cronograma, presupuesto, tareas y avance.'
          : view === 'timeline'
            ? 'Compara fechas, duración y avance de los proyectos activos en una sola vista.'
            : 'Importa y exporta cronogramas mediante CSV sin depender del formato propietario MPP.'
      }
      endpoint="/projects"
      fields={projectFields}
      singular="proyecto"
      title={
        view === 'table'
          ? 'Proyectos'
          : view === 'timeline'
            ? 'Cronograma de proyectos'
            : 'Microsoft Project'
      }
    />
  );

  if (view === 'table') return entityPage;

  return (
    <>
      <div className="entity-page-controller-only">{entityPage}</div>

      {view === 'timeline' ? (
        <section className="page timeline-page custom-view-content">
          {projects.isLoading ? (
            <div className="board-skeleton">Cargando cronograma…</div>
          ) : !timeline ? (
            <div className="empty-state panel">
              <strong>No hay proyectos con fechas completas.</strong>
              <p>Asigna inicio y finalización para mostrarlos en el cronograma.</p>
            </div>
          ) : (
            <div className="timeline-card">
              <div className="timeline-scale">
                <span>{new Date(timeline.min).toLocaleDateString('es-DO')}</span>
                <span>
                  {new Date((timeline.min + timeline.max) / 2).toLocaleDateString(
                    'es-DO',
                  )}
                </span>
                <span>{new Date(timeline.max).toLocaleDateString('es-DO')}</span>
              </div>

              <div className="timeline-list">
                {timeline.projects.map((project) => {
                  const start = new Date(project.startDate!).getTime();
                  const end = new Date(project.endDate!).getTime();
                  const left = ((start - timeline.min) / timeline.span) * 100;
                  const width = Math.max(
                    4,
                    ((end - start) / timeline.span) * 100,
                  );

                  return (
                    <article className="timeline-row" key={project.id}>
                      <div className="timeline-project">
                        <strong>{project.name}</strong>
                        <small>
                          {project.customer.name} · {project.status}
                        </small>
                      </div>
                      <div className="timeline-track">
                        <div
                          className="timeline-bar"
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          <i style={{ width: `${project.progress}%` }} />
                          <span>{project.progress}%</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="page ms-project-page custom-view-content">
          <div className="ms-project-toolbar panel">
            <label className="form-field">
              <span>Proyecto</span>
              <select
                onChange={(event) => setSelectedProjectId(event.target.value)}
                value={selectedProjectId}
              >
                <option value="">Selecciona un proyecto</option>
                {(projects.data ?? []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="ms-project-actions">
              <label
                className={
                  selectedProjectId && !importing
                    ? 'secondary-button file-button'
                    : 'secondary-button file-button disabled'
                }
              >
                <FileUp size={17} />
                {importing ? 'Importando…' : 'Importar CSV'}
                <input
                  accept=".csv,text/csv"
                  disabled={!selectedProjectId || importing}
                  onChange={(event) => void importCsv(event)}
                  type="file"
                />
              </label>
              <button
                className="secondary-button"
                disabled={!selectedProject.data?.tasks?.length}
                onClick={exportCsv}
                type="button"
              >
                <Download size={17} /> Exportar CSV
              </button>
              <button
                className="secondary-button"
                disabled={!taskTimeline}
                onClick={printTaskGantt}
                type="button"
              >
                <Printer size={17} /> Imprimir Gantt
              </button>
            </div>
          </div>

          {message && <div className="alert">{message}</div>}

          {!selectedProjectId ? (
            <div className="empty-state panel">
              <strong>Selecciona un proyecto.</strong>
              <p>
                Después podrás importar tareas desde Microsoft Project o exportarlas.
              </p>
            </div>
          ) : selectedProject.isLoading ? (
            <div className="board-skeleton">Cargando tareas…</div>
          ) : !taskTimeline ? (
            <div className="empty-state panel">
              <strong>No hay tareas con fechas completas.</strong>
              <p>Importa un CSV o registra inicio y fin en las tareas.</p>
            </div>
          ) : (
            <div className="timeline-card task-gantt">
              <div className="timeline-scale">
                <span>
                  {new Date(taskTimeline.min).toLocaleDateString('es-DO')}
                </span>
                <span>
                  {new Date(
                    (taskTimeline.min + taskTimeline.max) / 2,
                  ).toLocaleDateString('es-DO')}
                </span>
                <span>
                  {new Date(taskTimeline.max).toLocaleDateString('es-DO')}
                </span>
              </div>

              <div className="timeline-list">
                {taskTimeline.tasks.map((task) => {
                  const start = new Date(task.startDate!).getTime();
                  const end = new Date(task.dueDate!).getTime();
                  const left =
                    ((start - taskTimeline.min) / taskTimeline.span) * 100;
                  const width = Math.max(
                    2,
                    ((end - start) / taskTimeline.span) * 100,
                  );
                  const late =
                    task.status !== 'COMPLETED' &&
                    new Date(task.dueDate!) < new Date();
                  const milestone = start === end;

                  return (
                    <article
                      className={late ? 'timeline-row task-late' : 'timeline-row'}
                      key={task.id}
                    >
                      <div className="timeline-project">
                        <strong>
                          {milestone && <Milestone size={14} />} {task.title}
                        </strong>
                        <small>
                          {task.status} · {task.progress}%
                          {late ? ' · Atrasada' : ''}
                        </small>
                      </div>
                      <div className="timeline-track">
                        <div
                          className={
                            milestone
                              ? 'timeline-bar timeline-milestone'
                              : 'timeline-bar'
                          }
                          style={{ left: `${left}%`, width: `${width}%` }}
                        >
                          <i style={{ width: `${task.progress}%` }} />
                          <span>{milestone ? '◆' : `${task.progress}%`}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
