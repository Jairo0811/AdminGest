import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Mail, Phone, Plus, Search, UserRound } from 'lucide-react';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import { Paginated } from '../types';

interface Customer {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  contacts: Array<{
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    isPrimary: boolean;
  }>;
}

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const customers = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api<Paginated<Customer>>(`/customers?search=${encodeURIComponent(search)}&status=ACTIVE`),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['customers'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<Customer>('/customers', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      setShowForm(false);
      refresh();
    },
    onError: (reason: Error) => setError(reason.message),
  });
  const archive = useMutation({
    mutationFn: (id: string) => api(`/customers/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    create.mutate({
      name: values.name,
      taxId: values.taxId || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      address: values.address || undefined,
      website: values.website || undefined,
      primaryContact: values.contactFirstName
        ? {
            firstName: values.contactFirstName,
            lastName: values.contactLastName || undefined,
            email: values.contactEmail || undefined,
            phone: values.contactPhone || undefined,
            isPrimary: true,
          }
        : undefined,
    });
  }

  return (
    <div className="page-stack">
      <section className="page-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, RNC o correo…" />
        </label>
        <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Nuevo cliente
        </button>
      </section>
      <article className="panel">
        <div className="panel-header">
          <div><p className="eyebrow">Relaciones comerciales</p><h2>{customers.data?.meta.total ?? 0} clientes activos</h2></div>
        </div>
        {customers.isPending ? <div className="table-state">Cargando clientes…</div> : customers.isError ? (
          <div className="table-state error-text">{customers.error.message}</div>
        ) : customers.data.data.length === 0 ? (
          <div className="empty-state"><h3>Tu cartera está lista para crecer</h3><p>Crea un cliente o convierte un prospecto calificado.</p></div>
        ) : (
          <div className="customer-grid">
            {customers.data.data.map((customer) => {
              const primary = customer.contacts.find((contact) => contact.isPrimary) ?? customer.contacts[0];
              return (
                <article className="customer-card" key={customer.id}>
                  <div className="customer-card-head">
                    <div className="customer-logo">{customer.name.slice(0, 2).toUpperCase()}</div>
                    <div><h3>{customer.name}</h3><span>{customer.taxId ?? 'Sin identificación fiscal'}</span></div>
                    <button
                      className="icon-button subtle danger"
                      type="button"
                      title="Archivar cliente"
                      onClick={() => {
                        if (window.confirm('¿Archivar este cliente?')) archive.mutate(customer.id);
                      }}
                    ><Archive size={17} /></button>
                  </div>
                  <div className="customer-details">
                    <span><Mail size={16} /> {customer.email ?? 'Sin correo'}</span>
                    <span><Phone size={16} /> {customer.phone ?? 'Sin teléfono'}</span>
                    <span><UserRound size={16} /> {primary ? `${primary.firstName} ${primary.lastName ?? ''}` : 'Sin contacto principal'}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </article>

      {showForm && (
        <Modal title="Nuevo cliente" onClose={() => setShowForm(false)}>
          <form className="form-grid modal-form" onSubmit={submit}>
            <label className="field field-full"><span>Nombre o razón social *</span><input name="name" required minLength={2} /></label>
            <label className="field"><span>RNC / identificación</span><input name="taxId" /></label>
            <label className="field"><span>Sitio web</span><input name="website" type="url" placeholder="https://" /></label>
            <label className="field"><span>Correo</span><input name="email" type="email" /></label>
            <label className="field"><span>Teléfono</span><input name="phone" /></label>
            <label className="field field-full"><span>Dirección</span><input name="address" /></label>
            <div className="form-section-title field-full"><span>Contacto principal</span></div>
            <label className="field"><span>Nombre</span><input name="contactFirstName" /></label>
            <label className="field"><span>Apellido</span><input name="contactLastName" /></label>
            <label className="field"><span>Correo</span><input name="contactEmail" type="email" /></label>
            <label className="field"><span>Teléfono</span><input name="contactPhone" /></label>
            {error && <p className="form-error field-full">{error}</p>}
            <div className="form-actions field-full">
              <button className="secondary-button" type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="primary-button" disabled={create.isPending} type="submit">{create.isPending ? 'Guardando…' : 'Guardar cliente'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
