import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  FolderKanban,
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
  UsersRound,
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

const productPillars = [
  {
    icon: UsersRound,
    title: "CRM inteligente",
    description: "Gestiona clientes y prospectos",
  },
  {
    icon: FolderKanban,
    title: "Gestión de proyectos",
    description: "Planifica tareas, fechas y avances",
  },
  {
    icon: BarChart3,
    title: "Reportes en tiempo real",
    description: "Decide con información actualizada",
  },
  {
    icon: CircleDollarSign,
    title: "Finanzas controladas",
    description: "Cotizaciones, facturas y pagos",
  },
  {
    icon: Settings2,
    title: "Administración total",
    description: "Centraliza toda tu operación",
  },
];

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
      <a className="skip-link" href="#auth-form">Saltar al formulario de acceso</a>

      <div className="auth-page auth-page--cover-inspired">
        <section aria-labelledby="auth-product-title" className="auth-showcase auth-showcase--cover-inspired">
          <div className="auth-brand">
            <BrandLogo variant="login" />
          </div>

          <div className="auth-cover-copy">
            <p className="eyebrow">Gestión sin fricción</p>
            <h1 id="auth-product-title">La gestión inteligente para tu empresa</h1>
            <p>
              CRM, proyectos, reportes, finanzas y administración en una sola
              plataforma.
            </p>
          </div>

          <div className="auth-product-pillars" aria-label="Módulos principales">
            {productPillars.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <span aria-hidden="true" className="auth-pillar-icon">
                  <Icon size={20} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </div>
              </article>
            ))}
          </div>

          <div className="auth-trust-strip" aria-label="Ventajas de la plataforma">
            <span>
              <MonitorSmartphone aria-hidden="true" size={19} />
              Web · móvil · desktop
            </span>
            <span>
              <Cloud aria-hidden="true" size={19} />
              100% en la nube
            </span>
            <span>
              <ShieldCheck aria-hidden="true" size={19} />
              Seguro · rápido · confiable
            </span>
          </div>
        </section>

        <section aria-labelledby="auth-title" className="auth-form-panel" id="auth-form" tabIndex={-1}>
          <form aria-describedby={error ? "auth-error" : undefined} aria-labelledby="auth-title" className="auth-form" noValidate={false} onSubmit={submit}>
            <div>
              <p className="eyebrow">
                {mode === "login" ? "Bienvenido de nuevo" : "Comienza hoy"}
              </p>

              <h2 id="auth-title">
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
                    autoComplete="organization"
                    name="companyName"
                    placeholder="Nombre de la empresa"
                    required
                  />
                </label>

                <label className="form-field full">
                  <span>Cédula o RNC</span>
                  <input
                    aria-describedby="tax-id-help"
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
                  <small id="tax-id-help">Usa una cédula dominicana de 11 dígitos o un RNC de 9 dígitos.</small>
                </label>

                <div className="form-grid">
                  <label className="form-field">
                    <span>Nombre</span>
                    <input autoComplete="given-name" name="firstName" required />
                  </label>

                  <label className="form-field">
                    <span>Apellido</span>
                    <input autoComplete="family-name" name="lastName" required />
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
                aria-describedby={mode === "register" ? "password-help" : undefined}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                minLength={mode === "login" ? 8 : 10}
                name="password"
                required
                type="password"
              />
              {mode === "register" && <small id="password-help">Utiliza al menos 10 caracteres.</small>}
            </label>

            {mode === "login" && (
              <Link
                className="text-button auth-recovery-link"
                to="/forgot-password"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            )}

            {error && <div aria-live="assertive" className="alert error" id="auth-error" role="alert">{error}</div>}

            <button
              aria-busy={submitting}
              className="primary-button auth-submit"
              disabled={submitting}
              type="submit"
            >
              {submitting
                ? "Procesando…"
                : mode === "login"
                  ? "Entrar"
                  : "Crear cuenta"}

              {!submitting && <ArrowRight aria-hidden="true" size={18} />}
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

            <div className="auth-form-assurance">
              <BriefcaseBusiness aria-hidden="true" size={16} />
              <span>Operación empresarial centralizada</span>
              <CheckCircle2 aria-hidden="true" size={16} />
            </div>
          </form>
        </section>
      </div>

      <AppFooter />
    </div>
  );
}
