const labels: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  QUALIFIED: 'Calificado',
  DISQUALIFIED: 'Descartado',
  CONVERTED: 'Convertido',
  OPEN: 'Abierta',
  WON: 'Ganada',
  LOST: 'Perdida',
  PLANNED: 'Planificado',
  ACTIVE: 'Activo',
  ON_HOLD: 'En pausa',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  BLOCKED: 'Bloqueado',
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  RECEIVED: 'Recibida',
  REGISTERED: 'Registrado',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase()}`}>{labels[status] ?? status}</span>;
}
