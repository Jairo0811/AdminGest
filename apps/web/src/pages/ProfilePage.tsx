import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

/** Short, human readable device description from the stored user agent. */
function describeDevice(userAgent?: string | null): string {
  if (!userAgent) return 'Dispositivo desconocido';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Navegador';
  const system = /Windows/.test(userAgent)
    ? 'Windows'
    : /Android/.test(userAgent)
      ? 'Android'
      : /iPhone|iPad/.test(userAgent)
        ? 'iOS'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  return system ? `${browser} en ${system}` : browser;
}

export function ProfilePage() {
  const { refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const profileQuery = useQuery({
    queryKey: ['/users/me'],
    queryFn: () => api<Profile>('/users/me'),
  });

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timeout);
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
    onSuccess: () => {
      setError('');
      // The server revoked every session, including this one. The notice travels through
      // the auth context: router state is lost in the protected-layout redirect.
      logout('Contraseña actualizada. Inicia sesión con tu nueva contraseña.');
      navigate('/login', { replace: true });
    },
    onError: (mutationError: Error) => setError(mutationError.message),
  });

  const sessions = useQuery({
    queryKey: ['/auth/sessions'],
    queryFn: () =>
      api<Array<{ id: string; createdAt: string; lastUsedAt: string; userAgent?: string | null }>>(
        '/auth/sessions',
      ),
  });
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);

  const revoke = useMutation({
    mutationFn: (id: string) => api('/auth/sessions/' + id, { method: 'DELETE' }),
    onSuccess: () => {
      setPendingRevoke(null);
      setNotice('Sesión revocada. Ese dispositivo deberá iniciar sesión de nuevo.');
      void sessions.refetch();
    },
    onError: (e: Error) => setError(e.message),
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
    changePassword.mutate(
      { currentPassword: String(data.get('currentPassword')), newPassword },
      { onSuccess: () => form.reset() },
    );
  };

  if (profileQuery.isLoading) {
    return (
      <section className="page">
        <div className="panel">Cargando perfil…</div>
      </section>
    );
  }

  const profile = profileQuery.data;

  return (
    <section className="page">
      {notice && (
        <div className="toast toast--success" role="status">
          {notice}
        </div>
      )}
      <div className="page-heading">
        <div>
          <p className="eyebrow">Cuenta personal</p>
          <h1>Mi perfil</h1>
          <p>Actualiza tus datos personales y protege tu acceso.</p>
        </div>
      </div>
      {(error || profileQuery.error) && (
        <div className="alert error">{error || (profileQuery.error as Error).message}</div>
      )}
      <div className="settings-grid">
        <form className="panel settings-form" onSubmit={submitProfile}>
          <div className="settings-title">
            <UserCircle />
            <div>
              <h2>Información personal</h2>
              <p>Datos visibles dentro de tu empresa.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="form-field">
              <span>Nombre</span>
              <input
                defaultValue={profile?.firstName}
                key={`first-${profile?.firstName}`}
                minLength={2}
                name="firstName"
                required
              />
            </label>
            <label className="form-field">
              <span>Apellido</span>
              <input
                defaultValue={profile?.lastName}
                key={`last-${profile?.lastName}`}
                minLength={2}
                name="lastName"
                required
              />
            </label>
            <label className="form-field full">
              <span>Correo electrónico</span>
              <input
                defaultValue={profile?.email}
                key={`email-${profile?.email}`}
                name="email"
                required
                type="email"
              />
            </label>
            <label className="form-field">
              <span>Rol</span>
              <input disabled value={profile?.role.replaceAll('_', ' ') ?? ''} />
            </label>
            <label className="form-field">
              <span>Estado</span>
              <input disabled value={profile?.status ?? ''} />
            </label>
          </div>
          <div className="form-actions">
            <button
              className="primary-button"
              disabled={updateProfile.isPending || !profile}
              type="submit"
            >
              <Save size={17} /> Guardar perfil
            </button>
          </div>
        </form>

        <form className="panel settings-form" onSubmit={submitPassword}>
          <div className="settings-title">
            <KeyRound />
            <div>
              <h2>Cambiar contraseña</h2>
              <p>Usa al menos 10 caracteres y no reutilices la contraseña actual.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="form-field full">
              <span>Contraseña actual</span>
              <input
                autoComplete="current-password"
                name="currentPassword"
                required
                type="password"
              />
            </label>
            <label className="form-field full">
              <span>Nueva contraseña</span>
              <input
                autoComplete="new-password"
                minLength={10}
                name="newPassword"
                required
                type="password"
              />
            </label>
            <label className="form-field full">
              <span>Confirmar contraseña</span>
              <input
                autoComplete="new-password"
                minLength={10}
                name="confirmPassword"
                required
                type="password"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="primary-button" disabled={changePassword.isPending} type="submit">
              <KeyRound size={17} /> Actualizar contraseña
            </button>
          </div>
        </form>
        <div className="panel">
          <div className="settings-title">
            <KeyRound />
            <div>
              <h2>Sesiones activas</h2>
              <p>Revoca el acceso de dispositivos que ya no utilizas.</p>
            </div>
          </div>
          {sessions.isLoading && (
            <p className="muted-state" role="status">
              Cargando sesiones…
            </p>
          )}
          {sessions.isError && (
            <p className="alert error" role="alert">
              No fue posible consultar las sesiones activas.
            </p>
          )}
          <ul className="item-list">
            {sessions.data?.map((session) => (
              <li className="item-row" key={session.id}>
                <div className="item-row__body">
                  <strong>{describeDevice(session.userAgent)}</strong>
                  <small>
                    Último uso: {new Date(session.lastUsedAt).toLocaleString('es-DO')} · Inicio:{' '}
                    {new Date(session.createdAt).toLocaleDateString('es-DO')}
                  </small>
                </div>
                <div className="item-row__actions">
                  {pendingRevoke === session.id ? (
                    <>
                      <button
                        className="danger-button compact"
                        disabled={revoke.isPending}
                        onClick={() => revoke.mutate(session.id)}
                        type="button"
                      >
                        {revoke.isPending ? 'Revocando…' : 'Confirmar'}
                      </button>
                      <button
                        className="secondary-button compact"
                        onClick={() => setPendingRevoke(null)}
                        type="button"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      aria-label={`Revocar sesión de ${describeDevice(session.userAgent)}`}
                      className="secondary-button compact"
                      onClick={() => setPendingRevoke(session.id)}
                      type="button"
                    >
                      Revocar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
