import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { api } from '../api/client';
import { Entity, EntityPage } from '../components/EntityPage';

interface Activity extends Entity {
  subject: string;
  type: string;
  status: string;
  scheduledAt: string;
  customer?: { name: string };
}

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const activityFields = [
  { name: 'subject', label: 'Asunto', required: true },
  {
    name: 'type',
    label: 'Tipo',
    type: 'select' as const,
    required: true,
    options: [
      { value: 'CALL', label: 'Llamada' },
      { value: 'EMAIL', label: 'Correo' },
      { value: 'MEETING', label: 'Reunión' },
      { value: 'VISIT', label: 'Visita' },
      { value: 'TASK', label: 'Tarea' },
      { value: 'FOLLOW_UP', label: 'Seguimiento' },
    ],
  },
  { name: 'scheduledAt', label: 'Fecha y hora', type: 'datetime-local' as const, required: true },
  {
    name: 'customerId',
    label: 'Cliente',
    type: 'select' as const,
    optionsEndpoint: '/customers',
    optionLabel: (item: Entity) => String(item.name),
  },
  {
    name: 'status',
    label: 'Estado',
    type: 'select' as const,
    options: [
      { value: 'PENDING', label: 'Pendiente' },
      { value: 'COMPLETED', label: 'Completada' },
      { value: 'CANCELLED', label: 'Cancelada' },
    ],
  },
  { name: 'description', label: 'Descripción', type: 'textarea' as const },
];

export function ActivitiesPage() {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const activities = useQuery({
    queryKey: ['/activities'],
    queryFn: () => api<Activity[]>('/activities'),
  });

  const calendarDays = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const last = new Date(year, monthIndex + 1, 0);
    const leading = (first.getDay() + 6) % 7;
    const totalCells = Math.ceil((leading + last.getDate()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const date = new Date(year, monthIndex, index - leading + 1);
      const dayActivities = (activities.data ?? []).filter((activity) => {
        const activityDate = new Date(activity.scheduledAt);
        return activityDate.toDateString() === date.toDateString();
      });
      return { date, currentMonth: date.getMonth() === monthIndex, activities: dayActivities };
    });
  }, [activities.data, month]);

  const renderViewSwitcher = () => (
    <div className="view-switcher" role="group" aria-label="Vista de actividades">
      <button
        className={view === 'table' ? 'active' : ''}
        onClick={() => setView('table')}
        type="button"
      >
        <List size={17} /> Lista
      </button>
      <button
        className={view === 'calendar' ? 'active' : ''}
        onClick={() => setView('calendar')}
        type="button"
      >
        <CalendarDays size={17} /> Calendario
      </button>
    </div>
  );

  const entityPage = (
    <EntityPage
      headerActions={renderViewSwitcher()}
      columns={[
        {
          label: 'Actividad',
          exportValue: (item) => String(item.subject),
          render: (item) => (
            <span className="primary-cell">
              <strong>{String(item.subject)}</strong>
              <small>{String(item.type).replaceAll('_', ' ')}</small>
            </span>
          ),
        },
        {
          label: 'Fecha',
          exportValue: (item) => new Date(String(item.scheduledAt)).toLocaleString('es-DO'),
          render: (item) =>
            new Intl.DateTimeFormat('es-DO', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(String(item.scheduledAt))),
        },
        {
          label: 'Cliente',
          exportValue: (item) => String((item.customer as Entity | undefined)?.name ?? ''),
          render: (item) => String((item.customer as Entity | undefined)?.name ?? '—'),
        },
        {
          label: 'Estado',
          exportValue: (item) => String(item.status),
          render: (item) => <span className="status-badge">{String(item.status)}</span>,
        },
      ]}
      description={
        view === 'table'
          ? 'Planifica llamadas, reuniones, visitas y seguimientos.'
          : 'Visualiza reuniones, llamadas, visitas y seguimientos por día.'
      }
      endpoint="/activities"
      fields={activityFields}
      singular="actividad"
      title={view === 'table' ? 'Actividades' : 'Calendario de actividades'}
    />
  );

  if (view === 'table') return entityPage;

  return (
    <>
      <div className="entity-page-controller-only">{entityPage}</div>

      <section className="page calendar-page custom-view-content">
        <div className="calendar-controls calendar-controls--standalone">
          <button
            aria-label="Mes anterior"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            type="button"
          >
            <ChevronLeft size={18} />
          </button>
          <strong>
            {new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' }).format(month)}
          </strong>
          <button
            aria-label="Mes siguiente"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            type="button"
          >
            <ChevronRight size={18} />
          </button>
          <button
            className="secondary-button"
            onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            type="button"
          >
            Hoy
          </button>
        </div>

        <div className="calendar-grid calendar-weekdays">
          {weekDays.map((day) => <strong key={day}>{day}</strong>)}
        </div>
        <div className="calendar-grid calendar-body">
          {calendarDays.map(({ date, currentMonth, activities: dayItems }) => (
            <article className={currentMonth ? 'calendar-day' : 'calendar-day muted'} key={date.toISOString()}>
              <time>{date.getDate()}</time>
              <div>
                {dayItems.slice(0, 4).map((item) => (
                  <span
                    className={`calendar-event calendar-event--${item.type.toLowerCase()}`}
                    key={item.id}
                    title={`${item.subject} · ${item.customer?.name ?? ''}`}
                  >
                    <b>
                      {new Intl.DateTimeFormat('es-DO', { hour: 'numeric', minute: '2-digit' }).format(
                        new Date(item.scheduledAt),
                      )}
                    </b>
                    {item.subject}
                  </span>
                ))}
                {dayItems.length > 4 && <small>+{dayItems.length - 4} actividades</small>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
