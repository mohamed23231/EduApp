/**
 * Integration tests for ParentDashboardScreen
 * Validates: Requirements 1.5, 5.1, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAttendanceStats, useAttendanceTimeline, useStudents } from '../../hooks';
import { ParentDashboardScreen } from '../dashboard-screen';

jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('../../services/error-utils', () => ({
  extractErrorMessage: jest.fn((_error: unknown, _t: unknown) => 'parent.common.genericError'),
}));
jest.mock('../../components', () => ({
  StudentSelector: ({ students, _selectedId, onSelect }: any) => {
    const { View, Text, Pressable } = require('react-native');
    return (
      <View testID="student-selector">
        {students.map((s: any) => (
          <Pressable key={s.id} testID={`student-avatar-${s.id}`} onPress={() => onSelect(s.id)}>
            <Text>{s.fullName}</Text>
          </Pressable>
        ))}
      </View>
    );
  },
  AttendanceDonutChart: ({ attendanceRate }: any) => {
    const { Text } = require('react-native');
    return (
      <Text testID="donut-chart">
        {attendanceRate}
        %
      </Text>
    );
  },
  AttendanceStatCard: ({ present, absent, excused }: any) => {
    const { Text } = require('react-native');
    return (
      <Text testID="stat-card">
        {present}
        /
        {absent}
        /
        {excused}
      </Text>
    );
  },
  TimelineItem: ({ date, status }: any) => {
    const { Text } = require('react-native');
    return <Text testID={`timeline-item-${date}`}>{status}</Text>;
  },
  EmptyDashboard: ({ onLinkStudent }: any) => {
    const { View, Text, Pressable } = require('react-native');
    return (
      <View testID="empty-dashboard">
        <Text>parent.dashboard.emptyTitle</Text>
        <Text>parent.dashboard.emptyMessage</Text>
        <Pressable testID="link-student-cta" onPress={onLinkStudent}>
          <Text>parent.dashboard.linkStudentCta</Text>
        </Pressable>
      </View>
    );
  },
}));

const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockT = (key: string) => key;

const mockStudents = [
  { id: '1', fullName: 'Ahmed Ali', gradeLevel: 'Grade 5' },
  { id: '2', fullName: 'Sara Ahmed', gradeLevel: 'Grade 3' },
];

const mockStats = {
  attendanceRate: 92.5,
  present: 45,
  absent: 3,
  excused: 2,
  notMarked: 1,
  totalSessions: 51,
  termName: 'Term 1',
  termStartDate: '2024-01-01',
  termEndDate: '2024-06-30',
};

const mockTimeline = [
  { date: '2024-01-15', time: '08:30', status: 'PRESENT' as const },
  { date: '2024-01-14', time: '08:30', status: 'ABSENT' as const },
  { date: '2024-01-13', time: '08:30', status: 'EXCUSED' as const, excuseNote: 'Doctor' },
  { date: '2024-01-12', time: '08:30', status: 'PRESENT' as const },
  { date: '2024-01-11', time: '08:30', status: 'NOT_MARKED' as const },
  { date: '2024-01-10', time: '08:30', status: 'PRESENT' as const }, // 6th record — should NOT render
];

// eslint-disable-next-line max-lines-per-function
describe('parentDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
    // Default: stats and timeline not loading
    (useAttendanceStats as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (useAttendanceTimeline as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  describe('root state: loading', () => {
    it('renders loading spinner when students are loading', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('does not render student selector while loading', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.queryByTestId('student-selector')).toBeNull();
    });
  });

  describe('root state: error', () => {
    it('renders error message when students query fails', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByText('parent.common.genericError')).toBeTruthy();
    });

    it('renders retry button on students error', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('retry-button')).toBeTruthy();
    });

    it('calls refetch when retry is pressed', async () => {
      const mockRefetch = jest.fn();
      (useStudents as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      });
      render(<ParentDashboardScreen />);
      fireEvent.press(screen.getByTestId('retry-button'));
      await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    });
  });

  describe('root state: empty', () => {
    it('renders EmptyDashboard when students list is empty', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('empty-dashboard')).toBeTruthy();
    });

    it('navigates to link student when CTA is pressed', async () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      fireEvent.press(screen.getByTestId('link-student-cta'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/(parent)/students/link'));
    });
  });

  describe('root state: success', () => {
    it('renders student selector with all students', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('student-selector')).toBeTruthy();
      // First student name appears twice: in selector and as selected student label
      expect(screen.getAllByText('Ahmed Ali').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Sara Ahmed')).toBeTruthy();
    });

    it('renders donut chart and stat card when stats loaded', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAttendanceStats as jest.Mock).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('donut-chart')).toBeTruthy();
      expect(screen.getByTestId('stat-card')).toBeTruthy();
    });
  });

  describe('timeline display limit', () => {
    it('renders at most 5 timeline records', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAttendanceTimeline as jest.Mock).mockReturnValue({
        data: mockTimeline,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      // 6 records in mockTimeline, only 5 should render
      expect(screen.getByTestId('timeline-item-2024-01-15')).toBeTruthy();
      expect(screen.getByTestId('timeline-item-2024-01-14')).toBeTruthy();
      expect(screen.getByTestId('timeline-item-2024-01-13')).toBeTruthy();
      expect(screen.getByTestId('timeline-item-2024-01-12')).toBeTruthy();
      expect(screen.getByTestId('timeline-item-2024-01-11')).toBeTruthy();
      expect(screen.queryByTestId('timeline-item-2024-01-10')).toBeNull(); // 6th should NOT render
    });
  });

  describe('selected student fallback', () => {
    it('auto-selects first student when no selection exists', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      // useAttendanceStats should be called with first student's id
      expect(useAttendanceStats).toHaveBeenCalledWith('1');
    });
  });

  describe('partial failure: stats error', () => {
    it('shows stats error card while timeline still renders', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAttendanceStats as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Stats failed'),
        refetch: jest.fn(),
      });
      (useAttendanceTimeline as jest.Mock).mockReturnValue({
        data: mockTimeline.slice(0, 3),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('stats-error')).toBeTruthy();
      expect(screen.getByTestId('timeline-item-2024-01-15')).toBeTruthy();
    });
  });

  describe('partial failure: timeline error', () => {
    it('shows timeline error card while stats still renders', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAttendanceStats as jest.Mock).mockReturnValue({
        data: mockStats,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAttendanceTimeline as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Timeline failed'),
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('timeline-error')).toBeTruthy();
      expect(screen.getByTestId('donut-chart')).toBeTruthy();
    });
  });

  describe('loading skeletons within success state', () => {
    it('shows stats skeleton while stats loading', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAttendanceStats as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('stats-skeleton')).toBeTruthy();
      expect(screen.getByTestId('student-selector')).toBeTruthy(); // selector still visible
    });

    it('shows timeline skeleton while timeline loading', () => {
      (useStudents as jest.Mock).mockReturnValue({
        data: mockStudents,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAttendanceTimeline as jest.Mock).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('timeline-skeleton')).toBeTruthy();
    });
  });
});
