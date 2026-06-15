import type { TFunction } from 'i18next';
import type { Notification } from '../../services/notifications.service';

function getCategory(dateString: string, t: TFunction): string {
  const date = new Date(dateString);
  const now = new Date();

  // Set to midnight for accurate day comparison
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = Math.abs(dNow.getTime() - dDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0)
    return t('parent.notifications.today', 'Today');
  if (diffDays === 1)
    return t('parent.notifications.yesterday', 'Yesterday');
  if (diffDays <= 7)
    return t('parent.notifications.thisWeek', 'This Week');
  return t('parent.notifications.earlier', 'Earlier');
}

export type NotificationSection = { title: string; data: Notification[] };

export function buildNotificationSections(
  notifications: Notification[],
  t: TFunction,
): NotificationSection[] {
  if (!notifications)
    return [];

  const groups = new Map<string, Notification[]>();
  notifications.forEach((n) => {
    const category = getCategory(n.createdAt, t);
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(n);
  });

  const categories = [
    t('parent.notifications.today', 'Today'),
    t('parent.notifications.yesterday', 'Yesterday'),
    t('parent.notifications.thisWeek', 'This Week'),
    t('parent.notifications.earlier', 'Earlier'),
  ];

  const result: NotificationSection[] = [];
  categories.forEach((cat) => {
    if (groups.has(cat)) {
      result.push({ title: cat, data: groups.get(cat)! });
    }
  });

  return result;
}
