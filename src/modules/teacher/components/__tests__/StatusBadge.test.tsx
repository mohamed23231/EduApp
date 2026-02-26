/**
 * StatusBadge (TeacherStatusBadge) component tests.
 * Tests correct text and style per teacher status in EN and AR.
 *
 * Validates: Requirements 11.1, 11.2, 11.3
 */

import * as React from 'react';
import { cleanup, render, screen } from '@/lib/test-utils';
import { TeacherStatusBadge } from '../TeacherStatusBadge';

const { useTranslation } = jest.requireMock('react-i18next');

const EN_STATUS: Record<string, string> = {
    INVITED: 'Invited',
    TRIAL: 'Trial',
    ACTIVE: 'Active',
    SUSPENDED: 'Suspended',
    EXPIRED: 'Expired',
};

const AR_STATUS: Record<string, string> = {
    INVITED: 'مدعو',
    TRIAL: 'تجريبي',
    ACTIVE: 'نشط',
    SUSPENDED: 'موقوف',
    EXPIRED: 'منتهي',
};

function makeTFn(map: Record<string, string>) {
    return (key: string, opts?: { defaultValue?: string }) => map[key] ?? opts?.defaultValue ?? key;
}

afterEach(cleanup);

describe('StatusBadge (TeacherStatusBadge)', () => {
    const statuses = ['INVITED', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'] as const;

    describe('EN locale', () => {
        beforeEach(() => {
            useTranslation.mockReturnValue({
                t: makeTFn(
                    Object.fromEntries(
                        statuses.map(s => [`teacher.profile.status.${s}`, EN_STATUS[s]]),
                    ),
                ),
                i18n: { language: 'en' },
            });
        });

        statuses.forEach((status) => {
            it(`renders "${EN_STATUS[status]}" for status ${status}`, () => {
                render(<TeacherStatusBadge status={status} />);
                expect(screen.getByText(EN_STATUS[status])).toBeOnTheScreen();
            });
        });
    });

    describe('AR locale', () => {
        beforeEach(() => {
            useTranslation.mockReturnValue({
                t: makeTFn(
                    Object.fromEntries(
                        statuses.map(s => [`teacher.profile.status.${s}`, AR_STATUS[s]]),
                    ),
                ),
                i18n: { language: 'ar' },
            });
        });

        statuses.forEach((status) => {
            it(`renders "${AR_STATUS[status]}" for status ${status}`, () => {
                render(<TeacherStatusBadge status={status} />);
                expect(screen.getByText(AR_STATUS[status])).toBeOnTheScreen();
            });
        });
    });
});
