import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Clock, Mail, Phone, Plus, Users } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { api, formatDate } from '../lib/api';
import { Paginated } from '../types';

interface Activity {
  id: string;
  type: string;
  status: string;
  subject: string;
  description?: string;
  scheduledAt: string;
  customer?: { id: string; name: string };
}

const activityIcons = { CALL: Phone, EMAIL: Mail, MEETING: Users, VISIT: Users, TASK: Check, FOLLOW_UP: Clock };

export function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const activities = useQuery({
    queryKey: ['activities'],
    queryFn: () => api<Paginated<Activity>>('/activities?pageSize=100'),
  });
  const customers = useQuery({
    queryKey: ['customer-options'],
    queryFn: () => api<Paginated<{ id: string; name: string }>>('/customers?pageSize=100&status=ACTIVE'),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['activities'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/activities', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setShowForm(false);
      refresh();
    },
    onError: (reason: Error) => setError(reason.message),
  });
  const complete = useMutation({
    mutationFn: (id: string) =>
      api(`/activities/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) }),
    onSuccess: refresh,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    create.mutate({
      type: values.type,
      subject: values.subject,
      description: values.description || undefined,
      customerId: values.customerId || undefined,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
    });
  }

  return (
    <div className="page-stack">
      <section className="page-toolbar">
        <div className="toolbar-summary"><CalendarDays size={20} /><span>{activities.data?.meta.total ?? 0} actividades registradas</span></div>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}><Plus size={18} /> Nueva actividad</button>
      </section>
      <article className="panel">
        {activities.isPending ? <div className="table-state">Cargando agenda…</div> : activities.isError ? (
          <div className="table-state error-text">{activities.error.message}</div>
        ) : activities.data.data.length === 0 ? (
          <div className="empty-state"><h3>Tu agenda está libre</h3><p>Programa llamadas, reuniones y seguimientos comerciales.</p></div>
        ) : (
          <div className="timeline-list">
            {activities.data.data.map((activity) => {
              const Icon = activityIcons[activity.type as keyof typeof activityIcons] ?? CalendarDays;
              return (
                <article className="timeline-item" key={activity.id}>
                  <div className="timeline-icon"><Icon size={18} /></div>
                  <div className="timeline-content">
                    <div><strong>{activity.subject}</strong><StatusBadge status={activity.status} /></div>
                    <p>{activity.customer?.name ?? activity.type.replaceAll('_', ' ')}</p>
                    <span>{formatDate(activity.scheduledAt)}</span>
                  </div>
                  {activity.status === 'PENDING' && (
                    <button className="secondary-button compact" type="button" onClick={() => complete.mutate(activity.id)}>
                      <Check size={16} /> Completar
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </article>
      {showForm && (
        <Modal title="Nueva actividad" onClose={() => setShowForm(false)}>
          <form className="form-grid modal-form" onSubmit={submit}>
            <label className="field"><span>Tipo *</span>
              <select name="type" required defaultValue="MEETING">
                <option value="CALL">Llamada</option><option value="EMAIL">Correo</option>
                <option value="MEETING">Reunión</option><option value="VISIT">Visita</option>
                <option value="TASK">Tarea</option><option value="FOLLOW_UP">Seguimiento</option>
              </select>
            </label>
            <label className="field"><span>Fecha y hora *</span><input name="scheduledAt" type="datetime-local" required /></label>
            <label className="field field-full"><span>Asunto *</span><input name="subject" required minLength={2} /></label>
            <label className="field field-full"><span>Cliente</span>
              <select name="customerId" defaultValue=""><option value="">Sin cliente asociado</option>
                {customers.data?.data.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="field field-full"><span>Descripción</span><textarea name="description" rows={3} /></label>
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full">
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" disabled={create.isPending} type="submit">{create.isPending ? 'Guardando…' : 'Programar actividad'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
