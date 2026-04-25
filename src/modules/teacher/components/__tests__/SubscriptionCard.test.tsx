/**
 * SubscriptionCard component tests.
 * Tests snapshot data display, expired state, "Unlimited" for null limits.
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 */

import type { SubscriptionData } from '../../types';
import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { SubscriptionCard } from '../SubscriptionCard';

const { useTranslation } = jest.requireMock('react-i18next');

const EN: Record<string, string> = {
  'teacher.profile.subscription.title': 'Subscription',
  'teacher.profile.subscription.planName': 'Plan',
  'teacher.profile.subscription.status': 'Status',
  'teacher.profile.subscription.startDate': 'Start Date',
  'teacher.profile.subscription.endDate': 'End Date',
  'teacher.profile.subscription.billingCycle': 'Billing Cycle',
  'teacher.profile.subscription.daysRemaining_one': '{{count}} day remaining',
  'teacher.profile.subscription.daysRemaining_other': '{{count}} days remaining',
  'teacher.profile.subscription.billingCycleMonthly': 'Monthly',
  'teacher.profile.subscription.billingCycleYearly': 'Yearly',
  'teacher.profile.subscription.unlimited': 'Unlimited',
  'teacher.profile.subscription.expiredLabel': 'Expired',
  'teacher.profile.trial.students': 'Students',
  'teacher.profile.trial.sessions': 'Sessions',
  'teacher.profile.trial.sessionHours': 'Session Hours',
};

const AR: Record<string, string> = {
  'teacher.profile.subscription.title': 'الاشتراك',
  'teacher.profile.subscription.expiredLabel': 'منتهي',
  'teacher.profile.subscription.billingCycleMonthly': 'شهري',
  'teacher.profile.subscription.unlimited': 'غير محدود',
  'teacher.profile.trial.students': 'الطلاب',
  'teacher.profile.trial.sessions': 'الحصص',
  'teacher.profile.trial.sessionHours': 'ساعات الحصص',
};

function makeTFn(map: Record<string, string>) {
  return (key: string, opts?: { defaultValue?: string; count?: number; [k: string]: unknown }) => {
    if (opts?.count !== undefined) {
      const pluralKey = opts.count === 1 ? `${key}_one` : `${key}_other`;
      const val = map[pluralKey];
      if (val)
        return val.replace('{{count}}', String(opts.count));
    }
    const val = map[key];
    if (val !== undefined && opts) {
      return Object.entries(opts).reduce(
        (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
        val,
      );
    }
    return val ?? opts?.defaultValue ?? key;
  };
}

afterEach(cleanup);

const activeSub: SubscriptionData = {
  isActive: true,
  status: 'ACTIVE',
  planName: 'Pro Plan',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T00:00:00.000Z',
  daysRemaining: 180,
  limits: { maxStudents: 50, maxSessions: 100, maxSessionHours: 200 },
  billingCycle: 'MONTHLY',
};

const expiredSub: SubscriptionData = { ...activeSub, isActive: false, status: 'EXPIRED', daysRemaining: 0 };
const unlimitedSub: SubscriptionData = {
  ...activeSub,
  limits: { maxStudents: null, maxSessions: null, maxSessionHours: null },
};

describe('subscriptionCard', () => {
  beforeEach(() => {
    useTranslation.mockReturnValue({ t: makeTFn(EN), i18n: { language: 'en' } });
  });

  it('renders plan name from snapshot', () => {
    render(<SubscriptionCard subscription={activeSub} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Pro Plan')).toBeOnTheScreen();
  });

  it('renders subscription title', () => {
    render(<SubscriptionCard subscription={activeSub} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Subscription')).toBeOnTheScreen();
  });

  it('renders MONTHLY billing cycle label', () => {
    render(<SubscriptionCard subscription={activeSub} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Monthly')).toBeOnTheScreen();
  });

  it('renders YEARLY billing cycle label', () => {
    const yearlySub: SubscriptionData = { ...activeSub, billingCycle: 'YEARLY' };
    render(<SubscriptionCard subscription={yearlySub} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Yearly')).toBeOnTheScreen();
  });

  it('shows expired badge when teacherStatus is EXPIRED', () => {
    render(<SubscriptionCard subscription={expiredSub} teacherStatus="EXPIRED" />);
    expect(screen.getByText('Expired')).toBeOnTheScreen();
  });

  it('does NOT show expired badge for ACTIVE teacher', () => {
    render(<SubscriptionCard subscription={activeSub} teacherStatus="ACTIVE" />);
    expect(screen.queryAllByText('Expired').length).toBe(0);
  });

  it('renders "Unlimited" for null limit values', () => {
    render(<SubscriptionCard subscription={unlimitedSub} teacherStatus="ACTIVE" />);
    const texts = screen.getAllByText('Unlimited');
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders AR subscription title', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<SubscriptionCard subscription={activeSub} teacherStatus="ACTIVE" />);
    expect(screen.getByText('الاشتراك')).toBeOnTheScreen();
  });

  it('renders AR expired badge for EXPIRED status', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<SubscriptionCard subscription={expiredSub} teacherStatus="EXPIRED" />);
    expect(screen.getByText('منتهي')).toBeOnTheScreen();
  });
});
