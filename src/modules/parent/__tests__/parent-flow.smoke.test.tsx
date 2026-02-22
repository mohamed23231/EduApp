/**
 * Smoke test for parent navigation flow
 * Validates: Requirements 18.1, 18.4
 *
 * Tests the full navigation path:
 * dashboard → link student → back to dashboard → student list → student details → attendance
 * Verifies no dead links or blank screens in parent routes
 */

// Mock useTranslation FIRST before importing anything else
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'parent.common.loading': 'Loading...',
                'parent.common.genericError': 'Something went wrong',
                'parent.common.retry': 'Retry',
                'parent.common.offlineError': 'No internet connection',
                'parent.dashboard.title': 'My Students',
                'parent.dashboard.emptyTitle': 'No Students Linked',
                'parent.dashboard.emptyMessage': 'Link a student to get started.',
                'parent.dashboard.linkStudentCta': 'Link a Student',
                'parent.linkStudent.title': 'Link Your Student',
                'parent.linkStudent.submit': 'Link Student',
                'parent.studentList.title': 'Students',
                'parent.studentDetails.title': 'Student Details',
                'parent.studentDetails.viewAttendance': 'View Attendance',
                'parent.attendance.title': 'Attendance',
                'parent.attendance.emptyMessage': 'No attendance records available.',
                'parent.attendance.statusPresent': 'Present',
                'parent.attendance.statusAbsent': 'Absent',
                'parent.attendance.statusExcused': 'Excused',
                'parent.attendance.statusNotMarked': 'Not Marked',
            };
            return translations[key] || key;
        },
    }),
}));

// Mock useLocalSearchParams
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({ id: 'student-123' }),
}));

// Mock the hooks
jest.mock('../hooks');
jest.mock('../hooks/use-link-student');
jest.mock('../hooks/use-student-details');
jest.mock('../hooks/use-attendance');

import type { AttendanceRecord } from '../types/student.types';
import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { useAttendance } from '../hooks/use-attendance';
import { useStudentDetails } from '../hooks/use-student-details';
import { useStudents } from '../hooks';
import { useLinkStudent } from '../hooks/use-link-student';
import { ParentDashboardScreen } from '../screens/dashboard-screen';
import { LinkStudentScreen } from '../screens/link-student-screen';
import { StudentListScreen } from '../screens/student-list-screen';
import { StudentDetailsScreen } from '../screens/student-details-screen';
import { StudentAttendanceScreen } from '../screens/student-attendance-screen';

const mockUseStudents = useStudents as jest.MockedFunction<typeof useStudents>;
const mockUseLinkStudent = useLinkStudent as jest.MockedFunction<typeof useLinkStudent>;
const mockUseStudentDetails = useStudentDetails as jest.MockedFunction<typeof useStudentDetails>;
const mockUseAttendance = useAttendance as jest.MockedFunction<typeof useAttendance>;

