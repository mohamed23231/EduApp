import type * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import {
  useCreateStudent,
  useDeleteStudent,
  useOrganization,
  useOrgStudents,
  useRegenerateStudentCode,
  useUpdateStudent,
} from '../../hooks';
import { StudentsScreen } from '../students-screen';

jest.mock('react-i18next');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('@/components/ui', () => {
  const React = require('react');
  const { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } = require('react-native');

  return {
    ActivityIndicator,
    Button: ({ label, children, onPress }: { label?: string; children?: React.ReactNode; onPress?: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{label ?? children}</Text>
      </Pressable>
    ),
    Input: ({ label, value, onChangeText }: { label: string; value?: string; onChangeText?: (value: string) => void }) => (
      <View>
        <Text>{label}</Text>
        <TextInput value={value} onChangeText={onChangeText} />
      </View>
    ),
    EmptyState: ({ title }: { title?: string }) => (
      <View>
        <Text>{title}</Text>
      </View>
    ),
    Modal: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    Monogram: () => null,
    OptionPickerSheet: () => null,
    Pressable,
    SafeAreaView: View,
    ScrollView,
    Select: ({ label, options = [] }: { label: string; options?: Array<{ label: string }> }) => (
      <View>
        <Text>{label}</Text>
        {options.map(option => <Text key={option.label}>{option.label}</Text>)}
      </View>
    ),
    Text,
    TopBar: ({ title }: { title?: string }) => (
      <View>
        <Text>{title}</Text>
      </View>
    ),
    View,
  };
});
jest.mock('@/components/ui/modal', () => ({
  useModal: () => ({ ref: { current: null }, present: jest.fn(), dismiss: jest.fn() }),
  Modal: ({ children }: { children?: React.ReactNode }) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));
jest.mock('@/components/ui/monogram', () => ({
  useMonogramTone: () => ({ bg: '#000', fg: '#fff' }),
  Monogram: () => null,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })),
}));
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));
jest.mock('../../hooks');
jest.mock('../../store/manager-store', () => ({
  useManagerStore: {
    use: {
      activeOrgId: jest.fn(() => 'org-1'),
    },
  },
}));
jest.mock('../../components', () => ({
  NoOrgEmptyState: () => {
    const { Text } = require('react-native');
    return <Text>no-org-empty-state</Text>;
  },
  LimitReachedError: ({ message }: { message: string | null }) => {
    const { Text } = require('react-native');
    return message ? <Text>{message}</Text> : null;
  },
  WhatsAppShareButton: ({ message }: { message: string }) => {
    const { Text } = require('react-native');
    return <Text>{message}</Text>;
  },
}));

describe('studentsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) =>
        options && 'count' in options
          ? `${key}:${options.count}`
          : key,
    });
    (useOrganization as jest.Mock).mockReturnValue({
      data: {
        currentStudents: 20,
        limits: { maxStudents: 20 },
      },
    });
    (useOrgStudents as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      data: {
        data: [
          {
            id: 'student-1',
            name: 'Ahmed',
            gradeLevel: 'grade5',
            connectionCode: 'CODE1234',
            hasParentLinked: true,
            assignedSessionsCount: 2,
          },
        ],
        meta: {
          total: 1,
        },
      },
    });
    (useCreateStudent as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    (useUpdateStudent as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    (useDeleteStudent as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
    (useRegenerateStudentCode as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the student list and the total count label', () => {
    render(<StudentsScreen />);

    expect(screen.getByText('manager.students.title')).toBeTruthy();
    expect(screen.getByText('Ahmed')).toBeTruthy();
    expect(screen.getByText('manager.students.countLabel:1')).toBeTruthy();
  });

  it('shows an empty state when there are no students', () => {
    (useOrgStudents as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      data: {
        data: [],
        meta: {
          total: 0,
        },
      },
    });

    render(<StudentsScreen />);

    expect(screen.getByText('manager.students.empty')).toBeTruthy();
  });

  it('surfaces the connection code via the student actions sheet', () => {
    render(<StudentsScreen />);

    expect(Clipboard.setStringAsync).toBeDefined();
    fireEvent(screen.getByLabelText('Ahmed'), 'longPress');
    expect(screen.getByText('CODE1234')).toBeTruthy();
  });
});
