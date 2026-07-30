import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, CircleDollarSign, Plus, UserRound } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { api, formatCurrency } from '../lib/api';
import { Paginated } from '../types';

interface ProjectTask {
  id: string;
  title: string;
  status: string;
  progress: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  budget?: string | number;
  customer: { id: string; name: string };
  manager?: { firstName: string; lastName: string };
  tasks: ProjectTask[];
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const projects = useQuery({
    queryKey: ['projects'],
    queryFn: () => api<Paginated<Project>>('/projects?pageSize=100'),
  });
  const customers = useQuery({
    queryKey: ['customer-options'],
    queryFn: () => api<Paginated<{ id: string; name: string }>>('/customers?pageSize=100&status=ACTIVE'),
  });
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/projects', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setShowForm(false);
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (reason: Error) => setError(reason.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    create.mutate({
      customerId: values.customerId,
      name: values.name,
      description: values.description || undefined,
      budget: values.budget ? Number(values.budget) : undefined,
      startDate: values.startDate ? new Date(`${values.startDate}T12:00:00`).toISOString() : undefined,
      endDate: values.endDate ? new Date(`${values.endDate}T12:00:00`).toISOString() : undefined,
    });
  }

  return (
    <div className="page-stack">
      <section className="page-toolbar">
        <div className="toolbar-summary"><FolderSummary count={projects.data?.meta.total ?? 0} /></div>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nuevo proyecto
        </button>
      </section>
      {projects.isPending ? <div className="loading-card">Cargando proyectos…</div> : projects.isError ? (
        <div className="error-card">{projects.error.message}</div>
      ) : projects.data.data.length === 0 ? (
        <div className="empty-state panel"><h3>No hay proyectos activos</h3><p>Crea el primer proyecto para planificar sus tareas, fechas y presupuesto.</p></div>
      ) : (
        <section className="project-grid">
          {projects.data.data.map((project) => {
            const completed = project.tasks.filter((task) => task.status === 'COMPLETED').length;
            return (
              <article className="project-card" key={project.id}>
                <div className="project-card-header">
                  <div><p>{project.customer.name}</p><h2>{project.name}</h2></div>
                  <StatusBadge status={project.status} />
                </div>
                <p className="project-description">{project.description ?? 'Sin descripción registrada.'}</p>
                <div className="project-progress-head"><span>Progreso</span><strong>{project.progress}%</strong></div>
                <div className="progress-track"><span style={{ width: `${project.progress}%` }} /></div>
                <div className="project-meta">
                  <span><CheckCircle2 size={16} /> {completed}/{project.tasks.length} tareas</span>
                  <span><CircleDollarSign size={16} /> {project.budget ? formatCurrency(project.budget) : 'Sin presupuesto'}</span>
                  <span><UserRound size={16} /> {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'Sin responsable'}</span>
                  <span><CalendarDays size={16} /> {project.endDate ? new Date(project.endDate).toLocaleDateString('es-DO') : 'Sin fecha final'}</span>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {showForm && (
        <Modal title="Nuevo proyecto" onClose={() => setShowForm(false)}>
          <form className="form-grid modal-form" onSubmit={submit}>
            <label className="field field-full"><span>Nombre *</span><input name="name" required minLength={2} /></label>
            <label className="field field-full"><span>Cliente *</span>
              <select name="customerId" required defaultValue="">
                <option value="" disabled>Seleccionar cliente</option>
                {customers.data?.data.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="field"><span>Inicio</span><input name="startDate" type="date" /></label>
            <label className="field"><span>Final estimado</span><input name="endDate" type="date" /></label>
            <label className="field field-full"><span>Presupuesto</span><input name="budget" type="number" min="0" step="0.01" /></label>
            <label className="field field-full"><span>Descripción</span><textarea name="description" rows={3} /></label>
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full">
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" disabled={create.isPending} type="submit">{create.isPending ? 'Guardando…' : 'Crear proyecto'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function FolderSummary({ count }: { count: number }) {
  return <><strong>{count}</strong><span>proyectos en tu cartera</span></>;
}