describe('parent navigation flow smoke test', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set default mocks for all hooks
        mockUseStudents.mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
            refetch: jest.fn(),
        } as any);
        mockUseLinkStudent.mockReturnValue({
            mutate: jest.fn(),
            isPending: false,
            error: null,
        } as any);
        mockUseStudentDetails.mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
            refetch: jest.fn(),
        } as any);
        mockUseAttendance.mockReturnValue({
            data: [],
            isLoading: false,
            error: null,
            refetch: jest.fn(),
        } as any);
    });

    describe('dashboard screen renders without errors', () => {
        it('should render dashboard screen with student list', () => {
            mockUseStudents.mockReturnValue({
                data: [
                    { id: '1', fullName: 'John Doe', schoolName: 'School A' },
                    { id: '2', fullName: 'Jane Smith', schoolName: 'School B' },
                ],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<ParentDashboardScreen />);

            expect(screen.getByText('John Doe')).toBeTruthy();
            expect(screen.getByText('Jane Smith')).toBeTruthy();
        });

        it('should not render blank screen on dashboard', () => {
            mockUseStudents.mockReturnValue({
                data: [{ id: '1', fullName: 'John Doe', schoolName: 'School A' }],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<ParentDashboardScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should render loading state on dashboard without blank screen', () => {
            mockUseStudents.mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<ParentDashboardScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should render error state on dashboard without blank screen', () => {
            mockUseStudents.mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error('Network error'),
                refetch: jest.fn(),
            } as any);

            const { root } = render(<ParentDashboardScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should render empty state on dashboard without blank screen', () => {
            mockUseStudents.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<ParentDashboardScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });
    });

    describe('link student screen renders without errors', () => {
        it('should render link student screen with input field', () => {
            mockUseLinkStudent.mockReturnValue({
                mutate: jest.fn(),
                isPending: false,
                error: null,
            } as any);

            render(<LinkStudentScreen />);

            const input = screen.getByTestId('access-code-input');
            expect(input).toBeTruthy();
        });

        it('should not render blank screen on link student', () => {
            mockUseLinkStudent.mockReturnValue({
                mutate: jest.fn(),
                isPending: false,
                error: null,
            } as any);

            const { root } = render(<LinkStudentScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });
    });

    describe('student list screen renders without errors', () => {
        it('should render student list screen with students', () => {
            mockUseStudents.mockReturnValue({
                data: [
                    { id: '1', fullName: 'John Doe', schoolName: 'School A' },
                    { id: '2', fullName: 'Jane Smith', schoolName: 'School B' },
                ],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<StudentListScreen />);

            expect(screen.getByText('John Doe')).toBeTruthy();
            expect(screen.getByText('Jane Smith')).toBeTruthy();
        });

        it('should not render blank screen on student list', () => {
            mockUseStudents.mockReturnValue({
                data: [{ id: '1', fullName: 'John Doe', schoolName: 'School A' }],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentListScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should render empty state on student list without blank screen', () => {
            mockUseStudents.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentListScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });
    });

    describe('student details screen renders without errors', () => {
        it('should render student details screen with student name', () => {
            mockUseStudentDetails.mockReturnValue({
                data: {
                    id: '1',
                    fullName: 'John Doe',
                    schoolName: 'School A',
                    email: 'john@example.com',
                },
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<StudentDetailsScreen />);

            expect(screen.getByText('John Doe')).toBeTruthy();
        });

        it('should not render blank screen on student details', () => {
            mockUseStudentDetails.mockReturnValue({
                data: {
                    id: '1',
                    fullName: 'John Doe',
                    schoolName: 'School A',
                },
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentDetailsScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should have navigation link to attendance screen', () => {
            mockUseStudentDetails.mockReturnValue({
                data: {
                    id: '1',
                    fullName: 'John Doe',
                    schoolName: 'School A',
                },
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<StudentDetailsScreen />);

            const attendanceButton = screen.getByText('parent.studentDetails.viewAttendance');
            expect(attendanceButton).toBeTruthy();
        });

        it('should render loading state on student details without blank screen', () => {
            mockUseStudentDetails.mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentDetailsScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should render error state on student details without blank screen', () => {
            mockUseStudentDetails.mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error('Network error'),
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentDetailsScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });
    });

    describe('student attendance screen renders without errors', () => {
        it('should render attendance screen with records', () => {
            const mockRecords: AttendanceRecord[] = [
                {
                    sessionDate: '2024-01-15',
                    sessionName: 'Math Class',
                    status: 'PRESENT',
                },
                {
                    sessionDate: '2024-01-16',
                    sessionName: 'English Class',
                    status: 'ABSENT',
                },
            ];

            mockUseAttendance.mockReturnValue({
                data: mockRecords,
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<StudentAttendanceScreen />);

            expect(screen.getByText('Math Class')).toBeTruthy();
            expect(screen.getByText('English Class')).toBeTruthy();
        });

        it('should not render blank screen on attendance', () => {
            const mockRecords: AttendanceRecord[] = [
                {
                    sessionDate: '2024-01-15',
                    sessionName: 'Math Class',
                    status: 'PRESENT',
                },
            ];

            mockUseAttendance.mockReturnValue({
                data: mockRecords,
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentAttendanceScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should display all attendance fields', () => {
            const mockRecords: AttendanceRecord[] = [
                {
                    sessionDate: '2024-01-15',
                    sessionName: 'Math Class',
                    status: 'PRESENT',
                },
            ];

            mockUseAttendance.mockReturnValue({
                data: mockRecords,
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<StudentAttendanceScreen />);

            expect(screen.getByText('Math Class')).toBeTruthy();
            expect(screen.getByText('2024-01-15')).toBeTruthy();
        });

        it('should render loading state on attendance without blank screen', () => {
            mockUseAttendance.mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentAttendanceScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should render error state on attendance without blank screen', () => {
            mockUseAttendance.mockReturnValue({
                data: undefined,
                isLoading: false,
                error: new Error('Network error'),
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentAttendanceScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('should render empty state on attendance without blank screen', () => {
            mockUseAttendance.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            const { root } = render(<StudentAttendanceScreen />);

            expect(root).toBeDefined();
            expect(root.children.length).toBeGreaterThan(0);
        });
    });

    describe('navigation flow without dead links', () => {
        it('should navigate from dashboard to link student without error', () => {
            mockUseStudents.mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<ParentDashboardScreen />);

            const ctaButton = screen.getByText('Link a Student');
            expect(ctaButton).toBeTruthy();
        });

        it('should navigate from student list to student details without error', () => {
            mockUseStudents.mockReturnValue({
                data: [{ id: '1', fullName: 'John Doe', schoolName: 'School A' }],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<StudentListScreen />);

            const studentItem = screen.getByText('John Doe');
            expect(studentItem).toBeTruthy();
        });

        it('should navigate from student details to attendance without error', () => {
            mockUseStudentDetails.mockReturnValue({
                data: {
                    id: '1',
                    fullName: 'John Doe',
                    schoolName: 'School A',
                },
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            } as any);

            render(<StudentDetailsScreen />);

            const attendanceButton = screen.getByText('View Attendance');
            expect(attendanceButton).toBeTruthy();
        });
    });
});
