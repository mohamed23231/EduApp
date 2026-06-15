/**
 * Unit tests for StudentDetailsScreen (Phase 8 redesign composition).
 * Composes StudentHero + AccessCodeRow + RECENT timeline + attendance CTA,
 * driven by useStudentDetails + useAttendanceStats + useAttendanceTimeline.
 */

import type { ReactElement } from 'react';
import { fireEvent, render as rtlRender, screen, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@/components/ui/theme';
import { useAttendanceStats, useAttendanceTimeline, useStudentDetails } from '../../hooks';
import { StudentDetailsScreen } from '../student-details-screen';

// The redesigned loading state renders StudentDetailsSkeleton → Skeleton →
// useReducedMotion → useTheme, which requires a ThemeProvider. Wrap every render
// in it and stub the uniwind runtime hooks the provider reads.
jest.mock('uniwind', () => {
  const actual = jest.requireActual('uniwind');
  return {
    ...actual,
    Uniwind: { ...actual.Uniwind, setTheme: jest.fn() },
    useUniwind: jest.fn(() => ({ theme: 'light', hasAdaptiveThemes: true })),
  };
});

function render(ui: ReactElement): ReturnType<typeof rtlRender> {
  return rtlRender(<ThemeProvider>{ui}</ThemeProvider>);
}

jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('@/core/feature-flags/use-feature-flags', () => ({
  useFeatureFlags: () => ({ isParentPerformanceEnabled: false }),
}));
jest.mock('../../components/dashboard', () => {
  const { Text } = require('react-native');
  return {
    TimelineRow: ({ record }: any) => <Text testID={`timeline-row-${record.date}`}>{record.status}</Text>,
  };
});
jest.mock('../../components/student', () => {
  const { Text } = require('react-native');
  return {
    StudentHero: ({ student }: any) => <Text testID="student-hero">{student.fullName}</Text>,
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

const mockStudent = {
  id: '1',
  fullName: 'John Doe',
  gradeLevel: 'Grade A',
  connectionCode: 'ABC123',
};

const mockTimeline = [
  { date: '2024-01-15', time: '08:30', status: 'PRESENT' as const },
  { date: '2024-01-14', time: '08:30', status: 'ABSENT' as const },
];

describe('studentDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT, i18n: { language: 'en' } });
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '1' });
    (useAttendanceStats as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: jest.fn() });
    (useAttendanceTimeline as jest.Mock).mockReturnValue({ data: mockTimeline, isLoading: false, error: null, refetch: jest.fn() });
  });

  describe('loading State', () => {
    it('should render loading state with spinner', () => {
      (useStudentDetails as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: jest.fn() });
      render(<StudentDetailsScreen />);
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  describe('error State', () => {
    it('should render error state with retry button', () => {
      (useStudentDetails as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: new Error('Failed to fetch'), refetch: jest.fn() });
      render(<StudentDetailsScreen />);
      expect(screen.getByTestId('retry-button')).toBeTruthy();
    });

    it('should call refetch when retry button is pressed', async () => {
      const mockRefetch = jest.fn();
      (useStudentDetails as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: new Error('Failed to fetch'), refetch: mockRefetch });
      render(<StudentDetailsScreen />);
      fireEvent.press(screen.getByTestId('retry-button-action'));
      await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    });
  });

  describe('success State', () => {
    beforeEach(() => {
      (useStudentDetails as jest.Mock).mockReturnValue({ data: mockStudent, isLoading: false, error: null, refetch: jest.fn() });
    });

    it('should render the student hero with the name', () => {
      render(<StudentDetailsScreen />);
      expect(screen.getByTestId('student-hero')).toHaveTextContent('John Doe');
    });

    it('should render the recent timeline rows', () => {
      render(<StudentDetailsScreen />);
      expect(screen.getByTestId('timeline-row-2024-01-15')).toBeTruthy();
      expect(screen.getByTestId('timeline-row-2024-01-14')).toBeTruthy();
    });

    it('should render attendance navigation button', () => {
      render(<StudentDetailsScreen />);
      expect(screen.getByTestId('view-attendance-button')).toBeTruthy();
    });

    it('should navigate to attendance screen when button is pressed', async () => {
      render(<StudentDetailsScreen />);
      fireEvent.press(screen.getByTestId('view-attendance-button'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/(parent)/students/1/attendance'));
    });
  });

  describe('missing ID State', () => {
    it('should render error when id is missing', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});
      (useStudentDetails as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: null, refetch: jest.fn() });
      render(<StudentDetailsScreen />);
      expect(screen.getByText('parent.common.genericError')).toBeTruthy();
    });
  });
});
