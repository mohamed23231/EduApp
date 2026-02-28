/**
 * TrialCard component tests.
 * Tests warning at ≤3 days, "Unlimited" for null limits, usage display.
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */

import type { TrialData } from '../../types';
import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { TrialCard } from '../TrialCard';

const { useTranslation } = jest.requireMock('react-i18next');

const EN: Record<string, string> = {
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
};

const AR: Record<string, string> = {
  'teacher.profile.trial.title': 'الفترة التجريبية',
  'teacher.profile.trial.warningDaysRemaining': 'التجربة على وشك الانتهاء!',
  'teacher.profile.trial.unlimited': 'غير محدود',
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

const baseTrial: TrialData = {
  isTrial: true,
  startDate: '2024-01-01T00:00:00.000Z',
  endDate: '2024-01-31T00:00:00.000Z',
  daysRemaining: 10,
  limits: { maxStudents: 5, maxSessions: 20, maxSessionHours: 10 },
  usage: { currentStudents: 2, currentSessions: 5, currentSessionHours: 3 },
  remaining: { students: 3, sessions: 15, sessionHours: 7 },
};

const trialNearExpiry: TrialData = { ...baseTrial, daysRemaining: 2 };
const trialAt3Days: TrialData = { ...baseTrial, daysRemaining: 3 };
const trialUnlimited: TrialData = {
  ...baseTrial,
  limits: { maxStudents: null, maxSessions: null, maxSessionHours: null },
  remaining: { students: null, sessions: null, sessionHours: null },
};

describe('trialCard', () => {
  beforeEach(() => {
    useTranslation.mockReturnValue({ t: makeTFn(EN), i18n: { language: 'en' } });
  });

  it('renders trial title', () => {
    render(<TrialCard trial={baseTrial} />);
    expect(screen.getByText('Trial Period')).toBeOnTheScreen();
  });

  it('does NOT show warning when daysRemaining > 3', () => {
    render(<TrialCard trial={baseTrial} />);
    expect(screen.queryByText('Trial ending soon!')).toBeNull();
  });

  it('shows warning when daysRemaining is 2 (≤3)', () => {
    render(<TrialCard trial={trialNearExpiry} />);
    expect(screen.getByText('Trial ending soon!')).toBeOnTheScreen();
  });

  it('shows warning at exactly 3 days remaining', () => {
    render(<TrialCard trial={trialAt3Days} />);
    expect(screen.getByText('Trial ending soon!')).toBeOnTheScreen();
  });

  it('renders "Unlimited" for null maxStudents', () => {
    render(<TrialCard trial={trialUnlimited} />);
    const texts = screen.getAllByText(/Unlimited/);
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Unlimited" for all three null limits', () => {
    render(<TrialCard trial={trialUnlimited} />);
    const texts = screen.getAllByText(/Unlimited/);
    expect(texts.length).toBeGreaterThanOrEqual(3);
  });

  it('renders usage values when limits are set', () => {
    render(<TrialCard trial={baseTrial} />);
    expect(screen.getByText('2 / 5')).toBeOnTheScreen();
  });

  it('renders AR title', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<TrialCard trial={baseTrial} />);
    expect(screen.getByText('الفترة التجريبية')).toBeOnTheScreen();
  });

  it('renders AR warning text at ≤3 days', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<TrialCard trial={trialNearExpiry} />);
    expect(screen.getByText('التجربة على وشك الانتهاء!')).toBeOnTheScreen();
  });

  it('renders AR "Unlimited" for null limits', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<TrialCard trial={trialUnlimited} />);
    const texts = screen.getAllByText(/غير محدود/);
    expect(texts.length).toBeGreaterThanOrEqual(1);
  });
});
