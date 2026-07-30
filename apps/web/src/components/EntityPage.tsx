import { FormEvent, ReactNode, useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from './Modal';

export interface Entity extends Record<string, unknown> {
  id: string;
}

interface Column {
  label: string;
  render(item: Entity): ReactNode;
}

interface Option {
  value: string;
  label: string;
}

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select';
  required?: boolean;
  options?: Option[];
  optionsEndpoint?: string;
  optionLabel?: (item: Entity) => string;
  placeholder?: string;
  defaultValue?: string | number;
}

interface EntityPageProps {
  title: string;
  description: string;
  endpoint: string;
  singular: string;
  columns: Column[];
  fields: Field[];
  canEdit?: boolean;
  canDelete?: boolean;
  buildPayload?(values: Record<string, string | number>): unknown;
}

const normalizeValue = (field: Field, value: string) =>
  field.type === 'number' ? Number(value) : value || undefined;

export function EntityPage({
  title,
  description,
  endpoint,
  singular,
  columns,
  fields,
  canEdit = true,
  canDelete = true,
  buildPayload,
}: EntityPageProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Entity | null | undefined>(undefined);
  const [error, setError] = useState('');
  const queryKey = [endpoint];

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => api<Entity[]>(endpoint),
  });

  const lookupEndpoints = useMemo(
    () => [...new Set(fields.map((field) => field.optionsEndpoint).filter(Boolean))],
    [fields],
  ) as string[];

  const lookupQueries = useQueries({
    queries: lookupEndpoints.map((lookupEndpoint) => ({
      queryKey: [lookupEndpoint],
      queryFn: () => api<Entity[]>(lookupEndpoint),
    })),
  });
  const lookups = lookupEndpoints.map(
    (lookupEndpoint, index) =>
      [lookupEndpoint, lookupQueries[index].data ?? []] as const,
  );

  const save = useMutation({
    mutationFn: async (values: Record<string, string | number>) => {
      const payload = buildPayload ? buildPayload(values) : values;
      return api<Entity>(editing ? `${endpoint}/${editing.id}` : endpoint, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      setEditing(undefined);
      setError('');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`${endpoint}/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const filtered = data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase()),
  );

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map((field) => [
        field.name,
        normalizeValue(field, String(formData.get(field.name) ?? '')),
      ]),
    ) as Record<string, string | number>;
    save.mutate(values);
  };

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Gestión empresarial</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <button className="primary-button" onClick={() => setEditing(null)} type="button">
          <Plus size={18} /> Nuevo {singular}
        </button>
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            aria-label={`Buscar ${title.toLowerCase()}`}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Buscar en ${title.toLowerCase()}...`}
            value={search}
          />
        </label>
        <span className="record-count">{filtered.length} registros</span>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-card">
        <div className="data-table table-header">
          {columns.map((column) => <strong key={column.label}>{column.label}</strong>)}
          {(canEdit || canDelete) && <strong>Acciones</strong>}
        </div>
        {isLoading ? (
          <div className="empty-state">Cargando información…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Todavía no hay registros para mostrar.</div>
        ) : (
          filtered.map((item) => (
            <div className="data-table table-row" key={item.id}>
              {columns.map((column) => (
                <div data-label={column.label} key={column.label}>
                  {column.render(item)}
                </div>
              ))}
              {(canEdit || canDelete) && (
                <div className="row-actions" data-label="Acciones">
                  {canEdit && (
                    <button
                      aria-label={`Editar ${singular}`}
                      className="table-action"
                      onClick={() => setEditing(item)}
                      type="button"
                    >
                      <Edit3 size={17} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      aria-label={`Eliminar ${singular}`}
                      className="table-action danger"
                      onClick={() => {
                        if (window.confirm(`¿Deseas eliminar este ${singular}?`)) {
                          remove.mutate(item.id);
                        }
                      }}
                      type="button"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {editing !== undefined && (
        <Modal
          onClose={() => {
            setEditing(undefined);
            setError('');
          }}
          title={editing ? `Editar ${singular}` : `Nuevo ${singular}`}
        >
          <form className="entity-form" onSubmit={submit}>
            {fields.map((field) => {
              const lookup = lookups.find(([key]) => key === field.optionsEndpoint)?.[1] ?? [];
              const options =
                field.options ??
                lookup.map((item) => ({
                  value: item.id,
                  label: field.optionLabel?.(item) ?? String(item.name ?? item.id),
                }));
              const defaultValue = String(editing?.[field.name] ?? field.defaultValue ?? '');

              return (
                <label
                  className={field.type === 'textarea' ? 'form-field full' : 'form-field'}
                  key={field.name}
                >
                  <span>{field.label}</span>
                  {field.type === 'textarea' ? (
                    <textarea
                      defaultValue={defaultValue}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select defaultValue={defaultValue} name={field.name} required={field.required}>
                      <option value="">Selecciona una opción</option>
                      {options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      defaultValue={defaultValue}
                      name={field.name}
                      placeholder={field.placeholder}
                      required={field.required}
                      type={field.type ?? 'text'}
                    />
                  )}
                </label>
              );
            })}
            {error && <div className="alert error form-alert">{error}</div>}
            <footer className="form-actions">
              <button className="secondary-button" onClick={() => setEditing(undefined)} type="button">
                Cancelar
              </button>
              <button className="primary-button" disabled={save.isPending} type="submit">
                {save.isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </footer>
          </form>
        </Modal>
      )}
    </section>
  );
}
