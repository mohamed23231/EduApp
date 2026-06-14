/**
 * Smoke test for parent screens
 * Validates: Requirements 18.1, 18.4
 */

import type { AttendanceRecord, AttendanceStats, TimelineRecord } from '../types/student.types';
import { render, screen } from '@testing-library/react-native';
import * as React from 'react';
import { ThemeProvider } from '@/components/ui/theme';
import { useAttendance, useAttendanceStats, useAttendanceTimeline, useChildSummaryHero, useCurrentSession, useLinkStudent, useStudentDetails, useStudents, useUpcomingSessions } from '../hooks';
import { ParentDashboardScreen } from '../screens/dashboard-screen';
import { LinkStudentScreen } from '../screens/link-student-screen';
import { StudentAttendanceScreen } from '../screens/student-attendance-screen';
import { StudentDetailsScreen } from '../screens/student-details-screen';
import { StudentListScreen } from '../screens/student-list-screen';

// The redesigned dashboard renders BigNumber → useReducedMotion → useTheme,
// which requires a ThemeProvider. Provide it and override only the uniwind
// runtime hooks the provider reads, keeping the real module (the UI barrel
// pulls in `withUniwind` via image.tsx, so we can't replace the whole module).
jest.mock('uniwind', () => {
  const actual = jest.requireActual('uniwind');
  return {
    ...actual,
    Uniwind: { ...actual.Uniwind, setTheme: jest.fn() },
    useUniwind: jest.fn(() => ({ theme: 'light', hasAdaptiveThemes: true })),
  };
});

function renderWithTheme(ui: React.ReactElement): ReturnType<typeof render> {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'parent.common.retry': 'Retry',
        'parent.common.genericError': 'Something went wrong',
        'parent.common.brandName': 'Taba3ny',
        'parent.common.back': 'Back',
        'parent.dashboard.title': 'My Students',
        'parent.dashboard.emptyTitle': 'No Students Linked',
        'parent.dashboard.emptyMessage': 'Link a student to get started.',
        'parent.dashboard.linkStudentCta': 'Link a Student',
        'parent.dashboard.statsTitle': 'Attendance Overview',
        'parent.dashboard.timelineTitle': 'Recent Attendance',
        'parent.dashboard.noTimeline': 'No recent attendance records',
        'parent.linkStudent.title': 'Link Your Student',
        'parent.linkStudent.description': 'Enter the integration code provided by your school.',
        'parent.linkStudent.inputLabel': 'Student Integration Code',
        'parent.linkStudent.inputPlaceholder': 'EDU-123-456',
        'parent.linkStudent.submit': 'Link Student',
        'parent.linkStudent.helpLink': 'Where do I find the code?',
        'parent.linkStudent.helpContent': 'Contact your school administration.',
        'parent.linkStudent.fallbackHelp': 'Contact school administration office.',
        'parent.studentList.emptyTitle': 'No Students',
        'parent.studentList.emptyMessage': 'Link a student to see them here.',
        'parent.studentDetails.viewAttendance': 'View Attendance',
        'parent.studentDetails.labels.grade': 'Grade',
        'parent.attendance.emptyMessage': 'No attendance records available.',
        'parent.attendance.statusPresent': 'Present',
        'parent.attendance.statusAbsent': 'Absent',
        'parent.attendance.statusExcused': 'Excused',
        'parent.attendance.statusNotMarked': 'Not Marked',
      };
      return translations[key] ?? key;
    },
  }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'student-1' }),
}));

jest.mock('../hooks', () => ({
  useStudents: jest.fn(),
  useLinkStudent: jest.fn(),
  useStudentDetails: jest.fn(),
  useAttendance: jest.fn(),
  useAttendanceStats: jest.fn(),
  useAttendanceTimeline: jest.fn(),
  useChildSummaryHero: jest.fn(),
  useCurrentSession: jest.fn(),
  useUpcomingSessions: jest.fn(),
}));

// The redesigned student-detail screen reads a feature flag (useQuery-backed).
// Stub it so the smoke test doesn't need a QueryClientProvider.
jest.mock('@/core/feature-flags/use-feature-flags', () => ({
  useFeatureFlags: () => ({ isParentPerformanceEnabled: true }),
}));

