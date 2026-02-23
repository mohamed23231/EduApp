// Feature: auth-baseline-parent-mvp, Property 10: Attendance Record Rendering
/**
 * **Validates: Requirements 12.2, 12.6**
 *
 * Property 10: Attendance Record Rendering
 *
 * For any AttendanceRecord object with a sessionDate, sessionName, and status,
 * the attendance screen's rendered output SHALL contain all three fields.
 * The status SHALL be mapped to one of the four localized labels:
 * Present, Absent, Excused, or Not Marked.
 */

import type { AttendanceRecord, AttendanceStatus } from '../../types/student.types';
import { describe, expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import fc from 'fast-check';
import { useTranslation } from 'react-i18next';
import { StudentAttendanceScreen } from '../student-attendance-screen';

// Mock the dependencies
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ id: 'test-student-id' })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('../../hooks', () => ({
  useAttendance: jest.fn(),
}));

jest.mock('../../services/error-utils', () => ({
  extractErrorMessage: jest.fn((_error, t) => t('parent.common.genericError')),
}));

// eslint-disable-next-line max-lines-per-function
describe('Property 10: Attendance Record Rendering', () => {
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      'parent.attendance.statusPresent': 'Present',
      'parent.attendance.statusAbsent': 'Absent',
      'parent.attendance.statusExcused': 'Excused',
      'parent.attendance.statusNotMarked': 'Not Marked',
      'parent.attendance.emptyMessage': 'No attendance records available.',
      'parent.common.retry': 'Retry',
    };
    return translations[key] || key;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
  });

  // Generator for valid AttendanceRecord objects
  const attendanceRecordArbitrary = (): fc.Arbitrary<AttendanceRecord> => {
    return fc.tuple(
      fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
      fc.string({ minLength: 1, maxLength: 100 }),
      fc.oneof(
        fc.constant<AttendanceStatus>('PRESENT'),
        fc.constant<AttendanceStatus>('ABSENT'),
        fc.constant<AttendanceStatus>('EXCUSED'),
        fc.constant<AttendanceStatus>('NOT_MARKED'),
      ),
    ).map(([date, sessionName, status]) => ({
      sessionDate: Number.isNaN(date.getTime())
        ? '2020-01-01'
        : date.toISOString().split('T')[0],
      sessionName,
      status,
    }));
  };

  test('Property 10: All three fields (sessionDate, sessionName, status) are rendered', () => {
    const { useAttendance } = require('../../hooks');

    fc.assert(
      fc.property(attendanceRecordArbitrary(), (record) => {
        useAttendance.mockReturnValue({
          data: [record],
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        });

        render(<StudentAttendanceScreen />);

        // Verify all three fields are present in the rendered output
        expect(screen.getByText(record.sessionName)).toBeDefined();
        expect(screen.getByText(record.sessionDate)).toBeDefined();

        // Verify status is rendered (will be mapped to localized label)
        const statusMap: Record<AttendanceStatus, string> = {
          PRESENT: 'Present',
          ABSENT: 'Absent',
          EXCUSED: 'Excused',
          NOT_MARKED: 'Not Marked',
        };
        expect(screen.getByText(statusMap[record.status])).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  test('Property 10: Status is mapped to one of the four localized labels', () => {
    const { useAttendance } = require('../../hooks');
    const validLabels = ['Present', 'Absent', 'Excused', 'Not Marked'];

    fc.assert(
      fc.property(attendanceRecordArbitrary(), (record) => {
        useAttendance.mockReturnValue({
          data: [record],
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        });

        render(<StudentAttendanceScreen />);

        // Verify the status is mapped to one of the valid localized labels
        const statusMap: Record<AttendanceStatus, string> = {
          PRESENT: 'Present',
          ABSENT: 'Absent',
          EXCUSED: 'Excused',
          NOT_MARKED: 'Not Marked',
        };
        const expectedLabel = statusMap[record.status];

        expect(validLabels).toContain(expectedLabel);
        expect(screen.getByText(expectedLabel)).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  test('Property 10: Multiple records all render with complete field information', () => {
    const { useAttendance } = require('../../hooks');

    fc.assert(
      fc.property(
        fc.array(attendanceRecordArbitrary(), { minLength: 1, maxLength: 10 }),
        (records) => {
          useAttendance.mockReturnValue({
            data: records,
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          });

          render(<StudentAttendanceScreen />);

          // Verify each record's fields are rendered
          records.forEach((record) => {
            expect(screen.getAllByText(record.sessionName).length).toBeGreaterThan(0);
            expect(screen.getAllByText(record.sessionDate).length).toBeGreaterThan(0);

            const statusMap: Record<AttendanceStatus, string> = {
              PRESENT: 'Present',
              ABSENT: 'Absent',
              EXCUSED: 'Excused',
              NOT_MARKED: 'Not Marked',
            };
            expect(screen.getAllByText(statusMap[record.status]).length).toBeGreaterThan(0);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  test('Property 10: Status mapping is consistent across all four status values', () => {
    const { useAttendance } = require('../../hooks');
    const statusMap: Record<AttendanceStatus, string> = {
      PRESENT: 'Present',
      ABSENT: 'Absent',
      EXCUSED: 'Excused',
      NOT_MARKED: 'Not Marked',
    };

    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant<AttendanceStatus>('PRESENT'),
          fc.constant<AttendanceStatus>('ABSENT'),
          fc.constant<AttendanceStatus>('EXCUSED'),
          fc.constant<AttendanceStatus>('NOT_MARKED'),
        ),
        (status) => {
          const record: AttendanceRecord = {
            sessionDate: '2024-01-15',
            sessionName: 'Math Class',
            status,
          };

          useAttendance.mockReturnValue({
            data: [record],
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          });

          render(<StudentAttendanceScreen />);

          // Verify the correct label is rendered for each status
          const expectedLabel = statusMap[status];
          expect(screen.getByText(expectedLabel)).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
