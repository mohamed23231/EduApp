/**
 * Unit tests for StudentDetailsScreen component
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StudentDetailsScreen } from '../student-details-screen';
import { useStudentDetails } from '../../hooks';

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

const mockStudent = {
  id: '1',
  fullName: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  schoolName: 'Example School',
  grade: 'A',
  enrollmentDate: '2024-01-01',
};

describe('StudentDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '1' });
  });

  describe('Loading State', () => {
    it('should render loading state with spinner', () => {
      (useStudentDetails as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentDetailsScreen />);

      // Check for ActivityIndicator (rendered as a view with testID)
      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should render error state with error message and retry button', () => {
      const mockError = new Error('Failed to fetch');
      const mockRefetch = jest.fn();

      (useStudentDetails as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      });

      render(<StudentDetailsScreen />);

      // Check for error message
      expect(screen.getByText('parent.common.retry')).toBeTruthy();
    });

    it('should call refetch when retry button is pressed', async () => {
      const mockRefetch = jest.fn();
      const mockError = new Error('Failed to fetch');

      (useStudentDetails as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
      });

      render(<StudentDetailsScreen />);

      const retryButton = screen.getByText('parent.common.retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });

  describe('Success State', () => {
    it('should render student details with all profile information', () => {
      (useStudentDetails as jest.Mock).mockReturnValue({
        data: mockStudent,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentDetailsScreen />);

      // Check for student name
      expect(screen.getByText('John Doe')).toBeTruthy();

      // Check for profile information
      expect(screen.getByText('john@example.com')).toBeTruthy();
      expect(screen.getByText('123-456-7890')).toBeTruthy();
      expect(screen.getByText('Example School')).toBeTruthy();
      expect(screen.getByText('A')).toBeTruthy();
      expect(screen.getByText('2024-01-01')).toBeTruthy();
    });

    it('should render attendance navigation button', () => {
      (useStudentDetails as jest.Mock).mockReturnValue({
        data: mockStudent,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentDetailsScreen />);

      // Check for attendance button
      expect(screen.getByText('parent.studentDetails.viewAttendance')).toBeTruthy();
    });

    it('should navigate to attendance screen when button is pressed', async () => {
      (useStudentDetails as jest.Mock).mockReturnValue({
        data: mockStudent,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentDetailsScreen />);

      const attendanceButton = screen.getByText('parent.studentDetails.viewAttendance');
      fireEvent.press(attendanceButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/(parent)/students/1/attendance');
      });
    });

    it('should render student details with partial information', () => {
      const partialStudent = {
        id: '1',
        fullName: 'Jane Doe',
        schoolName: 'Another School',
      };

      (useStudentDetails as jest.Mock).mockReturnValue({
        data: partialStudent,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentDetailsScreen />);

      // Check for available information
      expect(screen.getByText('Jane Doe')).toBeTruthy();
      expect(screen.getByText('Another School')).toBeTruthy();

      // Check that unavailable information is not rendered
      expect(screen.queryByText('john@example.com')).toBeFalsy();
    });
  });

  describe('Missing ID State', () => {
    it('should render error when id is missing', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      render(<StudentDetailsScreen />);

      expect(screen.getByText('parent.common.genericError')).toBeTruthy();
    });
  });
});
