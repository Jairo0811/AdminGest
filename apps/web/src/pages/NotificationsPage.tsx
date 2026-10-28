import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  path: string;
  eventType: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsPage() {
  const client = useQueryClient();
  const notifications = useQuery({
    queryKey: ['/notifications'],
    queryFn: () => api<Notification[]>('/notifications'),
    refetchInterval: 60_000,
  });

  const read = useMutation({
    mutationFn: (id: string) => api('/notifications/' + id + '/read', { method: 'PATCH' }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['/notifications'] });
    },
  });

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Centro de comunicaciones</p>
          <h1>Notificaciones</h1>
          <p>Alertas de asignaciones, actividades y cotizaciones de tu empresa.</p>
        </div>
      </div>
      <div className="panel">
        {notifications.isLoading && <p>Cargando notificaciones…</p>}
        {notifications.error && <p role="alert">{(notifications.error as Error).message}</p>}
        {notifications.data?.length === 0 && <p>Todavía no tienes notificaciones.</p>}
        <ul>
          {notifications.data?.map((item) => (
            <li key={item.id} style={{ padding: '12px 0' }}>
              <Bell size={16} aria-hidden="true" />{' '}
              <strong>{item.title}</strong>{' '}
              {!item.readAt && <span aria-label="Sin leer">●</span>}
              <p>{item.message}</p>
              <small>{new Date(item.createdAt).toLocaleString('es-DO')}</small>{' '}
              <Link to={item.path}>Abrir</Link>{' '}
              {!item.readAt && (
                <button className="text-button" type="button" disabled={read.isPending}
                  onClick={() => read.mutate(item.id)}>
                  <Check size={15} /> Marcar leída
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
