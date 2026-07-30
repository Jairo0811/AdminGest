import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, ShieldCheck, Users } from 'lucide-react';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface Company {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  _count: { users: number; customers: number; leads: number; projects: number };
}

interface CompanyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLoginAt?: string;
}

export function SettingsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = session?.user.role === 'ADMIN';
  const [showUserForm, setShowUserForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const company = useQuery({ queryKey: ['company'], queryFn: () => api<Company>('/company') });
  const users = useQuery({
    queryKey: ['company-users'],
    queryFn: () => api<CompanyUser[]>('/company/users'),
    enabled: isAdmin,
  });
  const updateCompany = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/company', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      setMessage('La información de la empresa fue actualizada.');
      void queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: (reason: Error) => setError(reason.message),
  });
  const createUser = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api('/company/users', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setShowUserForm(false);
      void queryClient.invalidateQueries({ queryKey: ['company-users'] });
      void queryClient.invalidateQueries({ queryKey: ['company'] });
    },
    onError: (reason: Error) => setError(reason.message),
  });

  function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    updateCompany.mutate({
      name: values.name,
      taxId: values.taxId || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      currency: values.currency,
    });
  }

  function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    createUser.mutate(values);
  }

  if (company.isPending) return <div className="loading-card">Cargando configuración…</div>;
  if (company.isError) return <div className="error-card">{company.error.message}</div>;

  return (
    <div className="settings-grid">
      <article className="panel">
        <div className="panel-header">
          <div><p className="eyebrow">Organización</p><h2>Perfil de la empresa</h2></div>
          <Building2 size={22} />
        </div>
        <form className="form-grid settings-form" onSubmit={saveCompany}>
          <label className="field field-full"><span>Nombre</span><input name="name" defaultValue={company.data.name} disabled={!isAdmin} required /></label>
          <label className="field"><span>RNC / identificación</span><input name="taxId" defaultValue={company.data.taxId} disabled={!isAdmin} /></label>
          <label className="field"><span>Moneda</span><select name="currency" defaultValue={company.data.currency} disabled={!isAdmin}><option value="DOP">DOP — Peso dominicano</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option></select></label>
          <label className="field"><span>Correo</span><input name="email" type="email" defaultValue={company.data.email} disabled={!isAdmin} /></label>
          <label className="field"><span>Teléfono</span><input name="phone" defaultValue={company.data.phone} disabled={!isAdmin} /></label>
          <label className="field field-full"><span>Dirección</span><input name="address" defaultValue={company.data.address} disabled={!isAdmin} /></label>
          {message && <p className="success-message field-full">{message}</p>}
          {error && <p className="form-error field-full">{error}</p>}
          {isAdmin && <div className="form-actions field-full"><button className="primary-button" disabled={updateCompany.isPending} type="submit">Guardar cambios</button></div>}
        </form>
      </article>
      <article className="panel">
        <div className="panel-header">
          <div><p className="eyebrow">Acceso</p><h2>Equipo de trabajo</h2></div>
          {isAdmin && <button className="icon-button" type="button" onClick={() => setShowUserForm(true)} aria-label="Agregar usuario"><Plus size={19} /></button>}
        </div>
        {!isAdmin ? (
          <div className="permission-note"><ShieldCheck size={24} /><p>Solo los administradores pueden gestionar usuarios y permisos.</p></div>
        ) : users.isPending ? <div className="table-state">Cargando usuarios…</div> : (
          <div className="team-list">
            {users.data?.map((user) => (
              <div className="team-member" key={user.id}>
                <div className="avatar small">{user.firstName[0]}{user.lastName[0]}</div>
                <div><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></div>
                <div><small>{user.role.replaceAll('_', ' ')}</small><StatusBadge status={user.status} /></div>
              </div>
            ))}
          </div>
        )}
        <div className="company-counts">
          <span><Users size={16} /> {company.data._count.users} usuarios</span>
          <span>{company.data._count.customers} clientes</span>
          <span>{company.data._count.projects} proyectos</span>
        </div>
      </article>

      {showUserForm && (
        <Modal title="Nuevo usuario" onClose={() => setShowUserForm(false)}>
          <form className="form-grid modal-form" onSubmit={addUser}>
            <label className="field"><span>Nombre *</span><input name="firstName" required /></label>
            <label className="field"><span>Apellido *</span><input name="lastName" required /></label>
            <label className="field field-full"><span>Correo *</span><input name="email" type="email" required /></label>
            <label className="field field-full"><span>Contraseña temporal *</span><input name="password" type="password" minLength={10} required /></label>
            <label className="field field-full"><span>Rol *</span><select name="role" defaultValue="SALES_REP"><option value="ADMIN">Administrador</option><option value="SALES_MANAGER">Gerente comercial</option><option value="SALES_REP">Representante de ventas</option><option value="PROJECT_MANAGER">Gerente de proyectos</option><option value="VIEWER">Consulta</option></select></label>
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full"><button className="secondary-button" type="button" onClick={() => setShowUserForm(false)}>Cancelar</button><button className="primary-button" disabled={createUser.isPending} type="submit">Crear usuario</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
