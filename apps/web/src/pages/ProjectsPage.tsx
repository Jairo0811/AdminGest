import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange, List } from 'lucide-react';
import { api } from '../api/client';
import { Entity, EntityPage } from '../components/EntityPage';

const money = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  maximumFractionDigits: 0,
});

interface Project extends Entity {
  name: string;
  status: string;
  progress: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  customer: { name: string };
  _count?: { tasks: number };
}

export function ProjectsPage() {
  const [view, setView] = useState<'table' | 'timeline'>('table');
  const projects = useQuery({
    queryKey: ['/projects'],
    queryFn: () => api<Project[]>('/projects'),
  });

  const timeline = useMemo(() => {
    const dated = (projects.data ?? []).filter((project) => project.startDate && project.endDate);
    if (!dated.length) return null;
    const min = Math.min(...dated.map((project) => new Date(project.startDate!).getTime()));
    const max = Math.max(...dated.map((project) => new Date(project.endDate!).getTime()));
    const span = Math.max(86_400_000, max - min);
    return { projects: dated, min, max, span };
  }, [projects.data]);

  return (
    <>
      <div className="view-switcher-wrap">
        <div className="view-switcher" role="group" aria-label="Vista de proyectos">
          <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')} type="button">
            <List size={17} /> Lista
          </button>
          <button className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')} type="button">
            <CalendarRange size={17} /> Cronograma
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <EntityPage
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
              render: (item) => <span className="status-badge blue">{String(item.status)}</span>,
            },
            {
              label: 'Progreso',
              exportValue: (item) => Number(item.progress ?? 0),
              render: (item) => (
                <span className="progress-cell">
                  <span><i style={{ width: `${Number(item.progress)}%` }} /></span>
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
          description="Controla alcance, cronograma, presupuesto, tareas y avance."
          endpoint="/projects"
          fields={[
            { name: 'name', label: 'Nombre', required: true },
            {
              name: 'customerId',
              label: 'Cliente',
              type: 'select',
              required: true,
              optionsEndpoint: '/customers',
              optionLabel: (item) => String(item.name),
            },
            { name: 'startDate', label: 'Inicio', type: 'date' },
            { name: 'endDate', label: 'Finalización', type: 'date' },
            { name: 'budget', label: 'Presupuesto', type: 'number' },
            {
              name: 'status',
              label: 'Estado',
              type: 'select',
              options: [
                { value: 'PLANNED', label: 'Planificado' },
                { value: 'ACTIVE', label: 'Activo' },
                { value: 'ON_HOLD', label: 'En pausa' },
                { value: 'COMPLETED', label: 'Completado' },
                { value: 'CANCELLED', label: 'Cancelado' },
              ],
            },
            { name: 'progress', label: 'Progreso (%)', type: 'number' },
            { name: 'description', label: 'Descripción', type: 'textarea' },
          ]}
          singular="proyecto"
          title="Proyectos"
        />
      ) : (
        <section className="page timeline-page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Planificación ejecutiva</p>
              <h1>Cronograma de proyectos</h1>
              <p>Compara fechas, duración y avance de los proyectos activos en una sola vista.</p>
            </div>
          </div>

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
                <span>{new Date((timeline.min + timeline.max) / 2).toLocaleDateString('es-DO')}</span>
                <span>{new Date(timeline.max).toLocaleDateString('es-DO')}</span>
              </div>
              <div className="timeline-list">
                {timeline.projects.map((project) => {
                  const start = new Date(project.startDate!).getTime();
                  const end = new Date(project.endDate!).getTime();
                  const left = ((start - timeline.min) / timeline.span) * 100;
                  const width = Math.max(4, ((end - start) / timeline.span) * 100);
                  return (
                    <article className="timeline-row" key={project.id}>
                      <div className="timeline-project">
                        <strong>{project.name}</strong>
                        <small>{project.customer.name} · {project.status}</small>
                      </div>
                      <div className="timeline-track">
                        <div className="timeline-bar" style={{ left: `${left}%`, width: `${width}%` }}>
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
      )}
    </>
  );
}
