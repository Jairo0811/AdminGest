import { FormEvent, useState } from 'react';
import { ArrowRight, BarChart3, Check, Eye, EyeOff, FolderKanban, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try {
      if (mode === 'login') {
        await login({ email: values.email, password: values.password });
      } else {
        await register({
          companyName: values.companyName,
          taxId: values.taxId || undefined,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
        });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No fue posible iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-showcase">
        <div className="brand brand-large">
          <span className="brand-mark">AG</span>
          <span>Admin<span>Gest</span></span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow light">Gestión empresarial centralizada</p>
          <h1>Convierte cada oportunidad en resultados medibles.</h1>
          <p>
            CRM, ventas, proyectos e inventario conectados en una plataforma segura y
            preparada para crecer con tu empresa.
          </p>
          <div className="feature-pills">
            <span><BarChart3 size={18} /> Indicadores en tiempo real</span>
            <span><FolderKanban size={18} /> Proyectos bajo control</span>
            <span><ShieldCheck size={18} /> Datos aislados por empresa</span>
          </div>
        </div>
        <div className="auth-proof">
          <span><Check size={16} /> SQL Server</span>
          <span><Check size={16} /> API segura con JWT</span>
          <span><Check size={16} /> Auditoría integrada</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{mode === 'login' ? 'Bienvenido de nuevo' : 'Comienza ahora'}</p>
          <h2>{mode === 'login' ? 'Inicia sesión en AdminGest' : 'Crea tu espacio de trabajo'}</h2>
          <p className="muted">
            {mode === 'login'
              ? 'Ingresa con las credenciales de tu empresa.'
              : 'La primera cuenta quedará configurada como administrador.'}
          </p>

          <form className="form-grid" onSubmit={submit}>
            {mode === 'register' && (
              <>
                <label className="field field-full">
                  <span>Empresa</span>
                  <input name="companyName" required minLength={2} placeholder="Nombre de la empresa" />
                </label>
                <label className="field">
                  <span>Nombre</span>
                  <input name="firstName" required minLength={2} />
                </label>
                <label className="field">
                  <span>Apellido</span>
                  <input name="lastName" required minLength={2} />
                </label>
                <label className="field field-full">
                  <span>RNC o identificación fiscal <small>(opcional)</small></span>
                  <input name="taxId" />
                </label>
              </>
            )}
            <label className="field field-full">
              <span>Correo electrónico</span>
              <input name="email" type="email" required autoComplete="email" placeholder="nombre@empresa.com" />
            </label>
            <label className="field field-full">
              <span>Contraseña</span>
              <div className="password-input">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  minLength={mode === 'register' ? 10 : 8}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && <p className="form-error field-full">{error}</p>}
            <button className="primary-button field-full" disabled={busy} type="submit">
              {busy ? 'Procesando…' : mode === 'login' ? 'Ingresar' : 'Crear empresa'}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setMode((value) => (value === 'login' ? 'register' : 'login'));
              setError('');
            }}
          >
            {mode === 'login'
              ? '¿Primera vez? Crea una cuenta empresarial'
              : '¿Ya tienes una cuenta? Inicia sesión'}
          </button>
        </div>
      </section>
    </main>
  );
}
