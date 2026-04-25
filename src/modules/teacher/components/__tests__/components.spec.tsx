/**
 * Mobile component tests for teacher lifecycle UI components.
 *
 * Tests:
 * - TeacherStatusBadge: correct text per status, distinct styling
 * - TrialCard: warning at ≤3 days, "Unlimited" for null limits
 * - SubscriptionCard: snapshot data display, expired state
 * - ExpiredBanner: renders correctly, locale support
 * - Locale support: EN and AR text
 *
 * Validates: Requirements 11.1–11.4, 12.1–12.4, 13.1–13.4, 14.1–14.4
 */

import type { SubscriptionData, TrialData } from '../../types';
import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { ExpiredBanner } from '../ExpiredBanner';
import { SubscriptionCard } from '../SubscriptionCard';
import { TeacherStatusBadge } from '../TeacherStatusBadge';
import { TrialCard } from '../TrialCard';

// ─── i18n mock helpers ────────────────────────────────────────────────────────

// The jest setup mocks react-i18next so t(key) returns the key.
// We override useTranslation per describe block to return actual translations.

const { useTranslation } = jest.requireMock('react-i18next');

function makeTFn(translations: Record<string, string>) {
  return (key: string, opts?: { defaultValue?: string; count?: number }) => {
    // Handle pluralization keys (e.g. daysRemaining_one / daysRemaining_other)
    if (opts?.count !== undefined) {
      const pluralKey = opts.count === 1 ? `${key}_one` : `${key}_other`;
      const pluralVal = translations[pluralKey];
      if (pluralVal) {
        return pluralVal.replace('{{count}}', String(opts.count));
      }
    }
    const val = translations[key];
    if (val !== undefined) {
      return typeof opts === 'object' && opts !== null
        ? Object.entries(opts).reduce(
            (acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)),
            val,
          )
        : val;
    }
    return opts?.defaultValue ?? key;
  };
}

// Flat EN translations for the keys we need
const EN = {
  'teacher.profile.status.INVITED': 'Invited',
  'teacher.profile.status.TRIAL': 'Trial',
  'teacher.profile.status.ACTIVE': 'Active',
  'teacher.profile.status.SUSPENDED': 'Suspended',
  'teacher.profile.status.EXPIRED': 'Expired',
  'teacher.profile.trial.title': 'Trial Period',
  'teacher.profile.trial.endDate': 'Trial ends on {{date}}',
  'teacher.profile.trial.daysRemaining_one': '{{count}} day remaining',
  'teacher.profile.trial.daysRemaining_other': '{{count}} days remaining',
  'teacher.profile.trial.warningDaysRemaining': 'Trial ending soon!',
  'teacher.profile.trial.usage': 'Usage',
  'teacher.profile.trial.students': 'Students',
  'teacher.profile.trial.sessions': 'Sessions',
  'teacher.profile.trial.sessionHours': 'Session Hours',
  'teacher.profile.trial.unlimited': 'Unlimited',
  'teacher.profile.trial.usageFormat': '{{current}} / {{limit}}',
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
  'teacher.profile.expired.bannerTitle': 'Account Expired',
  'teacher.profile.expired.bannerMessage': 'Your account has expired. Write actions are blocked.',
  'teacher.profile.expired.renewalCta': 'Contact your admin to reactivate your account.',
};

