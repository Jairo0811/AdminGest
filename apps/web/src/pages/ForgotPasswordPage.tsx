import { FormEvent, useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { BrandLogo } from '../components/BrandLogo';

export function ForgotPasswordPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      const result = await api<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: String(form.get('email')) }),
      });
      setMessage(result.message);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No fue posible procesar la solicitud.');
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
            <p className="eyebrow">Recuperación segura</p>
            <h2>¿Olvidaste tu contraseña?</h2>
            <p>Introduce tu correo y te enviaremos un enlace válido durante 30 minutos.</p>
          </div>
          <label className="form-field full">
            <span>Correo electrónico</span>
            <input autoComplete="email" name="email" placeholder="tu@empresa.com" required type="email" />
          </label>
          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}
          <button className="primary-button auth-submit" disabled={submitting} type="submit">
            <Mail size={18} /> {submitting ? 'Enviando…' : 'Enviar enlace'}
          </button>
          <Link className="text-button" to="/login"><ArrowLeft size={16} /> Volver al inicio de sesión</Link>
        </form>
      </section>
    </div>
  );
}
