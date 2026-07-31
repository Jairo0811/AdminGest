import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, KeyRound, Plus, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Modal } from '../components/Modal';

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

const roleOptions = [
  ['ADMIN', 'Administrador'],
  ['SALES_MANAGER', 'Gerente comercial'],
  ['SALES_REP', 'Representante de ventas'],
  ['PROJECT_MANAGER', 'Gerente de proyectos'],
  ['VIEWER', 'Solo lectura'],
] as const;

const roleLabel = (role: string) =>
  roleOptions.find(([value]) => value === role)?.[1] ?? role.replaceAll('_', ' ');

export function UsersPage() {
  const { user: sessionUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<UserItem | null | undefined>(undefined);
  const [resetting, setResetting] = useState<UserItem | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const usersQuery = useQuery({ queryKey: ['/users'], queryFn: () => api<UserItem[]>('/users') });
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usersQuery.data ?? [];
    return (usersQuery.data ?? []).filter((item) =>
      `${item.firstName} ${item.lastName} ${item.email} ${item.role}`.toLowerCase().includes(term),
    );
  }, [search, usersQuery.data]);

  const save = useMutation({
    mutationFn: async (values: Record<string, string>) =>
      api<UserItem>(editing ? `/users/${editing.id}` : '/users', {
        method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['/users'] });
      setEditing(undefined); setError(''); setNotice('Usuario guardado correctamente.');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const toggleStatus = useMutation({
    mutationFn: (item: UserItem) => api<UserItem>(`/users/${item.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['/users'] });
      setError(''); setNotice('Estado del usuario actualizado.');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const resetPassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api(`/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
    onSuccess: () => {
      setResetting(null); setError(''); setNotice('Contraseña temporal establecida correctamente.');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values: Record<string, string> = {
      firstName: String(form.get('firstName')).trim(),
      lastName: String(form.get('lastName')).trim(),
      email: String(form.get('email')).trim(),
      role: String(form.get('role')),
    };
    if (!editing) values.password = String(form.get('password'));
    save.mutate(values);
  };

  const submitReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resetting) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    if (password !== String(form.get('confirmPassword'))) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }
    resetPassword.mutate({ id: resetting.id, password });
  };

  return (
    <section className="page">
      {notice && <div className="toast toast--success" role="status">{notice}</div>}
      <div className="page-heading"><div><p className="eyebrow">Administración</p><h1>Usuarios y roles</h1><p>Gestiona el acceso del equipo y aplica el principio de mínimo privilegio.</p></div><button className="primary-button" onClick={() => setEditing(null)} type="button"><Plus size={18} /> Nuevo usuario</button></div>
      <div className="toolbar entity-toolbar"><label className="search-box"><input aria-label="Buscar usuarios" onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o rol..." value={search} /></label><span className="record-count">{filtered.length} usuarios</span></div>
      {(error || usersQuery.error) && <div className="alert error">{error || (usersQuery.error as Error).message}</div>}
      <div className="table-card">
        <div className="data-table table-header"><strong>Usuario</strong><strong>Rol</strong><strong>Estado</strong><strong>Último acceso</strong><strong>Acciones</strong></div>
        {usersQuery.isLoading ? <div className="table-skeleton" aria-label="Cargando usuarios">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div> : filtered.length === 0 ? <div className="empty-state"><strong>No hay usuarios</strong><p>Crea el primer integrante del equipo.</p></div> : filtered.map((item) => (
          <div className="data-table table-row" key={item.id}>
            <div data-label="Usuario" className="primary-cell"><strong>{item.firstName} {item.lastName}</strong><small>{item.email}</small></div>
            <div data-label="Rol"><span className="status-badge blue"><ShieldCheck size={14} /> {roleLabel(item.role)}</span></div>
            <div data-label="Estado"><span className={`status-badge ${item.status === 'ACTIVE' ? 'green' : 'gray'}`}>{item.status === 'ACTIVE' ? 'Activo' : item.status === 'BLOCKED' ? 'Bloqueado' : 'Inactivo'}</span></div>
            <div data-label="Último acceso">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('es-DO') : 'Nunca'}</div>
            <div className="row-actions" data-label="Acciones">
              <button aria-label="Editar usuario" className="table-action" onClick={() => setEditing(item)} type="button"><Edit3 size={17} /></button>
              <button aria-label="Restablecer contraseña" className="table-action" onClick={() => setResetting(item)} type="button"><KeyRound size={17} /></button>
              <button aria-label={item.status === 'ACTIVE' ? 'Desactivar usuario' : 'Activar usuario'} className={`table-action ${item.status === 'ACTIVE' ? 'danger' : ''}`} disabled={item.id === sessionUser?.id || toggleStatus.isPending} onClick={() => toggleStatus.mutate(item)} title={item.id === sessionUser?.id ? 'No puedes desactivar tu propia cuenta.' : undefined} type="button">{item.status === 'ACTIVE' ? <UserX size={17} /> : <UserCheck size={17} />}</button>
            </div>
          </div>
        ))}
      </div>

      {editing !== undefined && <Modal onClose={() => { setEditing(undefined); setError(''); }} title={editing ? 'Editar usuario' : 'Nuevo usuario'}><form className="entity-form" onSubmit={submit}>
        <label className="form-field"><span>Nombre</span><input defaultValue={editing?.firstName} maxLength={60} minLength={2} name="firstName" required /></label>
        <label className="form-field"><span>Apellido</span><input defaultValue={editing?.lastName} maxLength={60} minLength={2} name="lastName" required /></label>
        <label className="form-field full"><span>Correo electrónico</span><input defaultValue={editing?.email} name="email" required type="email" /></label>
        <label className="form-field full"><span>Rol</span><select defaultValue={editing?.role ?? 'SALES_REP'} name="role" required>{roleOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {!editing && <label className="form-field full"><span>Contraseña temporal</span><input minLength={10} name="password" required type="password" /></label>}
        <footer className="form-actions"><button className="secondary-button" onClick={() => setEditing(undefined)} type="button">Cancelar</button><button className="primary-button" disabled={save.isPending} type="submit">{save.isPending ? 'Guardando…' : 'Guardar'}</button></footer>
      </form></Modal>}

      {resetting && <Modal onClose={() => { setResetting(null); setError(''); }} title="Restablecer contraseña"><form className="entity-form" onSubmit={submitReset}>
        <p className="full">Establece una contraseña temporal para <strong>{resetting.firstName} {resetting.lastName}</strong>.</p>
        <label className="form-field full"><span>Nueva contraseña temporal</span><input minLength={10} name="password" required type="password" /></label>
        <label className="form-field full"><span>Confirmar contraseña</span><input minLength={10} name="confirmPassword" required type="password" /></label>
        <footer className="form-actions"><button className="secondary-button" onClick={() => setResetting(null)} type="button">Cancelar</button><button className="primary-button" disabled={resetPassword.isPending} type="submit">Restablecer</button></footer>
      </form></Modal>}
    </section>
  );
}
