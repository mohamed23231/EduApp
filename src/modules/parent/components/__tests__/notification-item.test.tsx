/**
 * Tests for NotificationItem relative-time localization.
 *
 * Regression guard: `formatDate` previously returned hardcoded English
 * relative-time strings ("Just now", "5m ago", ...). Arabic is the default
 * locale, so those strings leaked English into the RTL Arabic UI. These tests
 * assert the relative time is produced via the i18n `t()` keys, not literals.
 */

import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NotificationItem } from '../notification-item';

jest.mock('react-i18next');

const TIME_KEYS = {
  'parent.notifications.time.justNow': 'وصل الآن',
  'parent.notifications.time.minutesAgo': 'منذ {{count}} د',
  'parent.notifications.time.hoursAgo': 'منذ {{count}} س',
  'parent.notifications.time.daysAgo': 'منذ {{count}} يوم',
} as const;

// Minimal Arabic-locale `t`: resolves the time keys with {{count}} interpolation
// and returns the key for everything else (so title/body fall back, irrelevant here).
function arabicT(key: string, fallback?: unknown, options?: { count?: number }): string {
  const opts = (typeof fallback === 'object' && fallback !== null ? fallback : options) as
    | { count?: number }
    | undefined;
  const template = (TIME_KEYS as Record<string, string>)[key];
  if (template == null)
    return key;
  if (opts?.count != null)
    return template.replace('{{count}}', String(opts.count));
  return template;
}

function makeNotification(createdAt: string) {
  return {
    id: 'n1',
    notificationType: 'ABSENCE',
    titleKey: 'notification.absence.title',
    bodyKey: 'notification.absence.body',
    bodyParams: {},
    status: 'UNREAD' as const,
    createdAt,
    readAt: null,
    deepLink: '',
  };
}

describe('notificationItem relative time localization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({
      t: arabicT,
      i18n: { language: 'ar' },
    });
  });

  it('renders "just now" via the i18n key (not hardcoded English)', () => {
    render(
      <NotificationItem notification={makeNotification(new Date().toISOString())} onPress={() => {}} />,
    );

    expect(screen.getByText('وصل الآن')).toBeTruthy();
    expect(screen.queryByText('Just now')).toBeNull();
  });

  it('renders minutes-ago via the i18n key with count interpolation', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    render(
      <NotificationItem notification={makeNotification(fiveMinAgo)} onPress={() => {}} />,
    );

    expect(screen.getByText('منذ 5 د')).toBeTruthy();
    expect(screen.queryByText('5m ago')).toBeNull();
  });

  it('renders hours-ago via the i18n key with count interpolation', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3_600_000).toISOString();
    render(
      <NotificationItem notification={makeNotification(threeHoursAgo)} onPress={() => {}} />,
    );

    expect(screen.getByText('منذ 3 س')).toBeTruthy();
    expect(screen.queryByText('3h ago')).toBeNull();
  });

  it('renders days-ago via the i18n key with count interpolation', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    render(
      <NotificationItem notification={makeNotification(twoDaysAgo)} onPress={() => {}} />,
    );

    expect(screen.getByText('منذ 2 يوم')).toBeTruthy();
    expect(screen.queryByText('2d ago')).toBeNull();
  });
});
