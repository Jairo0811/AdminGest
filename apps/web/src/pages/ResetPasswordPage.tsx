import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { BrandLogo } from '../components/BrandLogo';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password'));
    const confirmation = String(form.get('confirmation'));

    if (!token) {
      setError('El enlace de recuperación no contiene un token válido.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setSuccess(true);
      window.setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible restablecer la contraseña.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page auth-page-centered">
      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={submit}>
          <BrandLogo variant="login" />
          <div>
            <p className="eyebrow">Nueva credencial</p>
            <h2>Restablecer contraseña</h2>
            <p>Utiliza al menos 10 caracteres, una mayúscula, una minúscula y un número.</p>
          </div>
          {success ? (
            <div className="alert success"><CheckCircle2 size={18} /> Contraseña actualizada. Redirigiendo al inicio de sesión…</div>
          ) : (
            <>
              <label className="form-field full">
                <span>Nueva contraseña</span>
                <input autoComplete="new-password" minLength={10} name="password" required type="password" />
              </label>
              <label className="form-field full">
                <span>Confirmar contraseña</span>
                <input autoComplete="new-password" minLength={10} name="confirmation" required type="password" />
              </label>
              {error && <div className="alert error">{error}</div>}
              <button className="primary-button auth-submit" disabled={submitting || !token} type="submit">
                <KeyRound size={18} /> {submitting ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </>
          )}
          <Link className="text-button" to="/login"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
        </form>
      </section>
    </div>
  );
}
