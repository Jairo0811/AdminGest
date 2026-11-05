import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Check, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { internalPath, NotificationItem, NOTIFICATIONS_KEY } from '../api/notifications';

const EVENT_LABELS: Record<string, string> = {
  ACTIVITY_ASSIGNED: 'Actividad asignada',
  PROJECT_ASSIGNED: 'Proyecto asignado',
  ACTIVITY_DUE: 'Actividad próxima',
  QUOTE_EXPIRING: 'Cotización por vencer',
};

type Filter = 'all' | 'unread' | 'read';


export function NotificationsPage() {
  const client = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const notifications = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => api<NotificationItem[]>('/notifications'),
    refetchInterval: 60_000,
  });

  const markRead = (readIds: (items: NotificationItem[]) => Set<string>) =>
    client.setQueryData<NotificationItem[]>(NOTIFICATIONS_KEY, (items) => {
      if (!items) return items;
      const ids = readIds(items);
      const now = new Date().toISOString();
      return items.map((item) => (ids.has(item.id) && !item.readAt ? { ...item, readAt: now } : item));
    });

  const read = useMutation({
    mutationFn: (id: string) => api('/notifications/' + id + '/read', { method: 'PATCH' }),
    onSuccess: (_result, id) => {
      markRead(() => new Set([id]));
      void client.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
  const readAll = useMutation({
    mutationFn: () => api<{ updated: number }>('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      markRead((items) => new Set(items.map((item) => item.id)));
      void client.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });

  const items = useMemo(() => notifications.data ?? [], [notifications.data]);
  const unread = items.filter((item) => !item.readAt).length;
  const visible = items.filter((item) =>
    filter === 'all' ? true : filter === 'unread' ? !item.readAt : Boolean(item.readAt),
  );
  const mutationError = (read.error ?? readAll.error) as Error | null;

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Centro de comunicaciones</p>
          <h1>Notificaciones</h1>
          <p>Alertas de asignaciones, actividades y cotizaciones dirigidas a tu usuario.</p>
        </div>
        <div className="page-heading-actions">
          <button
            className="secondary-button"
            disabled={!unread || readAll.isPending}
            onClick={() => readAll.mutate()}
            type="button"
          >
            <CheckCheck aria-hidden="true" size={17} /> {readAll.isPending ? 'Marcando…' : 'Marcar todas como leídas'}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h2>
              <Bell aria-hidden="true" size={19} /> Bandeja
            </h2>
            <p aria-live="polite">{unread ? `${unread} sin leer de ${items.length}` : `${items.length} notificaciones, todas leídas`}</p>
          </div>
          <div aria-label="Filtrar notificaciones" className="segmented" role="group">
            {(
              [
                ['all', 'Todas'],
                ['unread', `Sin leer (${unread})`],
                ['read', 'Leídas'],
              ] as const
            ).map(([value, label]) => (
              <button aria-pressed={filter === value} key={value} onClick={() => setFilter(value)} type="button">
                {label}
              </button>
            ))}
          </div>
        </div>

        {mutationError && (
          <div className="alert error" role="alert">
            {mutationError.message}
          </div>
        )}
        {notifications.isLoading && (
          <p className="muted-state" role="status">
            Cargando notificaciones…
          </p>
        )}
        {notifications.isError && (
          <div className="empty-state empty-state--error" role="alert">
            <strong>No fue posible cargar las notificaciones</strong>
            <p>{(notifications.error as Error).message}</p>
            <button className="secondary-button" onClick={() => void notifications.refetch()} type="button">
              <RefreshCw aria-hidden="true" size={16} /> Reintentar
            </button>
          </div>
        )}
        {notifications.isSuccess && visible.length === 0 && (
          <div className="empty-state">
            <strong>
              {items.length === 0
                ? 'Todavía no tienes notificaciones'
                : filter === 'unread'
                  ? 'No tienes notificaciones sin leer'
                  : 'No hay notificaciones leídas'}
            </strong>
            <p>Las asignaciones y los recordatorios aparecerán aquí automáticamente.</p>
          </div>
        )}

        <ul className="item-list">
          {visible.map((item) => (
            <li className={item.readAt ? 'item-row' : 'item-row item-row--unread'} key={item.id}>
              <span aria-hidden="true" className="item-row__icon">
                <Bell size={17} />
              </span>
              <div className="item-row__body">
                <strong>
                  {item.title}
                  {!item.readAt && (
                    <>
                      <span aria-hidden="true" className="unread-dot" />
                      <span className="sr-only"> (sin leer)</span>
                    </>
                  )}
                </strong>
                <p>{item.message}</p>
                <small>
                  {EVENT_LABELS[item.eventType] ?? item.eventType} ·{' '}
                  <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('es-DO')}</time>
                </small>
              </div>
              <div className="item-row__actions">
                <Link
                  className="secondary-button compact"
                  onClick={() => {
                    if (!item.readAt) read.mutate(item.id);
                  }}
                  to={internalPath(item.path)}
                >
                  Abrir
                </Link>
                {!item.readAt && (
                  <button
                    aria-label={`Marcar como leída: ${item.title}`}
                    className="secondary-button compact"
                    disabled={read.isPending && read.variables === item.id}
                    onClick={() => read.mutate(item.id)}
                    type="button"
                  >
                    <Check aria-hidden="true" size={15} /> Leída
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
