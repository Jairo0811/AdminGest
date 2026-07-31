import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { BrandLogo } from "../components/BrandLogo";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate replace to="/" />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      if (mode === "login") {
        await login(String(form.get("email")), String(form.get("password")));
      } else {
        await register({
          companyName: String(form.get("companyName")),
          taxId: String(form.get("taxId")) || undefined,
          firstName: String(form.get("firstName")),
          lastName: String(form.get("lastName")),
          email: String(form.get("email")),
          password: String(form.get("password")),
        });
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No fue posible continuar.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-showcase">
        <div className="auth-brand">
          <BrandLogo variant="login" />
        </div>

        <div className="auth-copy">
          <p className="eyebrow">Gestión sin fricción</p>
          <h1>La gestión inteligente para tu empresa</h1>
          <p>
           CRM, Proyectos, y Gestion Inteligente para tu empresa.
          </p>
        </div>

        <div className="feature-grid">
          <div>
            <BarChart3 />
            <span>
              <strong>Decisiones claras</strong>
              <small>Indicadores en tiempo real</small>
            </span>
          </div>
          <div>
            <FolderKanban />
            <span>
              <strong>Proyectos bajo control</strong>
              <small>Tareas, fechas y progreso</small>
            </span>
          </div>
          <div>
            <ShieldCheck />
            <span>
              <strong>Datos protegidos</strong>
              <small>Acceso por empresa y rol</small>
            </span>
          </div>
          <div>
            <CheckCircle2 />
            <span>
              <strong>Flujos conectados</strong>
              <small>Del prospecto al proyecto</small>
            </span>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">
              {mode === "login" ? "Bienvenido de nuevo" : "Comienza hoy"}
            </p>
            <h2>
              {mode === "login"
                ? "Inicia sesión"
                : "Crea tu espacio de trabajo"}
            </h2>
            <p>
              {mode === "login"
                ? "Accede a la operación de tu empresa."
                : "Configura tu empresa y usuario administrador."}
            </p>
          </div>

          {mode === "register" && (
            <>
              <label className="form-field full">
                <span>Empresa</span>
                <input
                  name="companyName"
                  placeholder="Nombre de la empresa"
                  required
                />
              </label>
              <label className="form-field full">
                <span>RNC o identificación</span>
                <input name="taxId" placeholder="Opcional" />
              </label>
              <div className="form-grid">
                <label className="form-field">
                  <span>Nombre</span>
                  <input name="firstName" required />
                </label>
                <label className="form-field">
                  <span>Apellido</span>
                  <input name="lastName" required />
                </label>
              </div>
            </>
          )}

          <label className="form-field full">
            <span>Correo electrónico</span>
            <input
              autoComplete="email"
              name="email"
              placeholder="tu@empresa.com"
              required
              type="email"
            />
          </label>

          <label className="form-field full">
            <span>Contraseña</span>
            <input
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? 8 : 10}
              name="password"
              required
              type="password"
            />
          </label>

          {error && <div className="alert error">{error}</div>}

          <button
            className="primary-button auth-submit"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? "Procesando…"
              : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
            {!submitting && <ArrowRight size={18} />}
          </button>

          <button
            className="text-button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            type="button"
          >
            {mode === "login"
              ? "¿Primera vez? Crea una cuenta"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </form>
      </section>
    </div>
  );
}
