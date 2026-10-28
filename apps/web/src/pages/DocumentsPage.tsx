import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/permissions';

interface DocumentRecord {
  id: string;
  title: string;
  category: string;
  url: string;
  createdAt: string;
}
interface Project { id: string; name: string; }
interface Customer { id: string; name: string; }

export function DocumentsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [message, setMessage] = useState('');
  const canWrite = hasPermission(user?.role, 'documents', 'write');
  const records = useQuery({
    queryKey: ['/documents'],
    queryFn: () => api<DocumentRecord[]>('/documents'),
  });
  const projects = useQuery({
    queryKey: ['/projects'],
    queryFn: () => api<Project[]>('/projects'),
    enabled: canWrite,
  });
  const customers = useQuery({
    queryKey: ['/customers'],
    queryFn: () => api<Customer[]>('/customers'),
    enabled: canWrite,
  });

  const create = useMutation({
    mutationFn: (values: Record<string, string>) => api('/documents', {
      method: 'POST', body: JSON.stringify(values),
    }),
    onSuccess: () => {
      setMessage('Referencia documental registrada.');
      void client.invalidateQueries({ queryKey: ['/documents'] });
    },
    onError: (error: Error) => setMessage(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api('/documents/' + id, { method: 'DELETE' }),
    onSuccess: () => { void client.invalidateQueries({ queryKey: ['/documents'] }); },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(
      [...new FormData(form).entries()].filter(([, value]) => String(value).trim() !== ''),
    ) as Record<string, string>;
    create.mutate(payload, { onSuccess: () => form.reset() });
  };

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Gestión documental</p>
          <h1>Documentos</h1>
          <p>Referencias a archivos alojados en tu repositorio externo autorizado.</p>
        </div>
      </div>
      {message && <p className="alert" role="status">{message}</p>}
      {canWrite && (
        <form className="panel settings-form" onSubmit={submit}>
          <h2><Plus size={20} /> Registrar documento externo</h2>
          <p>Los archivos permanecen en tu proveedor documental. AdminGest guarda únicamente el enlace.</p>
          <div className="form-grid">
            <label className="form-field"><span>Título</span><input name="title" maxLength={150} required /></label>
            <label className="form-field"><span>Categoría</span>
              <select name="category" defaultValue="OTHER">
                <option value="CONTRACT">Contrato</option>
                <option value="PROPOSAL">Propuesta</option>
                <option value="DELIVERABLE">Entregable</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            <label className="form-field full"><span>URL HTTPS</span><input name="url" type="url" pattern="https://.*" placeholder="https://..." required /></label>
            <label className="form-field"><span>Proyecto (opcional)</span>
              <select name="projectId" defaultValue=""><option value="">Sin proyecto</option>
                {projects.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="form-field"><span>Cliente (opcional)</span>
              <select name="customerId" defaultValue=""><option value="">Sin cliente</option>
                {customers.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
          <button type="submit" className="primary-button" disabled={create.isPending}>Registrar referencia</button>
        </form>
      )}
      <div className="panel">
        <h2><FileText size={20} /> Archivos registrados</h2>
        {records.error && <p role="alert">{(records.error as Error).message}</p>}
        {records.data?.length === 0 && <p>No hay documentos registrados.</p>}
        <ul>
          {records.data?.map(item => (
            <li key={item.id} style={{ padding: '12px 0' }}>
              <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>{' '}
              <small>{item.category} · {new Date(item.createdAt).toLocaleDateString('es-DO')}</small>{' '}
              {canWrite && <button type="button" className="text-button" aria-label={'Eliminar ' + item.title}
                onClick={() => remove.mutate(item.id)} disabled={remove.isPending}>
                <Trash2 size={15} />
              </button>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
