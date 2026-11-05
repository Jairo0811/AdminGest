import { useQuery } from '@tanstack/react-query';
import { CreditCard, Info } from 'lucide-react';
import { api } from '../api/client';

type Resource = 'users' | 'customers' | 'projects';

export interface CurrentSubscription {
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  isUsable: boolean;
  plan: {
    name: string;
    code: string;
    description?: string | null;
    storageMb: number;
    advancedReports: boolean;
    apiAccess: boolean;
  };
  usage: Record<Resource, number>;
  limits: Record<Resource, number>;
  remaining: Record<Resource, number>;
  billing?: { integrated: boolean; automaticRenewal: boolean };
}

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Prueba gratuita',
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
  CANCELED: 'Cancelada',
  CANCELLED: 'Cancelada',
};

const RESOURCES: Array<{ key: Resource; label: string }> = [
  { key: 'users', label: 'Usuarios activos' },
  { key: 'customers', label: 'Clientes activos' },
  { key: 'projects', label: 'Proyectos' },
];

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'long', year: 'numeric' }).format(
        new Date(value),
      )
    : '—';

/**
 * Administrative view of the plan and quota usage (GET /subscriptions/current).
 * AdminGest has no integrated payments yet, so no purchase or upgrade buttons are shown.
 */
export function SubscriptionPanel() {
  const query = useQuery({
    queryKey: ['/subscriptions/current'],
    queryFn: () => api<CurrentSubscription>('/subscriptions/current'),
  });
  const subscription = query.data;

  return (
    <section aria-labelledby="subscription-title" className="panel subscription-panel">
      <div className="settings-title">
        <CreditCard aria-hidden="true" />
        <div>
          <h2 id="subscription-title">Suscripción y capacidad</h2>
          <p>Plan asignado a la empresa y consumo de las cuotas aplicadas.</p>
        </div>
      </div>

      {query.isLoading && <p className="muted-state" role="status">Cargando suscripción…</p>}
      {query.isError && (
        <div className="alert error" role="alert">
          {query.error instanceof Error ? query.error.message : 'No fue posible consultar la suscripción.'}{' '}
          <button className="text-button" onClick={() => void query.refetch()} type="button">Reintentar</button>
        </div>
      )}

      {subscription && (
        <>
          <dl className="subscription-summary">
            <div>
              <dt>Plan</dt>
              <dd>{subscription.plan.name}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>
                <span className={`status-badge ${subscription.isUsable ? 'green' : 'red'}`}>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                  {!subscription.isUsable ? ' · sin acceso a nuevas altas' : ''}
                </span>
              </dd>
            </div>
            {subscription.status === 'TRIAL' && (
              <div>
                <dt>Fin de la prueba</dt>
                <dd>{formatDate(subscription.trialEndsAt)}</dd>
              </div>
            )}
            {subscription.currentPeriodEnd && (
              <div>
                <dt>Fin del período</dt>
                <dd>{formatDate(subscription.currentPeriodEnd)}</dd>
              </div>
            )}
          </dl>

          <ul className="quota-list">
            {RESOURCES.map(({ key, label }) => {
              const used = subscription.usage[key];
              const limit = subscription.limits[key];
              const ratio = limit > 0 ? Math.min(1, used / limit) : 1;
              const tone = ratio >= 1 ? 'danger' : ratio >= 0.8 ? 'warning' : 'ok';
              return (
                <li className={`quota quota--${tone}`} key={key}>
                  <div className="quota__header">
                    <strong>{label}</strong>
                    <span>
                      {used} de {limit}
                    </span>
                  </div>
                  <div
                    aria-label={`${label}: ${used} de ${limit}`}
                    aria-valuemax={limit}
                    aria-valuemin={0}
                    aria-valuenow={Math.min(used, limit)}
                    className="quota__bar"
                    role="progressbar"
                  >
                    <span style={{ width: `${Math.round(ratio * 100)}%` }} />
                  </div>
                  <small>
                    {subscription.remaining[key] > 0
                      ? `Capacidad restante: ${subscription.remaining[key]}`
                      : 'Límite alcanzado: no se pueden crear más registros.'}
                  </small>
                </li>
              );
            })}
          </ul>

          <p className="field-hint">
            <Info aria-hidden="true" size={14} /> Almacenamiento ({subscription.plan.storageMb} MB), reportes
            avanzados y acceso API son atributos informativos del plan y todavía no se aplican técnicamente.
            AdminGest no integra pagos: el plan lo asigna un operador y no hay renovación automática.
          </p>
        </>
      )}
    </section>
  );
}
