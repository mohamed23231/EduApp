// Feature: auth-baseline-parent-mvp, Property 13: Student Details Display
/**
 * **Validates: Requirements 11.1, 11.2**
 *
 * Property 13: Student Details Display
 *
 * For any StudentDetails object with a fullName field, the student details screen
 * SHALL render the student's name. If a navigation action to attendance is present,
 * it SHALL link to the correct student's attendance route.
 */

import type { StudentDetails } from '../../types/student.types';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import fc from 'fast-check';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useStudentDetails } from '../../hooks';
import { StudentDetailsScreen } from '../student-details-screen';

// Mock dependencies
jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('@/core/navigation/routes', () => ({
  AppRoute: {
    parent: {
      studentAttendance: (id: string) => `/(parent)/students/${id}/attendance`,
    },
  },
}));

const mockRouter = {
  push: jest.fn(),
};

const mockT = (key: string) => key;

// eslint-disable-next-line max-lines-per-function
describe('property 13: Student Details Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
  });

  it('property 13: For any StudentDetails with fullName, the name is rendered', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          fullName: fc.string({ minLength: 1 }),
          email: fc.option(fc.emailAddress(), { nil: undefined }),
          phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          gradeLevel: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          enrollmentDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        }),
        (studentDetails: StudentDetails) => {
          (useLocalSearchParams as jest.Mock).mockReturnValue({ id: studentDetails.id });
          (useStudentDetails as jest.Mock).mockReturnValue({
            data: studentDetails,
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          });

          render(<StudentDetailsScreen />);

          // Core property: student name must be rendered
          expect(screen.getAllByText(studentDetails.fullName).length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('property 13: Attendance navigation button links to correct student attendance route', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          fullName: fc.string({ minLength: 1 }),
          email: fc.option(fc.emailAddress(), { nil: undefined }),
          phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          gradeLevel: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          enrollmentDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        }),
        (studentDetails: StudentDetails) => {
          (useLocalSearchParams as jest.Mock).mockReturnValue({ id: studentDetails.id });
          (useStudentDetails as jest.Mock).mockReturnValue({
            data: studentDetails,
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          });

          render(<StudentDetailsScreen />);

          // Find and press the attendance button
          const attendanceButton = screen.getByText('parent.studentDetails.viewAttendance');
          fireEvent.press(attendanceButton);

          // Verify navigation to correct student's attendance route
          expect(mockRouter.push).toHaveBeenCalledWith(
            `/(parent)/students/${studentDetails.id}/attendance`,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('property 13: Student name is always rendered regardless of optional fields', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.uuid(),
          fc.string({ minLength: 1 }),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
          fc.boolean(),
        ),
        ([id, fullName, hasEmail, hasPhone, hasGradeLevel, hasEnrollmentDate]) => {
          const studentDetails: StudentDetails = {
            id,
            fullName,
            email: hasEmail ? fc.sample(fc.emailAddress(), 1)[0] : undefined,
            phone: hasPhone ? fc.sample(fc.string({ minLength: 1 }), 1)[0] : undefined,
            gradeLevel: hasGradeLevel ? fc.sample(fc.string({ minLength: 1 }), 1)[0] : undefined,
            enrollmentDate: hasEnrollmentDate ? fc.sample(fc.string({ minLength: 1 }), 1)[0] : undefined,
          };

          (useLocalSearchParams as jest.Mock).mockReturnValue({ id: studentDetails.id });
          (useStudentDetails as jest.Mock).mockReturnValue({
            data: studentDetails,
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          });

          render(<StudentDetailsScreen />);

          // Core property: name must always be rendered
          expect(screen.getAllByText(fullName).length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('property 13: Attendance button is always present in success state', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          fullName: fc.string({ minLength: 1 }),
          email: fc.option(fc.emailAddress(), { nil: undefined }),
          phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          gradeLevel: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          enrollmentDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        }),
        (studentDetails: StudentDetails) => {
          (useLocalSearchParams as jest.Mock).mockReturnValue({ id: studentDetails.id });
          (useStudentDetails as jest.Mock).mockReturnValue({
            data: studentDetails,
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          });

          render(<StudentDetailsScreen />);

          // Verify attendance navigation button is present
          expect(screen.getByText('parent.studentDetails.viewAttendance')).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });
});
