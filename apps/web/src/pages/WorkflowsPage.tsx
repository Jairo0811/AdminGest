import { FormEvent, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListChecks, Plus, RefreshCw, Settings2, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Modal } from '../components/Modal';

interface Rule {
  eventType: string;
  enabled: boolean;
}
interface Template {
  id: string;
  name: string;
  description?: string | null;
  steps: string[];
}
interface Project {
  id: string;
  name: string;
}
interface ApplyResult {
  created: number;
  skipped: number;
}

const MAX_STEPS = 20;

const EVENT_LABELS: Record<string, { label: string; description: string }> = {
  ACTIVITY_ASSIGNED: { label: 'Actividad asignada', description: 'Avisa al responsable cuando se le asigna o reasigna una actividad.' },
  PROJECT_ASSIGNED: { label: 'Proyecto asignado', description: 'Avisa al gerente cuando se le asigna un proyecto.' },
  ACTIVITY_DUE: { label: 'Actividad próxima a vencer', description: 'Recordatorio 24 horas antes de una actividad pendiente.' },
  QUOTE_EXPIRING: { label: 'Cotización próxima a vencer', description: 'Avisa a los administradores 24 horas antes del vencimiento.' },
};

export function WorkflowsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const client = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState('');
  const [pendingApply, setPendingApply] = useState<{ template: Template; project: Project } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);

  const rules = useQuery({ queryKey: ['/workflows/rules'], queryFn: () => api<Rule[]>('/workflows/rules') });
  const templates = useQuery({
    queryKey: ['/workflows/templates'],
    queryFn: () => api<Template[]>('/workflows/templates'),
  });
  const projects = useQuery({ queryKey: ['/projects'], queryFn: () => api<Project[]>('/projects') });

  const changeRule = useMutation({
    mutationFn: (rule: Rule) =>
      api('/workflows/rules/' + rule.eventType, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !rule.enabled }),
      }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['/workflows/rules'] }),
  });
  const create = useMutation({
    mutationFn: (payload: { name: string; description?: string; steps: string[] }) =>
      api('/workflows/templates', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      setNotice('Plantilla registrada.');
      formRef.current?.reset();
      void client.invalidateQueries({ queryKey: ['/workflows/templates'] });
    },
  });
  const apply = useMutation({
    mutationFn: ({ templateId, projectId }: { templateId: string; projectId: string }) =>
      api<ApplyResult>(`/workflows/templates/${templateId}/apply/${projectId}`, { method: 'POST' }),
    onSuccess: (result, { projectId }) => {
      setPendingApply(null);
      setNotice(
        result.created
          ? `Se crearon ${result.created} tareas${result.skipped ? ` y se omitieron ${result.skipped} que el proyecto ya tenía` : ''}.`
          : 'El proyecto ya tenía todas las tareas de la plantilla; no se creó ninguna.',
      );
      void client.invalidateQueries({ queryKey: ['/projects'] });
      void client.invalidateQueries({ queryKey: ['/projects', projectId] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/workflows/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setPendingDelete(null);
      setNotice('Plantilla eliminada. Las tareas ya creadas en proyectos se conservan.');
      void client.invalidateQueries({ queryKey: ['/workflows/templates'] });
    },
  });

  const [formError, setFormError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (create.isPending) return;
    const data = new FormData(event.currentTarget);
    const steps = String(data.get('steps') ?? '')
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean);
    if (!steps.length || steps.length > MAX_STEPS) {
      setFormError(`La plantilla debe tener entre 1 y ${MAX_STEPS} tareas.`);
      return;
    }
    setFormError('');
    setNotice('');
    const description = String(data.get('description') ?? '').trim();
    create.mutate({ name: String(data.get('name')).trim(), ...(description ? { description } : {}), steps });
  };

  const mutationError = (changeRule.error ?? null) as Error | null;

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Automatización</p>
          <h1>Flujos y plantillas</h1>
          <p>Configura los avisos automáticos y reutiliza listas de tareas en tus proyectos.</p>
        </div>
      </div>

      {notice && (
        <div className="alert success" role="status">
          {notice}
        </div>
      )}

      <div className="module-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <ListChecks aria-hidden="true" size={19} /> Plantillas de proyecto
              </h2>
              <p>Al aplicarlas se crean solo las tareas que el proyecto todavía no tiene.</p>
            </div>
          </div>

          {templates.isLoading && <p className="muted-state" role="status">Cargando plantillas…</p>}
          {templates.isError && (
            <div className="empty-state empty-state--error" role="alert">
              <strong>No fue posible cargar las plantillas</strong>
              <button className="secondary-button" onClick={() => void templates.refetch()} type="button">
                <RefreshCw aria-hidden="true" size={16} /> Reintentar
              </button>
            </div>
          )}
          {templates.data?.length === 0 && (
            <div className="empty-state">
              <strong>No hay plantillas todavía</strong>
              <p>Crea una con las tareas que repites en cada proyecto.</p>
            </div>
          )}

          {templates.data?.map((template) => (
            <article className="template-card" key={template.id}>
              <div className="panel-heading">
                <div>
                  <h3>{template.name}</h3>
                  {template.description && <p>{template.description}</p>}
                </div>
                <button
                  aria-label={`Eliminar plantilla ${template.name}`}
                  className="secondary-button compact"
                  onClick={() => {
                    remove.reset();
                    setPendingDelete(template);
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} /> Eliminar
                </button>
              </div>
              <ol aria-label={`Tareas de ${template.name}`} className="template-steps">
                {template.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <form
                className="template-apply"
                onSubmit={(event) => {
                  event.preventDefault();
                  const projectId = String(new FormData(event.currentTarget).get('projectId') ?? '');
                  const project = projects.data?.find((item) => item.id === projectId);
                  if (project) {
                    apply.reset();
                    setPendingApply({ template, project });
                  }
                }}
              >
                <label className="form-field">
                  <span>Aplicar al proyecto</span>
                  <select defaultValue="" name="projectId" required>
                    <option value="">{projects.isError ? 'No fue posible cargar los proyectos' : 'Selecciona un proyecto'}</option>
                    {projects.data?.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="primary-button" disabled={!projects.data?.length} type="submit">
                  Crear tareas
                </button>
              </form>
            </article>
          ))}
        </div>

        <div>
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Settings2 aria-hidden="true" size={19} /> Reglas de notificación
                </h2>
                <p>{isAdmin ? 'Activa o desactiva cada aviso para toda la empresa.' : 'Solo un administrador puede modificar las reglas.'}</p>
              </div>
            </div>
            {rules.isLoading && <p className="muted-state" role="status">Cargando reglas…</p>}
            {rules.isError && <div className="alert error" role="alert">No fue posible cargar las reglas.</div>}
            {mutationError && <div className="alert error" role="alert">{mutationError.message}</div>}
            {rules.data?.map((rule) => {
              const meta = EVENT_LABELS[rule.eventType] ?? { label: rule.eventType, description: '' };
              const id = `rule-${rule.eventType}`;
              return (
                <div className="rule-row" key={rule.eventType}>
                  <div>
                    <label htmlFor={id}>
                      <strong>{meta.label}</strong>
                    </label>
                    <small id={`${id}-help`}>{meta.description}</small>
                  </div>
                  <span className="switch">
                    <input
                      aria-describedby={`${id}-help`}
                      checked={rule.enabled}
                      disabled={!isAdmin || changeRule.isPending}
                      id={id}
                      onChange={() => changeRule.mutate(rule)}
                      role="switch"
                      type="checkbox"
                    />
                    <span aria-hidden="true" />
                  </span>
                </div>
              );
            })}
          </div>

          <form className="panel" onSubmit={submit} ref={formRef} style={{ marginTop: '1.2rem' }}>
            <div className="panel-heading">
              <div>
                <h2>
                  <Plus aria-hidden="true" size={19} /> Nueva plantilla
                </h2>
                <p>Una tarea por línea, sin repetir nombres (máximo {MAX_STEPS}).</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="form-field full">
                <span>Nombre<span aria-hidden="true" className="required-mark"> *</span></span>
                <input maxLength={120} name="name" required />
              </label>
              <label className="form-field full">
                <span>Descripción</span>
                <input maxLength={500} name="description" />
              </label>
              <label className="form-field full">
                <span>Tareas<span aria-hidden="true" className="required-mark"> *</span></span>
                <textarea name="steps" placeholder={'Levantamiento de requisitos\nDiseño\nPruebas'} required rows={6} />
              </label>
            </div>
            {(formError || create.isError) && (
              <div className="alert error" role="alert">
                {formError || (create.error as Error).message}
              </div>
            )}
            <div className="form-actions">
              <button className="primary-button" disabled={create.isPending} type="submit">
                {create.isPending ? 'Guardando…' : 'Crear plantilla'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {pendingApply && (
        <Modal onClose={() => setPendingApply(null)} title="Aplicar plantilla">
          <div className="confirm-dialog">
            <p>
              Se agregarán al proyecto «{pendingApply.project.name}» las tareas de «{pendingApply.template.name}» que
              todavía no existan ({pendingApply.template.steps.length} en la plantilla). Las tareas con el mismo nombre
              se omiten, por lo que aplicarla de nuevo no crea duplicados.
            </p>
            {apply.isError && <div className="alert error" role="alert">{(apply.error as Error).message}</div>}
            <footer className="form-actions">
              <button className="secondary-button" onClick={() => setPendingApply(null)} type="button">
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={apply.isPending}
                onClick={() =>
                  apply.mutate({ templateId: pendingApply.template.id, projectId: pendingApply.project.id })
                }
                type="button"
              >
                {apply.isPending ? 'Aplicando…' : 'Crear tareas'}
              </button>
            </footer>
          </div>
        </Modal>
      )}

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)} title="Eliminar plantilla">
          <div className="confirm-dialog">
            <p>Se eliminará la plantilla «{pendingDelete.name}». Las tareas ya creadas en proyectos no se modifican.</p>
            {remove.isError && <div className="alert error" role="alert">{(remove.error as Error).message}</div>}
            <footer className="form-actions">
              <button className="secondary-button" onClick={() => setPendingDelete(null)} type="button">
                Cancelar
              </button>
              <button className="danger-button" disabled={remove.isPending} onClick={() => remove.mutate(pendingDelete.id)} type="button">
                {remove.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </footer>
          </div>
        </Modal>
      )}
    </section>
  );
}
