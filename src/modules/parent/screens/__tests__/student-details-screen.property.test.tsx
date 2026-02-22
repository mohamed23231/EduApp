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

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import fc from 'fast-check';
import { StudentDetailsScreen } from '../student-details-screen';
import { useStudentDetails } from '../../hooks';
import type { StudentDetails } from '../../types/student.types';

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

describe('Property 13: Student Details Display', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    });

    test('Property 13: For any StudentDetails with fullName, the name is rendered', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    fullName: fc.string({ minLength: 1 }),
                    email: fc.option(fc.emailAddress(), { nil: undefined }),
                    phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    grade: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    schoolName: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    enrollmentDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    avatarUrl: fc.option(fc.webUrl(), { nil: undefined }),
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
                    expect(screen.getByText(studentDetails.fullName)).toBeTruthy();
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 13: Attendance navigation button links to correct student attendance route', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    fullName: fc.string({ minLength: 1 }),
                    email: fc.option(fc.emailAddress(), { nil: undefined }),
                    phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    grade: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    schoolName: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    enrollmentDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    avatarUrl: fc.option(fc.webUrl(), { nil: undefined }),
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

    test('Property 13: Student name is always rendered regardless of optional fields', () => {
        fc.assert(
            fc.property(
                fc.tuple(
                    fc.uuid(),
                    fc.string({ minLength: 1 }),
                    fc.boolean(),
                    fc.boolean(),
                    fc.boolean(),
                    fc.boolean(),
                    fc.boolean(),
                    fc.boolean(),
                ),
                ([id, fullName, hasEmail, hasPhone, hasGrade, hasSchoolName, hasEnrollmentDate, hasAvatarUrl]) => {
                    const studentDetails: StudentDetails = {
                        id,
                        fullName,
                        email: hasEmail ? fc.sample(fc.emailAddress(), 1)[0] : undefined,
                        phone: hasPhone ? fc.sample(fc.string({ minLength: 1 }), 1)[0] : undefined,
                        grade: hasGrade ? fc.sample(fc.string({ minLength: 1 }), 1)[0] : undefined,
                        schoolName: hasSchoolName ? fc.sample(fc.string({ minLength: 1 }), 1)[0] : undefined,
                        enrollmentDate: hasEnrollmentDate ? fc.sample(fc.string({ minLength: 1 }), 1)[0] : undefined,
                        avatarUrl: hasAvatarUrl ? fc.sample(fc.webUrl(), 1)[0] : undefined,
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
                    expect(screen.getByText(fullName)).toBeTruthy();
                },
            ),
            { numRuns: 100 },
        );
    });

    test('Property 13: Attendance button is always present in success state', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.uuid(),
                    fullName: fc.string({ minLength: 1 }),
                    email: fc.option(fc.emailAddress(), { nil: undefined }),
                    phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    grade: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    schoolName: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    enrollmentDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
                    avatarUrl: fc.option(fc.webUrl(), { nil: undefined }),
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