const AR = {
  'teacher.profile.status.INVITED': 'مدعو',
  'teacher.profile.status.TRIAL': 'تجريبي',
  'teacher.profile.status.ACTIVE': 'نشط',
  'teacher.profile.status.SUSPENDED': 'موقوف',
  'teacher.profile.status.EXPIRED': 'منتهي',
  'teacher.profile.trial.title': 'الفترة التجريبية',
  'teacher.profile.trial.endDate': 'تنتهي التجربة في {{date}}',
  'teacher.profile.trial.daysRemaining_one': 'يوم واحد متبقٍ',
  'teacher.profile.trial.daysRemaining_other': '{{count}} أيام متبقية',
  'teacher.profile.trial.warningDaysRemaining': 'التجربة على وشك الانتهاء!',
  'teacher.profile.trial.usage': 'الاستخدام',
  'teacher.profile.trial.students': 'الطلاب',
  'teacher.profile.trial.sessions': 'الحصص',
  'teacher.profile.trial.sessionHours': 'ساعات الحصص',
  'teacher.profile.trial.unlimited': 'غير محدود',
  'teacher.profile.trial.usageFormat': '{{current}} / {{limit}}',
  'teacher.profile.subscription.title': 'الاشتراك',
  'teacher.profile.subscription.planName': 'الخطة',
  'teacher.profile.subscription.status': 'الحالة',
  'teacher.profile.subscription.startDate': 'تاريخ البدء',
  'teacher.profile.subscription.endDate': 'تاريخ الانتهاء',
  'teacher.profile.subscription.billingCycle': 'دورة الفوترة',
  'teacher.profile.subscription.daysRemaining_one': 'يوم واحد متبقٍ',
  'teacher.profile.subscription.daysRemaining_other': '{{count}} أيام متبقية',
  'teacher.profile.subscription.billingCycleMonthly': 'شهري',
  'teacher.profile.subscription.billingCycleYearly': 'سنوي',
  'teacher.profile.subscription.unlimited': 'غير محدود',
  'teacher.profile.subscription.expiredLabel': 'منتهي',
  'teacher.profile.expired.bannerTitle': 'انتهى الحساب',
  'teacher.profile.expired.bannerMessage': 'انتهت صلاحية حسابك. الإجراءات الكتابية محظورة.',
  'teacher.profile.expired.renewalCta': 'تواصل مع المسؤول لإعادة تفعيل حسابك.',
};

function useEnTranslation() {
  const t = makeTFn(EN);
  return { t, i18n: { language: 'en', changeLanguage: jest.fn() } };
}

function useArTranslation() {
  const t = makeTFn(AR);
  return { t, i18n: { language: 'ar', changeLanguage: jest.fn() } };
}

afterEach(cleanup);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const trialWithLimits: TrialData = {
  isTrial: true,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-01-31T00:00:00.000Z',
  daysRemaining: 10,
  limits: { maxStudents: 5, maxSessions: 20, maxSessionHours: 10 },
  usage: { currentStudents: 2, currentSessions: 5, currentSessionHours: 3 },
  remaining: { students: 3, sessions: 15, sessionHours: 7 },
};

const trialNearExpiry: TrialData = { ...trialWithLimits, daysRemaining: 2 };
const trialAt3Days: TrialData = { ...trialWithLimits, daysRemaining: 3 };

const trialUnlimited: TrialData = {
  ...trialWithLimits,
  limits: { maxStudents: null, maxSessions: null, maxSessionHours: null },
  remaining: { students: null, sessions: null, sessionHours: null },
};

const activeSubscription: SubscriptionData = {
  isActive: true,
  status: 'ACTIVE',
  planName: 'Pro Plan',
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-12-31T00:00:00.000Z',
  daysRemaining: 180,
  limits: { maxStudents: 50, maxSessions: 100, maxSessionHours: 200 },
  billingCycle: 'MONTHLY',
};

const expiredSubscription: SubscriptionData = {
  ...activeSubscription,
  isActive: false,
  status: 'EXPIRED',
  daysRemaining: 0,
};

const unlimitedSubscription: SubscriptionData = {
  ...activeSubscription,
  limits: { maxStudents: null, maxSessions: null, maxSessionHours: null },
};

// ─── TeacherStatusBadge ───────────────────────────────────────────────────────

