export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  path: string;
  eventType: string;
  readAt: string | null;
  createdAt: string;
}

/** Shared by the topbar bell and the inbox so both always show the same state. */
export const NOTIFICATIONS_KEY = ['/notifications'];

/** Internal paths only: notifications never navigate to external URLs. */
export const internalPath = (path: string) =>
  path.startsWith('/') && !path.startsWith('//') ? path : '/';
