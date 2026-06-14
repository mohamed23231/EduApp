// Feature: auth-baseline-parent-mvp, Property 13: Student Details Display
/**
 * **Validates: Requirements 11.1, 11.2**
 *
 * Property 13: Student Details Display
 *
 * For any StudentDetails object with a fullName field, the student details screen
 * SHALL pass the student to its hero (rendering the name) and the attendance CTA
 * SHALL link to the correct student's attendance route.
 *
 * Phase 8 redesign: the name renders inside StudentHero (stubbed here) and the
 * attendance CTA is queried by its testID.
 */

import type { StudentDetails } from '../../types/student.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import fc from 'fast-check';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAttendanceStats, useAttendanceTimeline, useStudentDetails } from '../../hooks';
import { StudentDetailsScreen } from '../student-details-screen';

jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('@/core/feature-flags/use-feature-flags', () => ({
  useFeatureFlags: () => ({ isParentPerformanceEnabled: false }),
}));
jest.mock('../../components/dashboard', () => {
  const { Text } = require('react-native');
  return {
    TimelineRow: ({ record }: any) => <Text>{record.status}</Text>,
  };
});
jest.mock('../../components/student', () => {
  const { Text } = require('react-native');
  return {
    StudentHero: ({ student }: any) => <Text testID="student-hero-name">{student.fullName}</Text>,
  };
});
jest.mock('@/core/navigation/routes', () => ({
  AppRoute: {
    parent: {
      studentAttendance: (id: string) => `/(parent)/students/${id}/attendance`,
      studentPerformance: (id: string) => `/(parent)/students/${id}/performance`,
    },
  },
}));

const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockT = (key: string, fallback?: string) => fallback ?? key;

function setupHooks(studentDetails: StudentDetails) {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: studentDetails.id });
  (useStudentDetails as jest.Mock).mockReturnValue({ data: studentDetails, isLoading: false, error: null, refetch: jest.fn() });
}

const studentArbitrary = fc.record({
  id: fc.uuid(),
  fullName: fc.string({ minLength: 1 }),
  email: fc.option(fc.emailAddress(), { nil: undefined }),
  phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  gradeLevel: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
  enrollmentDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
});

describe('property 13: Student Details Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT, i18n: { language: 'en' } });
    (useAttendanceStats as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: jest.fn() });
    (useAttendanceTimeline as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: jest.fn() });
  });

  it('property 13: For any StudentDetails with fullName, the name is passed to the hero', () => {
    fc.assert(
      fc.property(studentArbitrary, (studentDetails: StudentDetails) => {
        setupHooks(studentDetails);
        render(<StudentDetailsScreen />);
        expect(screen.getByTestId('student-hero-name').props.children).toBe(studentDetails.fullName);
      }),
      { numRuns: 100 },
    );
  });

  it('property 13: Attendance navigation button links to correct student attendance route', () => {
    fc.assert(
      fc.property(studentArbitrary, (studentDetails: StudentDetails) => {
        setupHooks(studentDetails);
        render(<StudentDetailsScreen />);
        fireEvent.press(screen.getByTestId('view-attendance-button'));
        expect(mockRouter.push).toHaveBeenCalledWith(`/(parent)/students/${studentDetails.id}/attendance`);
      }),
      { numRuns: 100 },
    );
  });

  it('property 13: Attendance button is always present in success state', () => {
    fc.assert(
      fc.property(studentArbitrary, (studentDetails: StudentDetails) => {
        setupHooks(studentDetails);
        render(<StudentDetailsScreen />);
        expect(screen.getByTestId('view-attendance-button')).toBeTruthy();
      }),
      { numRuns: 100 },
    );
  });
});
