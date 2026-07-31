import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { KeyRound, Save, UserCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Profile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
}

export function ProfilePage() {
  const { refreshUser } = useAuth();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const profileQuery = useQuery({
    queryKey: ['/users/me'],
    queryFn: () => api<Profile>('/users/me'),
  });

  useEffect(() => {
    if (notice) {
      const timeout = window.setTimeout(() => setNotice(''), 3200);
      return () => window.clearTimeout(timeout);
    }
  }, [notice]);

  const updateProfile = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      api<Profile>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }),
    onSuccess: async () => {
      await profileQuery.refetch();
      await refreshUser();
      setError('');
      setNotice('Perfil actualizado correctamente.');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const changePassword = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      api('/users/me/change-password', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (_, __, context) => {
      setError('');
      setNotice('Contraseña actualizada correctamente.');
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateProfile.mutate({
      firstName: String(form.get('firstName')).trim(),
      lastName: String(form.get('lastName')).trim(),
      email: String(form.get('email')).trim(),
    });
  };

  const submitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get('newPassword'));
    if (newPassword !== String(data.get('confirmPassword'))) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }
    changePassword.mutate({
      currentPassword: String(data.get('currentPassword')),
      newPassword,
    }, { onSuccess: () => form.reset() });
  };

  const profile = profileQuery.data;

  return (
    <section className="page">
      {notice && <div className="toast toast--success" role="status">{notice}</div>}
      <div className="page-heading">
        <div><p className="eyebrow">Cuenta personal</p><h1>Mi perfil</h1><p>Actualiza tus datos personales y protege tu acceso.</p></div>
      </div>
      {error && <div className="alert error">{error}</div>}
      <div className="settings-grid">
        <form className="panel settings-form" onSubmit={submitProfile}>
          <div className="settings-title"><UserCircle /><div><h2>Información personal</h2><p>Datos visibles dentro de tu empresa.</p></div></div>
          <div className="form-grid">
            <label className="form-field"><span>Nombre</span><input defaultValue={profile?.firstName} key={`first-${profile?.firstName}`} minLength={2} name="firstName" required /></label>
            <label className="form-field"><span>Apellido</span><input defaultValue={profile?.lastName} key={`last-${profile?.lastName}`} minLength={2} name="lastName" required /></label>
            <label className="form-field full"><span>Correo electrónico</span><input defaultValue={profile?.email} key={`email-${profile?.email}`} name="email" required type="email" /></label>
            <label className="form-field"><span>Rol</span><input disabled value={profile?.role.replaceAll('_', ' ') ?? ''} /></label>
            <label className="form-field"><span>Estado</span><input disabled value={profile?.status ?? ''} /></label>
          </div>
          <div className="form-actions"><button className="primary-button" disabled={updateProfile.isPending || !profile} type="submit"><Save size={17} /> Guardar perfil</button></div>
        </form>

        <form className="panel settings-form" onSubmit={submitPassword}>
          <div className="settings-title"><KeyRound /><div><h2>Cambiar contraseña</h2><p>Usa al menos 10 caracteres y no reutilices la contraseña actual.</p></div></div>
          <div className="form-grid">
            <label className="form-field full"><span>Contraseña actual</span><input autoComplete="current-password" name="currentPassword" required type="password" /></label>
            <label className="form-field full"><span>Nueva contraseña</span><input autoComplete="new-password" minLength={10} name="newPassword" required type="password" /></label>
            <label className="form-field full"><span>Confirmar contraseña</span><input autoComplete="new-password" minLength={10} name="confirmPassword" required type="password" /></label>
          </div>
          <div className="form-actions"><button className="primary-button" disabled={changePassword.isPending} type="submit"><KeyRound size={17} /> Actualizar contraseña</button></div>
        </form>
      </div>
    </section>
  );
}
