import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppFooter } from "../components/AppFooter";
import { BrandLogo } from "../components/BrandLogo";
import {
  formatDominicanTaxId,
  normalizeDominicanTaxId,
  validateDominicanTaxId,
} from "../utils/dominican-tax-id";

export function LoginPage() {
  const { user, login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate replace to="/" />;
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);

    try {
      if (mode === "login") {
        await login(String(form.get("email")), String(form.get("password")));
      } else {
        const taxId = String(form.get("taxId") ?? "");
        const taxIdError = validateDominicanTaxId(taxId);

        if (taxIdError) {
          throw new Error(taxIdError);
        }

        await register({
          companyName: String(form.get("companyName")),
          taxId: taxId ? normalizeDominicanTaxId(taxId) : undefined,
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
    <div className="auth-page-wrapper">
      <div className="auth-page">
        <section className="auth-showcase">
          <div className="auth-brand">
            <BrandLogo variant="login" />
          </div>

          <div className="auth-copy">
            <p className="eyebrow">Gestión sin fricción</p>

            <h1>La gestión inteligente para tu empresa</h1>

            <p>CRM, proyectos y gestión inteligente para tu empresa.</p>
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
                  <span>Cédula o RNC</span>
                  <input
                    inputMode="numeric"
                    maxLength={13}
                    name="taxId"
                    onInput={(event) => {
                      event.currentTarget.value = formatDominicanTaxId(
                        event.currentTarget.value,
                      );
                    }}
                    placeholder="001-0000000-0 o 130-00000-0"
                  />
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

            {mode === "login" && (
              <Link
                className="text-button auth-recovery-link"
                to="/forgot-password"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}

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

      <AppFooter />
    </div>
  );
}
