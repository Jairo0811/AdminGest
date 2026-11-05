import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, CheckCircle2, Save, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { SubscriptionPanel } from '../components/SubscriptionPanel';
import {
  formatDominicanTaxId,
  isValidDominicanRnc,
  normalizeDominicanTaxId,
} from '../utils/dominican-tax-id';

interface Company {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  timezone: string;
}

/** Optional columns that can be cleared: an empty input is sent as null. */
const CLEARABLE_FIELDS = ['email', 'phone', 'address'] as const;
const REQUIRED_FIELDS = ['name', 'currency', 'timezone'] as const;

export function SettingsPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [message, setMessage] = useState('');
  const [rnc, setRnc] = useState('');
  const [rncTouched, setRncTouched] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/company'],
    queryFn: () => api<Company>('/company'),
  });

  useEffect(() => {
    setRnc(data?.taxId ? formatDominicanTaxId(data.taxId) : '');
  }, [data?.taxId]);

  const save = useMutation({
    mutationFn: (company: Record<string, string | null>) =>
      api<Company>('/company', { method: 'PATCH', body: JSON.stringify(company) }),
    onSuccess: () => {
      setMessage('Configuración guardada.');
      setRncTouched(false);
      void client.invalidateQueries({ queryKey: ['/company'] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const normalizedRnc = normalizeDominicanTaxId(rnc);
  const hasRnc = normalizedRnc.length > 0;
  const isRncComplete = normalizedRnc.length === 9;
  const isRncValid = isRncComplete && isValidDominicanRnc(normalizedRnc);
  const showRncError = rncTouched && hasRnc && !isRncValid;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setRncTouched(true);

    if (hasRnc && !isRncValid) {
      setMessage('El RNC debe tener 9 dígitos y un dígito verificador válido.');
      return;
    }

    const form = new FormData(event.currentTarget);
    const values: Record<string, string | null> = {};
    for (const field of REQUIRED_FIELDS) {
      const value = String(form.get(field) ?? '').trim();
      if (value) values[field] = value;
    }
    // Clearing an optional field sends null so the stored value is removed.
    for (const field of CLEARABLE_FIELDS) {
      const value = String(form.get(field) ?? '').trim();
      values[field] = value || null;
    }
    values.taxId = hasRnc ? normalizedRnc : null;
    save.mutate(values);
  };

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Configuración</h1>
          <p>Personaliza los datos generales y preferencias de tu empresa.</p>
        </div>
      </div>

      <div className="settings-grid">
        {isLoading || isError || !data ? (
          <div className="panel settings-form" role={isError ? 'alert' : 'status'}>
            {isError ? (
              <>
                <p>No fue posible cargar la configuración de la empresa.</p>
                <button className="secondary-button" onClick={() => void refetch()} type="button">Reintentar</button>
              </>
            ) : (
              <p>Cargando configuración…</p>
            )}
          </div>
        ) : (
        // Keyed by the loaded record: uncontrolled inputs must never start empty and
        // then be saved, because an empty optional field now clears the stored value.
        <form className="panel settings-form" key={data.name + data.email + data.phone} onSubmit={submit}>
          <div className="settings-title">
            <Building2 />
            <div>
              <h2>Perfil de empresa</h2>
              <p>Información mostrada en documentos y reportes.</p>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>Empresa</span>
              <input defaultValue={data?.name} name="name" required />
            </label>

            <label className="form-field">
              <span>RNC</span>
              <input
                aria-describedby="rnc-help"
                aria-invalid={showRncError}
                autoComplete="off"
                inputMode="numeric"
                maxLength={11}
                name="taxId"
                onBlur={() => setRncTouched(true)}
                onChange={(event) => {
                  const digits = normalizeDominicanTaxId(event.target.value).slice(0, 9);
                  setRnc(formatDominicanTaxId(digits));
                  setMessage('');
                }}
                pattern="\d{3}-\d{5}-\d"
                placeholder="000-00000-0"
                value={rnc}
              />
              <small id="rnc-help">
                {hasRnc ? `${normalizedRnc.length}/9 dígitos` : 'Formato: 000-00000-0'}
              </small>
              {rncTouched && hasRnc && (
                <small className={isRncValid ? 'field-success' : 'field-error'}>
                  {isRncValid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {isRncValid
                    ? 'RNC válido.'
                    : isRncComplete
                      ? 'El dígito verificador del RNC no es válido.'
                      : 'El RNC debe contener exactamente 9 dígitos.'}
                </small>
              )}
            </label>

            <label className="form-field">
              <span>Correo</span>
              <input defaultValue={data?.email} name="email" type="email" />
            </label>
            <label className="form-field">
              <span>Teléfono</span>
              <input defaultValue={data?.phone} name="phone" />
            </label>
            <label className="form-field">
              <span>Moneda</span>
              <input defaultValue={data?.currency ?? 'DOP'} maxLength={3} minLength={3} name="currency" pattern="[A-Za-z]{3}" required />
            </label>
            <label className="form-field">
              <span>Zona horaria</span>
              <input defaultValue={data?.timezone} name="timezone" placeholder="America/Santo_Domingo" required />
            </label>
            <label className="form-field full">
              <span>Dirección</span>
              <textarea defaultValue={data?.address} name="address" />
            </label>
          </div>

          <p className="field-hint">Deja vacío un campo opcional y guarda para eliminar su valor.</p>
          {message && <div className={save.isError ? 'alert error' : 'alert success'} role={save.isError ? 'alert' : 'status'}>{message}</div>}
          <div className="form-actions">
            <button
              className="primary-button"
              disabled={save.isPending || (hasRnc && !isRncValid)}
              type="submit"
            >
              <Save size={17} /> {save.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
        )}

        <aside className="panel security-panel">
          <ShieldCheck />
          <h2>Seguridad multiempresa</h2>
          <p>Tu sesión aplica aislamiento por empresa y permisos basados en roles.</p>
          <ul>
            <li>Tokens de acceso de corta duración y sesiones revocables por dispositivo</li>
            <li>Contraseñas protegidas con bcrypt</li>
            <li>Referencias validadas por empresa en la API y en la base de datos</li>
            <li>Registro de auditoría</li>
          </ul>
        </aside>
      </div>

      {isAdmin && <SubscriptionPanel />}
    </section>
  );
}
