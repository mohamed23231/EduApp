/**
 * Unit tests for StudentListScreen
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useStudents } from '../../hooks';
import { StudentListScreen } from '../student-list-screen';

// Mock dependencies
jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('../../services/error-utils', () => ({
  extractErrorMessage: jest.fn((_error, _t) => 'Test error message'),
}));

const mockRouter = {
  push: jest.fn(),
};

const mockT = (key: string) => key;

// eslint-disable-next-line max-lines-per-function
describe('studentListScreen', () => {
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

      render(<StudentListScreen />);

      const loadingIndicator = screen.getByTestId('loading-indicator');
      expect(loadingIndicator).toBeTruthy();
    });
  });

  describe('empty State', () => {
    it('should render empty state with prompt to link student', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentListScreen />);

      expect(screen.getByText('parent.studentList.emptyTitle')).toBeTruthy();
      expect(screen.getByText('parent.studentList.emptyMessage')).toBeTruthy();
      expect(screen.getByText('parent.dashboard.linkStudentCta')).toBeTruthy();
    });

    it('should navigate to link-student when CTA is pressed', async () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentListScreen />);

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
        { id: '1', fullName: 'John Doe' },
        { id: '2', fullName: 'Jane Smith' },
      ];

      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentListScreen />);

      expect(screen.getByText('John Doe')).toBeTruthy();
      expect(screen.getByText('Jane Smith')).toBeTruthy();
    });

    it('should navigate to student details when a student is tapped', async () => {
      const mockStudents = [
        { id: '1', fullName: 'John Doe' },
      ];

      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<StudentListScreen />);

      const studentItem = screen.getByText('John Doe');
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

      render(<StudentListScreen />);

      expect(screen.getByText('Test error message')).toBeTruthy();
    });

    it('should render retry button when error occurs', () => {
      const mockError = new Error('Network error');

      (useStudents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      });

      render(<StudentListScreen />);

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

      render(<StudentListScreen />);

      const retryButton = screen.getByText('parent.common.retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });
  });
});
