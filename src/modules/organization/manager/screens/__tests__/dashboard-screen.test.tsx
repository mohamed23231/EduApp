import { fireEvent, render, screen } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  useCloseSession,
  useOrganization,
  useOrganizations,
  useOrgInstances,
  useOrgStats,
  useStartSession,
} from '../../hooks';
import { DashboardScreen } from '../dashboard-screen';

jest.mock('expo-router');
jest.mock('react-i18next');
jest.mock('../../hooks');
jest.mock('@/components/ui/toast-host', () => ({
  useToast: () => ({ show: jest.fn() }),
}));
jest.mock('@/components/ui/modal', () => {
  const { View } = require('react-native');
  return {
    useModal: () => ({ ref: { current: null }, present: jest.fn(), dismiss: jest.fn() }),
    Modal: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});
jest.mock('../../components/dashboard/attendance-hero', () => ({
  AttendanceHero: () => {
    const { Text } = require('react-native');
    return <Text>attendance-hero</Text>;
  },
}));
jest.mock('../../components/dashboard/today-tiles', () => ({
  TodayTiles: () => {
    const { Text } = require('react-native');
    return <Text>today-tiles</Text>;
  },
}));
jest.mock('../../components/dashboard/teacher-leaderboard', () => ({
  TeacherLeaderboard: () => {
    const { Text } = require('react-native');
    return <Text>teacher-leaderboard</Text>;
  },
}));
jest.mock('../../store/manager-store', () => ({
  useManagerStore: {
    use: {
      activeOrgId: jest.fn(() => 'org-1'),
      setActiveOrgId: jest.fn(() => jest.fn()),
      setOrgDetails: jest.fn(() => jest.fn()),
    },
  },
}));
jest.mock('../../components', () => ({
  TrialExpiredBanner: ({ visible }: { visible: boolean }) => {
    const { Text } = require('react-native');
    return visible ? <Text>trial-expired-banner</Text> : null;
  },
  OnboardingWizard: ({ steps }: { steps: Array<{ title: string }> }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="onboarding-wizard">
        {steps.map(step => <Text key={step.title}>{step.title}</Text>)}
      </View>
    );
  },
}));

const mockRouter = {
  push: jest.fn(),
};

const mockOverview = {
  activeStudents: 12,
  averageAttendanceRate: 92,
  todaySessions: 3,
  runningNow: 1,
  absentToday: 2,
};

const mockTeacherStats = {
  data: [
    { memberId: 'member-1', name: 'Sara', assignedSessions: 4, averageAttendanceRate: 90 },
    { memberId: 'member-2', name: 'Omar', assignedSessions: 3, averageAttendanceRate: 88 },
  ],
};

const mockInstances = {
  data: [
    {
      id: 'instance-1',
      templateId: 'template-1',
      subject: 'Math',
      date: new Date().toISOString().slice(0, 10),
      time: '16:00',
      state: 'ACTIVE',
      durationMinutes: 90,
      assignedTeacher: { id: 'teacher-1', name: 'Sara' },
      students: [{ id: 'student-1' }, { id: 'student-2' }],
      studentCount: 2,
    },
  ],
};

const noopMutation = { mutate: jest.fn(), isPending: false };

describe('dashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) =>
        options && 'minutes' in options
          ? `${options.minutes} min`
          : options && 'count' in options
            ? `${options.count} students`
            : key,
    });
    (useStartSession as jest.Mock).mockReturnValue(noopMutation);
    (useCloseSession as jest.Mock).mockReturnValue(noopMutation);
    (useOrganizations as jest.Mock).mockReturnValue({
      data: {
        data: [{ id: 'org-1', name: 'Future Academy' }],
      },
    });
    (useOrganization as jest.Mock).mockReturnValue({
      data: {
        id: 'org-1',
        name: 'Future Academy',
        currentStudents: 12,
        currentSessions: 4,
        entitlementSource: 'trial',
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
    (useOrgStats as jest.Mock).mockReturnValue({
      overview: {
        data: mockOverview,
        isLoading: false,
        isRefetching: false,
        refetch: jest.fn(),
      },
      teachers: {
        data: mockTeacherStats,
        isLoading: false,
        isRefetching: false,
        refetch: jest.fn(),
      },
    });
    (useOrgInstances as jest.Mock).mockReturnValue({
      data: mockInstances,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  it('renders the populated dashboard state and opens a session', () => {
    render(<DashboardScreen />);

    expect(screen.getByText('Future Academy')).toBeTruthy();
    expect(screen.getByText('manager.dashboard.headerToday')).toBeTruthy();
    expect(screen.getByText('Math')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Math'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(manager)/sessions/template-1');
  });

  it('renders the empty organization setup state', () => {
    (useOrganizations as jest.Mock).mockReturnValue({
      data: { data: [] },
    });

    render(<DashboardScreen />);

    expect(screen.getByText('manager.dashboard.emptyTitle')).toBeTruthy();
    fireEvent.press(screen.getByText('manager.setup.submit'));
    expect(mockRouter.push).toHaveBeenCalledWith('/(manager)/setup');
  });

  it('shows the onboarding wizard and expired banner when the org needs setup and access is expired', () => {
    (useOrganization as jest.Mock).mockReturnValue({
      data: {
        id: 'org-1',
        name: 'Future Academy',
        currentStudents: 0,
        currentSessions: 0,
        entitlementSource: 'expired',
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });

    render(<DashboardScreen />);

    expect(screen.getByText('trial-expired-banner')).toBeTruthy();
    expect(screen.getByTestId('onboarding-wizard')).toBeTruthy();
  });
});
