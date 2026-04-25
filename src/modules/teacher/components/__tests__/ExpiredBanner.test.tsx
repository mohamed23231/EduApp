/**
 * ExpiredBanner component tests.
 * Tests title, message, CTA, and locale support.
 *
 * Validates: Requirements 14.1, 14.2, 14.4
 */

import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { ExpiredBanner } from '../ExpiredBanner';

const { useTranslation } = jest.requireMock('react-i18next');

const EN: Record<string, string> = {
  'teacher.profile.expired.bannerTitle': 'Account Expired',
  'teacher.profile.expired.bannerMessage': 'Your account has expired. Write actions are blocked.',
  'teacher.profile.expired.renewalCta': 'Contact your admin to reactivate your account.',
};

const AR: Record<string, string> = {
  'teacher.profile.expired.bannerTitle': 'انتهى الحساب',
  'teacher.profile.expired.bannerMessage': 'انتهت صلاحية حسابك. الإجراءات الكتابية محظورة.',
  'teacher.profile.expired.renewalCta': 'تواصل مع المسؤول لإعادة تفعيل حسابك.',
};

function makeTFn(map: Record<string, string>) {
  return (key: string, opts?: { defaultValue?: string }) => map[key] ?? opts?.defaultValue ?? key;
}

afterEach(cleanup);

describe('expiredBanner', () => {
  beforeEach(() => {
    useTranslation.mockReturnValue({ t: makeTFn(EN), i18n: { language: 'en' } });
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

  it('has accessibilityRole of alert', () => {
    render(<ExpiredBanner />);
    expect(screen.getByLabelText('Account Expired')).toBeOnTheScreen();
  });

  it('renders AR banner title', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<ExpiredBanner />);
    expect(screen.getByText('انتهى الحساب')).toBeOnTheScreen();
  });

  it('renders AR banner message', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<ExpiredBanner />);
    expect(screen.getByText('انتهت صلاحية حسابك. الإجراءات الكتابية محظورة.')).toBeOnTheScreen();
  });

  it('renders AR renewal CTA text', () => {
    useTranslation.mockReturnValue({ t: makeTFn(AR), i18n: { language: 'ar' } });
    render(<ExpiredBanner />);
    expect(screen.getByText('تواصل مع المسؤول لإعادة تفعيل حسابك.')).toBeOnTheScreen();
  });
});
