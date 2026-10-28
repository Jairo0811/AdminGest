import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Rule { eventType: string; enabled: boolean; }
interface Template { id: string; name: string; description?: string; steps: string[]; }
interface Project { id: string; name: string; }

const eventLabels: Record<string, string> = {
  ACTIVITY_ASSIGNED: 'Actividad asignada',
  PROJECT_ASSIGNED: 'Proyecto asignado',
  ACTIVITY_DUE: 'Actividad próxima a vencer',
  QUOTE_EXPIRING: 'Cotización próxima a vencer',
};

export function WorkflowsPage() {
  const { user } = useAuth();
  const admin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const client = useQueryClient();
  const [notice, setNotice] = useState('');
  const rules = useQuery({
    queryKey: ['/workflows/rules'],
    queryFn: () => api<Rule[]>('/workflows/rules'),
  });
  const templates = useQuery({
    queryKey: ['/workflows/templates'],
    queryFn: () => api<Template[]>('/workflows/templates'),
  });
  const projects = useQuery({
    queryKey: ['/projects'],
    queryFn: () => api<Project[]>('/projects'),
  });

  const changeRule = useMutation({
    mutationFn: (rule: Rule) => api('/workflows/rules/' + rule.eventType, {
      method: 'PATCH', body: JSON.stringify({ enabled: !rule.enabled }),
    }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['/workflows/rules'] }); },
    onError: (error: Error) => setNotice(error.message),
  });
  const create = useMutation({
    mutationFn: (payload: { name: string; description: string; steps: string[] }) => api('/workflows/templates', {
      method: 'POST', body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      setNotice('Plantilla registrada.');
      void client.invalidateQueries({ queryKey: ['/workflows/templates'] });
    },
    onError: (error: Error) => setNotice(error.message),
  });
  const apply = useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) => api(
      '/workflows/templates/' + id + '/apply/' + projectId, { method: 'POST' },
    ),
    onSuccess: () => setNotice('Tareas creadas en el proyecto.'),
    onError: (error: Error) => setNotice(error.message),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const steps = String(data.get('steps')).split('\n').map(s => s.trim()).filter(Boolean);
    create.mutate({
      name: String(data.get('name')).trim(),
      description: String(data.get('description') ?? '').trim(),
      steps,
    }, { onSuccess: () => form.reset() });
  };

  return (
    <section className="page">
      <div className="page-heading">
        <div><p className="eyebrow">Automatización</p><h1>Flujos y plantillas</h1>
          <p>Configura los avisos automáticos y reutiliza tareas de proyecto.</p></div>
      </div>
      {notice && <p className="alert" role="status">{notice}</p>}
      <div className="panel">
        <h2><Settings2 size={20} /> Reglas de notificaciones</h2>
        {rules.data?.map(rule => (
          <label key={rule.eventType} style={{ display: 'block', padding: '8px 0' }}>
            <input type="checkbox" checked={rule.enabled} disabled={!admin || changeRule.isPending}
              onChange={() => changeRule.mutate(rule)} />{' '}
            {eventLabels[rule.eventType] ?? rule.eventType}
          </label>
        ))}
      </div>
      <form className="panel settings-form" onSubmit={submit}>
        <h2>Nueva plantilla de proyecto</h2>
        <label className="form-field"><span>Nombre</span><input name="name" maxLength={120} required /></label>
        <label className="form-field"><span>Descripción</span><input name="description" maxLength={500} /></label>
        <label className="form-field"><span>Tareas (una por línea; máximo 20)</span>
          <textarea name="steps" rows={5} required placeholder={'Levantamiento de requisitos\nDiseño\nPruebas'} />
        </label>
        <button type="submit" className="primary-button" disabled={create.isPending}>Crear plantilla</button>
      </form>
      <div className="panel">
        <h2>Plantillas disponibles</h2>
        {templates.data?.length === 0 && <p>No hay plantillas todavía.</p>}
        {templates.data?.map(item => (
          <form key={item.id} onSubmit={event => {
            event.preventDefault();
            const id = String(new FormData(event.currentTarget).get('projectId'));
            if (id) apply.mutate({ id: item.id, projectId: id });
          }}>
            <h3>{item.name}</h3><p>{item.description}</p>
            <p>{item.steps.join(' · ')}</p>
            <label className="form-field"><span>Aplicar al proyecto</span>
              <select name="projectId" required defaultValue="">
                <option value="">Selecciona un proyecto</option>
                {projects.data?.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <button type="submit" className="primary-button" disabled={apply.isPending}>Crear tareas</button>
          </form>
        ))}
      </div>
    </section>
  );
}
