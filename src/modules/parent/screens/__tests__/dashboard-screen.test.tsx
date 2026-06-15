/**
 * Integration tests for ParentDashboardScreen (Phase 8 redesign composition).
 * The screen composes ChildSwitcher + ParentHero + ThisWeekTiles + RECENT timeline,
 * driven by useStudents + useChildSummaryHero + useCurrentSession + useUpcomingSessions.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  useChildSummaryHero,
  useCurrentSession,
  useStudents,
  useUpcomingSessions,
} from '../../hooks';
import { ParentDashboardScreen } from '../dashboard-screen';

jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('../../store/use-notification-store', () => ({
  useNotificationStore: {
    use: {
      unreadCount: jest.fn(() => 0),
    },
  },
}));
jest.mock('../../services/error-utils', () => ({
  extractErrorMessage: jest.fn((_error: unknown, _t: unknown) => 'parent.common.genericError'),
}));
jest.mock('../../utils/dashboard-helpers', () => ({
  deriveTodayRecord: jest.fn(() => null),
}));
jest.mock('../../components', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    NotificationBell: ({ onPress }: { onPress: () => void }) => (
      <Pressable testID="notification-bell" onPress={onPress}>
        <Text>bell</Text>
      </Pressable>
    ),
    EmptyDashboard: ({ onLinkStudent }: { onLinkStudent: () => void }) => (
      <View testID="empty-dashboard">
        <Pressable testID="link-student-cta" onPress={onLinkStudent}>
          <Text>parent.dashboard.linkStudentCta</Text>
        </Pressable>
      </View>
    ),
  };
});
jest.mock('../../components/dashboard', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    DashboardSkeleton: ({ testID }: { testID?: string }) => <View testID={testID} />,
    ChildSwitcher: ({ students, onSelect }: any) => (
      <View testID="child-switcher">
        {students.map((s: any) => (
          <Pressable key={s.id} testID={`child-pill-${s.id}`} onPress={() => onSelect(s.id)}>
            <Text>{s.fullName}</Text>
          </Pressable>
        ))}
      </View>
    ),
    ParentHero: ({ studentFirstName }: any) => (
      <Text testID="parent-hero">{studentFirstName}</Text>
    ),
    ThisWeekTiles: ({ stats }: any) => (
      <Text testID="this-week-tiles">{stats?.attendanceRate ?? 'no-stats'}</Text>
    ),
    TimelineRow: ({ record }: any) => (
      <Text testID={`timeline-row-${record.date}`}>{record.status}</Text>
    ),
  };
});

const mockRouter = { push: jest.fn(), replace: jest.fn() };
const mockT = (key: string, fallback?: string) => fallback ?? key;

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
};

const mockTimeline = [
  { date: '2024-01-15', time: '08:30', status: 'PRESENT' as const },
  { date: '2024-01-14', time: '08:30', status: 'ABSENT' as const },
  { date: '2024-01-13', time: '08:30', status: 'EXCUSED' as const },
  { date: '2024-01-12', time: '08:30', status: 'PRESENT' as const },
];

function mockHero(overrides: Partial<ReturnType<typeof useChildSummaryHero>> = {}) {
  (useChildSummaryHero as jest.Mock).mockReturnValue({
    student: mockStudents[0],
    attendanceStats: mockStats,
    recentTimeline: mockTimeline,
    isLoading: false,
    error: null,
    ...overrides,
  });
}

describe('parentDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT, i18n: { language: 'en' } });
    (useCurrentSession as jest.Mock).mockReturnValue({ data: undefined });
    (useUpcomingSessions as jest.Mock).mockReturnValue({ data: undefined });
    mockHero();
  });

  describe('root state: loading', () => {
    beforeEach(() => {
      (useStudents as jest.Mock).mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: jest.fn() });
    });

    it('renders loading spinner when students are loading', () => {
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    });

    it('does not render the child switcher while loading', () => {
      render(<ParentDashboardScreen />);
      expect(screen.queryByTestId('child-switcher')).toBeNull();
    });
  });

  describe('root state: error', () => {
    beforeEach(() => {
      (useStudents as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: new Error('Network error'), refetch: jest.fn() });
    });

    it('renders error message and retry button when students query fails', () => {
      render(<ParentDashboardScreen />);
      expect(screen.getByText('parent.common.genericError')).toBeTruthy();
      expect(screen.getByTestId('retry-button')).toBeTruthy();
    });

    it('calls refetch when retry is pressed', async () => {
      const mockRefetch = jest.fn();
      (useStudents as jest.Mock).mockReturnValue({ data: undefined, isLoading: false, error: new Error('Network error'), refetch: mockRefetch });
      render(<ParentDashboardScreen />);
      fireEvent.press(screen.getByTestId('retry-button-action'));
      await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    });
  });

  describe('root state: empty', () => {
    beforeEach(() => {
      (useStudents as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null, refetch: jest.fn() });
    });

    it('renders EmptyDashboard when students list is empty', () => {
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('empty-dashboard')).toBeTruthy();
    });

    it('navigates to link student when CTA is pressed', async () => {
      render(<ParentDashboardScreen />);
      fireEvent.press(screen.getByTestId('link-student-cta'));
      await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/(parent)/students/link'));
    });
  });

  describe('root state: success', () => {
    beforeEach(() => {
      (useStudents as jest.Mock).mockReturnValue({ data: mockStudents, isLoading: false, error: null, refetch: jest.fn() });
    });

    it('renders the child switcher with all students and the hero', () => {
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('child-switcher')).toBeTruthy();
      expect(screen.getByText('Ahmed Ali')).toBeTruthy();
      expect(screen.getByText('Sara Ahmed')).toBeTruthy();
      expect(screen.getByTestId('parent-hero')).toBeTruthy();
    });

    it('renders the weekly tiles with attendance stats', () => {
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('this-week-tiles')).toHaveTextContent('92.5');
    });

    it('auto-selects the first student for the hero summary', () => {
      render(<ParentDashboardScreen />);
      expect(useChildSummaryHero).toHaveBeenCalledWith('1');
    });
  });

  describe('timeline display limit', () => {
    it('renders at most 3 timeline rows', () => {
      (useStudents as jest.Mock).mockReturnValue({ data: mockStudents, isLoading: false, error: null, refetch: jest.fn() });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('timeline-row-2024-01-15')).toBeTruthy();
      expect(screen.getByTestId('timeline-row-2024-01-14')).toBeTruthy();
      expect(screen.getByTestId('timeline-row-2024-01-13')).toBeTruthy();
      expect(screen.queryByTestId('timeline-row-2024-01-12')).toBeNull();
    });
  });

  describe('partial failure: hero error', () => {
    it('shows the hero error message when the summary fails', () => {
      (useStudents as jest.Mock).mockReturnValue({ data: mockStudents, isLoading: false, error: null, refetch: jest.fn() });
      mockHero({ error: new Error('Stats failed') });
      render(<ParentDashboardScreen />);
      expect(screen.getByTestId('hero-error')).toBeTruthy();
    });
  });
});
