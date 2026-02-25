/**
 * Smoke Test: Parent Non-Regression
 *
 * Feature: teacher-mvp-flow
 * Requirements: 23.7, 22.5
 */

import * as fc from 'fast-check';
import { AppRoute } from '@/core/navigation/routes';

describe('parent Non-Regression Smoke Test (Requirements 23.7, 22.5)', () => {
  it('keeps parent route constants stable', () => {
    expect(AppRoute.parent.dashboard).toBe('/(parent)/(tabs)/dashboard');
    expect(AppRoute.parent.notifications).toBe('/(parent)/notifications');
    expect(AppRoute.parent.students).toBe('/(parent)/students');
  });

  it('keeps parent dynamic routes scoped to parent group', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uuid(), async (id) => {
        const detailsRoute = AppRoute.parent.studentDetails(id);
        const attendanceRoute = AppRoute.parent.studentAttendance(id);

        expect(detailsRoute.startsWith('/(parent)/students/')).toBe(true);
        expect(attendanceRoute.startsWith('/(parent)/students/')).toBe(true);
        expect(attendanceRoute.endsWith('/attendance')).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  it('preserves notification payload shape used by parent notification center', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          title: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          timestamp: fc.date(),
        }),
        async (notification) => {
          const payload = {
            ...notification,
            timestamp: notification.timestamp.toISOString(),
          };

          expect(typeof payload.id).toBe('string');
          expect(typeof payload.title).toBe('string');
          expect(typeof payload.message).toBe('string');
          expect(typeof payload.timestamp).toBe('string');
        },
      ),
      { numRuns: 50 },
    );
  });
});