const mockUseStudents = useStudents as jest.MockedFunction<typeof useStudents>;
const mockUseLinkStudent = useLinkStudent as jest.MockedFunction<typeof useLinkStudent>;
const mockUseStudentDetails = useStudentDetails as jest.MockedFunction<typeof useStudentDetails>;
const mockUseAttendance = useAttendance as jest.MockedFunction<typeof useAttendance>;
const mockUseAttendanceStats = useAttendanceStats as jest.MockedFunction<typeof useAttendanceStats>;
const mockUseAttendanceTimeline = useAttendanceTimeline as jest.MockedFunction<typeof useAttendanceTimeline>;
const mockUseChildSummaryHero = useChildSummaryHero as jest.MockedFunction<typeof useChildSummaryHero>;
const mockUseCurrentSession = useCurrentSession as jest.MockedFunction<typeof useCurrentSession>;
const mockUseUpcomingSessions = useUpcomingSessions as jest.MockedFunction<typeof useUpcomingSessions>;

const defaultStats: AttendanceStats = {
  attendanceRate: 92,
  present: 12,
  absent: 1,
  excused: 0,
  notMarked: 0,
  totalSessions: 13,
  termName: 'Term 1',
  termStartDate: '2026-01-01',
  termEndDate: '2026-05-01',
};

const defaultTimeline: TimelineRecord[] = [
  { date: '2026-02-20', time: '08:00', status: 'PRESENT' },
  { date: '2026-02-19', time: '08:00', status: 'ABSENT' },
];

// eslint-disable-next-line max-lines-per-function
describe('parent screens smoke test', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseStudents.mockReturnValue({
      data: [{ id: 'student-1', fullName: 'Sara Ali', gradeLevel: 'Grade 5' }],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseLinkStudent.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      error: null,
      reset: jest.fn(),
    } as any);

    mockUseStudentDetails.mockReturnValue({
      data: {
        id: 'student-1',
        fullName: 'Sara Ali',
        gradeLevel: 'Grade 5',
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseAttendance.mockReturnValue({
      data: [
        { sessionDate: '2026-02-20', sessionName: 'Math', status: 'PRESENT' },
      ] as AttendanceRecord[],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseAttendanceStats.mockReturnValue({
      data: defaultStats,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseAttendanceTimeline.mockReturnValue({
      data: defaultTimeline,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseChildSummaryHero.mockReturnValue({
      student: { id: 'student-1', fullName: 'Sara Ali', gradeLevel: 'Grade 5' },
      attendanceStats: defaultStats,
      recentTimeline: defaultTimeline,
      isLoading: false,
      error: null,
    } as any);

    mockUseCurrentSession.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseUpcomingSessions.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  it('renders dashboard in success state', () => {
    renderWithTheme(<ParentDashboardScreen />);

    // Redesigned dashboard: ChildSwitcher pill (testID) + child first name.
    expect(screen.getByTestId('child-pill-student-1')).toBeTruthy();
    expect(screen.getByText('Sara')).toBeTruthy();
  });

  it('renders dashboard loading state', () => {
    mockUseStudents.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any);

    renderWithTheme(<ParentDashboardScreen />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders dashboard empty state', () => {
    mockUseStudents.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    renderWithTheme(<ParentDashboardScreen />);

    expect(screen.getByText('No Students Linked')).toBeTruthy();
  });

  it('renders link-student screen', () => {
    renderWithTheme(<LinkStudentScreen />);

    expect(screen.getByTestId('access-code-input')).toBeTruthy();
    expect(screen.getByText('Link Your Student')).toBeTruthy();
  });

  it('renders student list screen', () => {
    renderWithTheme(<StudentListScreen />);

    expect(screen.getByText('Sara Ali')).toBeTruthy();
  });

  it('renders student details screen', () => {
    renderWithTheme(<StudentDetailsScreen />);

    expect(screen.getByText('Sara Ali')).toBeTruthy();
    expect(screen.getByText('View Attendance')).toBeTruthy();
  });

  it('renders attendance screen', () => {
    renderWithTheme(<StudentAttendanceScreen />);

    expect(screen.getByText('Math')).toBeTruthy();
    expect(screen.getByText('Present')).toBeTruthy();
  });
});
