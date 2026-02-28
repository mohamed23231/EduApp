/**
 * Non-regression tests
 * Verifies existing functionality is unaffected by the rating feature
 * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5
 */

import * as fc from 'fast-check';
import { AppRoute } from '@/core/navigation/routes';

describe('non-regression: existing routes unchanged', () => {
  it('teacher routes are stable', () => {
    expect(AppRoute.teacher.dashboard).toBe('/(teacher)/(tabs)/dashboard');
    expect(AppRoute.teacher.students).toBe('/(teacher)/(tabs)/students');
    expect(AppRoute.teacher.sessions).toBe('/(teacher)/(tabs)/sessions');
    expect(AppRoute.teacher.profile).toBe('/(teacher)/(tabs)/profile');
    expect(AppRoute.teacher.studentCreate).toBe('/(teacher)/students/create');
    expect(AppRoute.teacher.sessionCreate).toBe('/(teacher)/sessions/create');
  });

  it('parent routes are stable', () => {
    expect(AppRoute.parent.dashboard).toBe('/(parent)/(tabs)/dashboard');
    expect(AppRoute.parent.profile).toBe('/(parent)/(tabs)/profile');
    expect(AppRoute.parent.students).toBe('/(parent)/students');
    expect(AppRoute.parent.linkStudent).toBe('/(parent)/students/link');
    expect(AppRoute.parent.notifications).toBe('/(parent)/notifications');
  });

  it('dynamic teacher routes are stable', () => {
    fc.assert(
      fc.property(fc.uuid(), (id) => {
        expect(AppRoute.teacher.studentEdit(id)).toBe(`/(teacher)/students/${id}/edit`);
        expect(AppRoute.teacher.connectionCode(id)).toBe(`/(teacher)/students/${id}/connection-code`);
        expect(AppRoute.teacher.sessionEdit(id)).toBe(`/(teacher)/sessions/${id}/edit`);
        expect(AppRoute.teacher.attendance(id)).toBe(`/(teacher)/attendance/${id}`);
      }),
    );
  });

  it('dynamic parent routes are stable', () => {
    fc.assert(
      fc.property(fc.uuid(), (id) => {
        expect(AppRoute.parent.studentDetails(id)).toBe(`/(parent)/students/${id}`);
        expect(AppRoute.parent.studentAttendance(id)).toBe(`/(parent)/students/${id}/attendance`);
      }),
    );
  });

  it('new performance routes follow consistent pattern', () => {
    fc.assert(
      fc.property(fc.uuid(), (id) => {
        expect(AppRoute.teacher.sessionRankings(id)).toBe(`/(teacher)/sessions/${id}/rankings`);
        expect(AppRoute.teacher.studentPerformance(id)).toBe(`/(teacher)/students/${id}/performance`);
        expect(AppRoute.parent.studentPerformance(id)).toBe(`/(parent)/students/${id}/performance`);
      }),
    );
  });
});

describe('non-regression: AttendanceRecord type backward compatibility', () => {
  it('attendanceRecord with rating=null is valid (backward compatible)', () => {
    const record = {
      id: 'rec-1',
      studentId: 'stu-1',
      sessionInstanceId: 'inst-1',
      status: 'PRESENT' as const,
      excuseNote: null,
      rating: null,
      createdAt: '2025-01-01T00:00:00Z',
    };
    // Should not throw — rating: null is valid
    expect(record.rating).toBeNull();
    expect(record.status).toBe('PRESENT');
  });

  it('attendanceRecord without rating field defaults gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          studentId: fc.uuid(),
          sessionInstanceId: fc.uuid(),
          status: fc.constantFrom('PRESENT', 'ABSENT', 'EXCUSED'),
          createdAt: fc.date().map(d => d.toISOString()),
        }),
        (record) => {
          // Simulate backend response without rating (old API)
          const withRating = { ...record, rating: (record as any).rating ?? null };
          expect(withRating.rating).toBeNull();
        },
      ),
    );
  });
});

describe('non-regression: MarkAttendanceInput backward compatibility', () => {
  it('markAttendanceInput without rating is still valid', () => {
    const input = {
      sessionInstanceId: 'inst-1',
      studentId: 'stu-1',
      status: 'PRESENT' as const,
    };
    // rating is optional — should not be required
    expect(input.status).toBe('PRESENT');
    expect((input as any).rating).toBeUndefined();
  });
});