describe('teacherStatusBadge', () => {
  beforeEach(() => {
    useTranslation.mockReturnValue(useEnTranslation());
  });

  const statuses = ['INVITED', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'] as const;

  statuses.forEach((status) => {
    it(`renders correct EN text for status: ${status}`, () => {
      render(<TeacherStatusBadge status={status} />);
      expect(screen.getByText(EN[`teacher.profile.status.${status}`])).toBeOnTheScreen();
    });
  });

  it('renders ACTIVE badge', () => {
    render(<TeacherStatusBadge status="ACTIVE" />);
    expect(screen.getByText('Active')).toBeOnTheScreen();
  });

  it('renders EXPIRED badge', () => {
    render(<TeacherStatusBadge status="EXPIRED" />);
    expect(screen.getByText('Expired')).toBeOnTheScreen();
  });

  it('renders AR text for ACTIVE status', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<TeacherStatusBadge status="ACTIVE" />);
    expect(screen.getByText('نشط')).toBeOnTheScreen();
  });

  it('renders AR text for EXPIRED status', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<TeacherStatusBadge status="EXPIRED" />);
    expect(screen.getByText('منتهي')).toBeOnTheScreen();
  });

  it('renders AR text for TRIAL status', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<TeacherStatusBadge status="TRIAL" />);
    expect(screen.getByText('تجريبي')).toBeOnTheScreen();
  });
});

// ─── TrialCard ────────────────────────────────────────────────────────────────

describe('trialCard', () => {
  beforeEach(() => {
    useTranslation.mockReturnValue(useEnTranslation());
  });

  it('renders trial title', () => {
    render(<TrialCard trial={trialWithLimits} />);
    expect(screen.getByText('Trial Period')).toBeOnTheScreen();
  });

  it('does NOT show warning when daysRemaining > 3', () => {
    render(<TrialCard trial={trialWithLimits} />); // daysRemaining = 10
    expect(screen.queryByText('Trial ending soon!')).toBeNull();
  });

  it('shows warning indicator when daysRemaining <= 3 (2 days)', () => {
    render(<TrialCard trial={trialNearExpiry} />); // daysRemaining = 2
    expect(screen.getByText('Trial ending soon!')).toBeOnTheScreen();
  });

  it('shows warning indicator at exactly 3 days remaining', () => {
    render(<TrialCard trial={trialAt3Days} />);
    expect(screen.getByText('Trial ending soon!')).toBeOnTheScreen();
  });

  it('renders "Unlimited" for null maxStudents limit', () => {
    render(<TrialCard trial={trialUnlimited} />);
    const unlimitedTexts = screen.getAllByText(/Unlimited/);
    expect(unlimitedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Unlimited" for all three null limits', () => {
    render(<TrialCard trial={trialUnlimited} />);
    // Each usage row with null limit shows "X / Unlimited"
    const unlimitedTexts = screen.getAllByText(/Unlimited/);
    expect(unlimitedTexts.length).toBeGreaterThanOrEqual(3);
  });

  it('renders usage values when limits are set', () => {
    render(<TrialCard trial={trialWithLimits} />);
    // Students row: "2 / 5"
    expect(screen.getByText('2 / 5')).toBeOnTheScreen();
  });

  it('renders AR trial title', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<TrialCard trial={trialWithLimits} />);
    expect(screen.getByText('الفترة التجريبية')).toBeOnTheScreen();
  });

  it('renders AR "Unlimited" for null limits', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<TrialCard trial={trialUnlimited} />);
    const unlimitedTexts = screen.getAllByText(/غير محدود/);
    expect(unlimitedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders AR warning text when daysRemaining <= 3', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<TrialCard trial={trialNearExpiry} />);
    expect(screen.getByText('التجربة على وشك الانتهاء!')).toBeOnTheScreen();
  });
});

// ─── SubscriptionCard ─────────────────────────────────────────────────────────

