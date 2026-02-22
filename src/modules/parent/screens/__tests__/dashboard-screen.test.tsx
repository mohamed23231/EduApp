/**
 * Unit tests for ParentDashboardScreen
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useStudents } from '../../hooks';
import { ParentDashboardScreen } from '../dashboard-screen';

// Mock dependencies
jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('../../services/error-utils', () => ({
    extractErrorMessage: jest.fn((_error, _t) => 'parent.common.genericError'),
}));

const mockRouter = {
    push: jest.fn(),
};

const mockT = (key: string) => key;

describe('parentDashboardScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    });

    describe('loading State', () => {
        it('should render loading spinner while data is being fetched', () => {
            (useStudents as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            // Check for ActivityIndicator (rendered as a view with testID or by checking for loading state)
            const loadingIndicator = screen.getByTestId('loading-indicator');
            expect(loadingIndicator).toBeTruthy();
        });
    });

    describe('empty State', () => {
        it('should render empty state with CTA when no students are linked', () => {
            (useStudents as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            expect(screen.getByText('parent.dashboard.emptyTitle')).toBeTruthy();
            expect(screen.getByText('parent.dashboard.emptyMessage')).toBeTruthy();
            expect(screen.getByText('parent.dashboard.linkStudentCta')).toBeTruthy();
        });

        it('should navigate to link-student when CTA is pressed', async () => {
            (useStudents as jest.Mock).mockReturnValue({
                data: [],
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            const ctaButton = screen.getByText('parent.dashboard.linkStudentCta');
            fireEvent.press(ctaButton);

            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/(parent)/students/link');
            });
        });
    });

    describe('success State', () => {
        it('should render all student names when students are loaded', () => {
            const mockStudents = [
                { id: '1', fullName: 'John Doe', schoolName: 'School A' },
                { id: '2', fullName: 'Jane Smith', schoolName: 'School B' },
            ];

            (useStudents as jest.Mock).mockReturnValue({
                data: mockStudents,
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            expect(screen.getByText('John Doe')).toBeTruthy();
            expect(screen.getByText('Jane Smith')).toBeTruthy();
        });

        it('should render school names when available', () => {
            const mockStudents = [
                { id: '1', fullName: 'John Doe', schoolName: 'School A' },
            ];

            (useStudents as jest.Mock).mockReturnValue({
                data: mockStudents,
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            expect(screen.getByText('School A')).toBeTruthy();
        });

        it('should navigate to student details when a student is tapped', async () => {
            const mockStudents = [
                { id: '1', fullName: 'John Doe', schoolName: 'School A' },
            ];

            (useStudents as jest.Mock).mockReturnValue({
                data: mockStudents,
                isLoading: false,
                error: null,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            const studentItem = screen.getByTestId('student-row-1');
            fireEvent.press(studentItem);

            await waitFor(() => {
                expect(mockRouter.push).toHaveBeenCalledWith('/(parent)/students/1');
            });
        });
    });

    describe('error State', () => {
        it('should render error message when API request fails', () => {
            const mockError = new Error('Network error');

            (useStudents as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: mockError,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            expect(screen.getByText('parent.common.genericError')).toBeTruthy();
        });

        it('should render retry button when error occurs', () => {
            const mockError = new Error('Network error');

            (useStudents as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: mockError,
                refetch: jest.fn(),
            });

            render(<ParentDashboardScreen />);

            expect(screen.getByText('parent.common.retry')).toBeTruthy();
        });

        it('should call refetch when retry button is pressed', async () => {
            const mockRefetch = jest.fn();
            const mockError = new Error('Network error');

            (useStudents as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
                error: mockError,
                refetch: mockRefetch,
            });

            render(<ParentDashboardScreen />);

            const retryButton = screen.getByText('parent.common.retry');
            fireEvent.press(retryButton);

            await waitFor(() => {
                expect(mockRefetch).toHaveBeenCalled();
            });
        });
    });
});
