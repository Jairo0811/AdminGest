import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Plus, Search, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../lib/api';
import { Paginated } from '../types';

interface Lead {
  id: string;
  firstName: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  priority: number;
  owner?: { firstName: string; lastName: string };
}

const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'CONVERTED'];

export function LeadsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const leads = useQuery({
    queryKey: ['leads', search],
    queryFn: () => api<Paginated<Lead>>(`/leads?search=${encodeURIComponent(search)}`),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['leads'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<Lead>('/leads', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setShowForm(false);
      refresh();
    },
    onError: (reason: Error) => setError(reason.message),
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/leads/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: refresh,
  });
  const convert = useMutation({
    mutationFn: (id: string) => api(`/leads/${id}/convert`, { method: 'POST' }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/leads/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    create.mutate({
      ...values,
      priority: Number(values.priority),
      email: values.email || undefined,
      phone: values.phone || undefined,
      companyName: values.companyName || undefined,
      source: values.source || undefined,
      notes: values.notes || undefined,
    });
  }

  return (
    <div className="page-stack">
      <section className="page-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, empresa o correo…"
          />
        </label>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nuevo prospecto
        </button>
      </section>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">CRM</p>
            <h2>{leads.data?.meta.total ?? 0} prospectos registrados</h2>
          </div>
        </div>
        {leads.isPending ? (
          <div className="table-state">Cargando prospectos…</div>
        ) : leads.isError ? (
          <div className="table-state error-text">{leads.error.message}</div>
        ) : leads.data.data.length === 0 ? (
          <div className="empty-state">
            <h3>Aún no hay prospectos</h3>
            <p>Registra el primer contacto comercial para comenzar tu pipeline.</p>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Contacto</th><th>Empresa</th><th>Origen</th><th>Estado</th><th>Prioridad</th><th /></tr>
              </thead>
              <tbody>
                {leads.data.data.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.firstName} {lead.lastName}</strong>
                      <small>{lead.email ?? lead.phone ?? 'Sin datos de contacto'}</small>
                    </td>
                    <td>{lead.companyName ?? '—'}</td>
                    <td>{lead.source ?? 'No indicado'}</td>
                    <td>
                      <select
                        className="inline-select"
                        value={lead.status}
                        onChange={(event) => statusMutation.mutate({ id: lead.id, status: event.target.value })}
                      >
                        {statuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                      </select>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td><span className={`priority priority-${lead.priority}`}>{['', 'Baja', 'Media', 'Alta'][lead.priority]}</span></td>
                    <td className="row-actions">
                      {lead.status !== 'CONVERTED' && lead.status !== 'DISQUALIFIED' && (
                        <button
                          className="icon-button subtle"
                          title="Convertir en cliente"
                          type="button"
                          onClick={() => convert.mutate(lead.id)}
                        >
                          <ArrowRight size={18} />
                        </button>
                      )}
                      <button
                        className="icon-button subtle danger"
                        title="Eliminar"
                        type="button"
                        onClick={() => {
                          if (window.confirm('¿Eliminar este prospecto?')) remove.mutate(lead.id);
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      {showForm && (
        <Modal title="Nuevo prospecto" onClose={() => setShowForm(false)}>
          <form className="form-grid modal-form" onSubmit={submit}>
            <label className="field"><span>Nombre *</span><input name="firstName" required minLength={2} /></label>
            <label className="field"><span>Apellido</span><input name="lastName" /></label>
            <label className="field field-full"><span>Empresa</span><input name="companyName" /></label>
            <label className="field"><span>Correo</span><input name="email" type="email" /></label>
            <label className="field"><span>Teléfono</span><input name="phone" /></label>
            <label className="field"><span>Origen</span>
              <select name="source">
                <option value="">Seleccionar</option>
                <option>Referido</option><option>Sitio web</option><option>Redes sociales</option>
                <option>Evento</option><option>Llamada</option><option>Otro</option>
              </select>
            </label>
            <label className="field"><span>Prioridad</span>
              <select name="priority" defaultValue="2"><option value="1">Baja</option><option value="2">Media</option><option value="3">Alta</option></select>
            </label>
            <label className="field field-full"><span>Notas</span><textarea name="notes" rows={3} /></label>
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full">
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" disabled={create.isPending} type="submit">
                {create.isPending ? 'Guardando…' : 'Guardar prospecto'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
