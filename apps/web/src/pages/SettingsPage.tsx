import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

interface Company {
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  timezone: string;
}

export function SettingsPage() {
  const client = useQueryClient();
  const [message, setMessage] = useState('');
  const { data } = useQuery({
    queryKey: ['/company'],
    queryFn: () => api<Company>('/company'),
  });
  const save = useMutation({
    mutationFn: (company: Record<string, string>) =>
      api<Company>('/company', { method: 'PATCH', body: JSON.stringify(company) }),
    onSuccess: () => {
      setMessage('Configuración guardada.');
      void client.invalidateQueries({ queryKey: ['/company'] });
    },
    onError: (error: Error) => setMessage(error.message),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(
      [...new FormData(event.currentTarget).entries()].filter(
        ([, value]) => String(value).trim() !== '',
      ),
    ) as Record<string, string>;
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
        <form className="panel settings-form" onSubmit={submit}>
          <div className="settings-title"><Building2 /><div><h2>Perfil de empresa</h2><p>Información mostrada en documentos y reportes.</p></div></div>
          <div className="form-grid">
            <label className="form-field"><span>Empresa</span><input defaultValue={data?.name} name="name" required /></label>
            <label className="form-field"><span>RNC</span><input defaultValue={data?.taxId} name="taxId" /></label>
            <label className="form-field"><span>Correo</span><input defaultValue={data?.email} name="email" type="email" /></label>
            <label className="form-field"><span>Teléfono</span><input defaultValue={data?.phone} name="phone" /></label>
            <label className="form-field"><span>Moneda</span><input defaultValue={data?.currency ?? 'DOP'} maxLength={3} name="currency" /></label>
            <label className="form-field"><span>Zona horaria</span><input defaultValue={data?.timezone} name="timezone" /></label>
            <label className="form-field full"><span>Dirección</span><textarea defaultValue={data?.address} name="address" /></label>
          </div>
          {message && <div className="alert">{message}</div>}
          <div className="form-actions"><button className="primary-button" type="submit"><Save size={17} /> Guardar</button></div>
        </form>
        <aside className="panel security-panel">
          <ShieldCheck />
          <h2>Seguridad multiempresa</h2>
          <p>Tu sesión aplica aislamiento por empresa y permisos basados en roles.</p>
          <ul>
            <li>JWT con expiración configurable</li>
            <li>Contraseñas protegidas con bcrypt</li>
            <li>Validación estricta de entradas</li>
            <li>Registro de auditoría</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