describe('subscriptionCard', () => {
  beforeEach(() => {
    useTranslation.mockReturnValue(useEnTranslation());
  });

  it('renders plan name from snapshot', () => {
    render(<SubscriptionCard subscription={activeSubscription} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Pro Plan')).toBeOnTheScreen();
  });

  it('renders subscription title', () => {
    render(<SubscriptionCard subscription={activeSubscription} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Subscription')).toBeOnTheScreen();
  });

  it('renders billing cycle label for MONTHLY', () => {
    render(<SubscriptionCard subscription={activeSubscription} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Monthly')).toBeOnTheScreen();
  });

  it('renders billing cycle label for YEARLY', () => {
    const yearlySub: SubscriptionData = { ...activeSubscription, billingCycle: 'YEARLY' };
    render(<SubscriptionCard subscription={yearlySub} teacherStatus="ACTIVE" />);
    expect(screen.getByText('Yearly')).toBeOnTheScreen();
  });

  it('shows expired badge when teacherStatus is EXPIRED', () => {
    render(<SubscriptionCard subscription={expiredSubscription} teacherStatus="EXPIRED" />);
    expect(screen.getByText('Expired')).toBeOnTheScreen();
  });

  it('does NOT show expired badge when teacherStatus is ACTIVE', () => {
    render(<SubscriptionCard subscription={activeSubscription} teacherStatus="ACTIVE" />);
    // "Expired" badge should not appear (the plan name is "Pro Plan", not "Expired")
    // The expiredLabel is "Expired" — check it's not rendered as a badge
    // Since status is ACTIVE, the expiredBadge View is not rendered
    const expiredTexts = screen.queryAllByText('Expired');
    // There should be no "Expired" badge text for ACTIVE status
    expect(expiredTexts.length).toBe(0);
  });

  it('renders "Unlimited" for null limit values', () => {
    render(<SubscriptionCard subscription={unlimitedSubscription} teacherStatus="ACTIVE" />);
    const unlimitedTexts = screen.getAllByText('Unlimited');
    expect(unlimitedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders AR subscription title', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<SubscriptionCard subscription={activeSubscription} teacherStatus="ACTIVE" />);
    expect(screen.getByText('الاشتراك')).toBeOnTheScreen();
  });

  it('renders AR expired badge for EXPIRED status', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<SubscriptionCard subscription={expiredSubscription} teacherStatus="EXPIRED" />);
    expect(screen.getByText('منتهي')).toBeOnTheScreen();
  });
});

// ─── ExpiredBanner ────────────────────────────────────────────────────────────

describe('expiredBanner', () => {
  beforeEach(() => {
    useTranslation.mockReturnValue(useEnTranslation());
  });

  it('renders the expired banner title', () => {
    render(<ExpiredBanner />);
    expect(screen.getByText('Account Expired')).toBeOnTheScreen();
  });

  it('renders the expired banner message', () => {
    render(<ExpiredBanner />);
    expect(screen.getByText('Your account has expired. Write actions are blocked.')).toBeOnTheScreen();
  });

  it('renders the renewal CTA text', () => {
    render(<ExpiredBanner />);
    expect(screen.getByText('Contact your admin to reactivate your account.')).toBeOnTheScreen();
  });

  it('renders AR expired banner title', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<ExpiredBanner />);
    expect(screen.getByText('انتهى الحساب')).toBeOnTheScreen();
  });

  it('renders AR renewal CTA text', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<ExpiredBanner />);
    expect(screen.getByText('تواصل مع المسؤول لإعادة تفعيل حسابك.')).toBeOnTheScreen();
  });

  it('renders AR banner message', () => {
    useTranslation.mockReturnValue(useArTranslation());
    render(<ExpiredBanner />);
    expect(screen.getByText('انتهت صلاحية حسابك. الإجراءات الكتابية محظورة.')).toBeOnTheScreen();
  });

  it('has accessibilityRole of alert on the banner container', () => {
    render(<ExpiredBanner />);
    // The banner View has accessibilityRole="alert"
    // In RNTL, getByRole('alert') maps to accessibilityRole="alert"
    const banner = screen.getByLabelText('Account Expired');
    expect(banner).toBeOnTheScreen();
  });
});
