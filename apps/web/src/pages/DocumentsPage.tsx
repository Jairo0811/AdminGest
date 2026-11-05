import { FormEvent, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileText, Info, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/permissions';
import { Modal } from '../components/Modal';

interface DocumentRecord {
  id: string;
  title: string;
  category: string;
  url: string;
  projectId?: string | null;
  customerId?: string | null;
  createdAt: string;
}
interface NamedRecord {
  id: string;
  name: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACT: 'Contrato',
  PROPOSAL: 'Propuesta',
  DELIVERABLE: 'Entregable',
  OTHER: 'Otro',
};

/** Defensive check before rendering a link: only HTTPS URLs without credentials. */
function safeHttpsUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function DocumentsPage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<DocumentRecord | null>(null);
  const canWrite = hasPermission(user?.role, 'documents', 'write');

  const records = useQuery({
    queryKey: ['/documents'],
    queryFn: () => api<DocumentRecord[]>('/documents'),
  });
  const projects = useQuery({
    queryKey: ['/projects'],
    queryFn: () => api<NamedRecord[]>('/projects'),
    enabled: hasPermission(user?.role, 'projects'),
  });
  const customers = useQuery({
    queryKey: ['/customers'],
    queryFn: () => api<NamedRecord[]>('/customers'),
    enabled: hasPermission(user?.role, 'customers'),
  });
  const nameOf = (list: NamedRecord[] | undefined, id?: string | null) =>
    id ? list?.find((item) => item.id === id)?.name : undefined;

  const create = useMutation({
    mutationFn: (values: Record<string, string>) =>
      api('/documents', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => {
      setNotice('Referencia documental registrada.');
      formRef.current?.reset();
      void client.invalidateQueries({ queryKey: ['/documents'] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api('/documents/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      setPendingDelete(null);
      setNotice('Referencia eliminada. El archivo externo no se modifica.');
      void client.invalidateQueries({ queryKey: ['/documents'] });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (create.isPending) return;
    setNotice('');
    const payload = Object.fromEntries(
      [...new FormData(event.currentTarget).entries()]
        .map(([key, value]) => [key, String(value).trim()])
        .filter(([, value]) => value !== ''),
    ) as Record<string, string>;
    if (!safeHttpsUrl(payload.url ?? '')) {
      setFormError('Ingresa un enlace HTTPS válido y sin credenciales.');
      return;
    }
    setFormError('');
    create.mutate(payload);
  };

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Gestión documental</p>
          <h1>Documentos</h1>
          <p>Referencias a archivos alojados en el repositorio documental autorizado de tu empresa.</p>
        </div>
      </div>

      {notice && (
        <div className="alert success" role="status">
          {notice}
        </div>
      )}

      <div className={canWrite ? 'module-grid' : undefined}>
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <FileText aria-hidden="true" size={19} /> Documentos registrados
              </h2>
              <p>{records.data ? `${records.data.length} referencias` : ' '}</p>
            </div>
          </div>

          {records.isLoading && (
            <p className="muted-state" role="status">
              Cargando documentos…
            </p>
          )}
          {records.isError && (
            <div className="empty-state empty-state--error" role="alert">
              <strong>No fue posible cargar los documentos</strong>
              <p>{(records.error as Error).message}</p>
              <button className="secondary-button" onClick={() => void records.refetch()} type="button">
                <RefreshCw aria-hidden="true" size={16} /> Reintentar
              </button>
            </div>
          )}
          {records.data?.length === 0 && (
            <div className="empty-state">
              <strong>No hay documentos registrados</strong>
              <p>{canWrite ? 'Registra el enlace de un contrato, propuesta o entregable.' : 'Tu rol puede consultar documentos registrados por el equipo.'}</p>
            </div>
          )}

          <ul className="item-list">
            {records.data?.map((item) => {
              const url = safeHttpsUrl(item.url);
              const project = nameOf(projects.data, item.projectId);
              const customer = nameOf(customers.data, item.customerId);
              return (
                <li className="item-row" key={item.id}>
                  <span aria-hidden="true" className="item-row__icon">
                    <FileText size={17} />
                  </span>
                  <div className="item-row__body">
                    {url ? (
                      <a href={url.href} rel="noopener noreferrer" target="_blank">
                        {item.title} <ExternalLink aria-hidden="true" size={13} />
                        <span className="sr-only"> (se abre en una pestaña nueva)</span>
                      </a>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                    <small>
                      {CATEGORY_LABELS[item.category] ?? item.category} · {url?.hostname ?? 'Enlace no válido'} ·{' '}
                      {new Date(item.createdAt).toLocaleDateString('es-DO')}
                    </small>
                    {(project || customer) && (
                      <small>{[project && `Proyecto: ${project}`, customer && `Cliente: ${customer}`].filter(Boolean).join(' · ')}</small>
                    )}
                  </div>
                  {canWrite && (
                    <div className="item-row__actions">
                      <button
                        aria-label={`Eliminar referencia ${item.title}`}
                        className="secondary-button compact"
                        onClick={() => {
                          remove.reset();
                          setPendingDelete(item);
                        }}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} /> Eliminar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {canWrite && (
          <form className="panel" onSubmit={submit} ref={formRef}>
            <div className="panel-heading">
              <div>
                <h2>
                  <Plus aria-hidden="true" size={19} /> Registrar referencia
                </h2>
                <p>AdminGest guarda solo el enlace; el archivo permanece en tu proveedor.</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="form-field full">
                <span>
                  Título<span aria-hidden="true" className="required-mark"> *</span>
                </span>
                <input maxLength={150} name="title" required />
              </label>
              <label className="form-field">
                <span>Categoría</span>
                <select defaultValue="OTHER" name="category">
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field full">
                <span>
                  URL HTTPS<span aria-hidden="true" className="required-mark"> *</span>
                </span>
                <input
                  aria-describedby="document-url-help"
                  maxLength={1500}
                  name="url"
                  pattern="https://.+"
                  placeholder="https://"
                  required
                  type="url"
                />
                <small id="document-url-help">
                  Solo enlaces HTTPS de los dominios autorizados por el administrador.
                </small>
              </label>
              <label className="form-field">
                <span>Proyecto (opcional)</span>
                <select defaultValue="" name="projectId">
                  <option value="">Sin proyecto</option>
                  {projects.data?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Cliente (opcional)</span>
                <select defaultValue="" name="customerId">
                  <option value="">Sin cliente</option>
                  {customers.data?.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {(formError || create.isError) && (
              <div className="alert error" role="alert">
                {formError || (create.error as Error).message}
              </div>
            )}
            <p className="field-hint">
              <Info aria-hidden="true" size={14} /> El módulo registra referencias externas; todavía no administra
              almacenamiento privado ni permisos sobre el archivo.
            </p>
            <div className="form-actions">
              <button className="primary-button" disabled={create.isPending} type="submit">
                {create.isPending ? 'Registrando…' : 'Registrar referencia'}
              </button>
            </div>
          </form>
        )}
      </div>

      {pendingDelete && (
        <Modal onClose={() => setPendingDelete(null)} title="Eliminar referencia">
          <div className="confirm-dialog">
            <p>
              Se eliminará la referencia «{pendingDelete.title}». El archivo en el proveedor externo no se modifica.
            </p>
            {remove.isError && (
              <div className="alert error" role="alert">
                {(remove.error as Error).message}
              </div>
            )}
            <footer className="form-actions">
              <button className="secondary-button" onClick={() => setPendingDelete(null)} type="button">
                Cancelar
              </button>
              <button
                className="danger-button"
                disabled={remove.isPending}
                onClick={() => remove.mutate(pendingDelete.id)}
                type="button"
              >
                {remove.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </footer>
          </div>
        </Modal>
      )}
    </section>
  );
}
