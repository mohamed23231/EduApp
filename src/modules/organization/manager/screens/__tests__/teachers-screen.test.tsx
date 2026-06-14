import type * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';
import {
  useCancelInvitation,
  useOrganizations,
  useOrgInvitations,
  useOrgMembers,
  useRemoveMember,
  useResendInvitation,
} from '../../hooks';
import { TeachersScreen } from '../teachers-screen';

jest.mock('react-i18next');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('@/components/ui', () => {
  const React = require('react');
  const { ActivityIndicator, Pressable, ScrollView, Text, View } = require('react-native');

  return {
    ActivityIndicator,
    Button: ({ label, children, onPress }: { label?: string; children?: React.ReactNode; onPress?: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{label ?? children}</Text>
      </Pressable>
    ),
    EmptyState: ({ title }: { title?: string }) => (
      <View>
        <Text>{title}</Text>
      </View>
    ),
    Modal: ({ children }: { children?: React.ReactNode }) => <View>{children}</View>,
    Monogram: () => null,
    Pressable,
    SafeAreaView: View,
    ScrollView,
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
jest.mock('../../hooks');
jest.mock('../../store/manager-store', () => ({
  useManagerStore: {
    use: {
      activeOrgId: jest.fn(() => 'org-1'),
      setActiveOrgId: jest.fn(() => jest.fn()),
    },
  },
}));
jest.mock('../../components', () => ({
  NoOrgEmptyState: () => {
    const { Text } = require('react-native');
    return <Text>no-org-empty-state</Text>;
  },
  InviteTeacherModal: () => {
    const { Text } = require('react-native');
    return <Text>invite-teacher-modal</Text>;
  },
}));

describe('teachersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) =>
        options && 'count' in options
          ? `${key}:${options.count}`
          : options && 'date' in options
            ? `${key}:${options.date}`
            : key,
    });
    (useOrganizations as jest.Mock).mockReturnValue({
      data: { data: [{ id: 'org-1', name: 'Future Academy' }] },
    });
    (useOrgMembers as jest.Mock).mockReturnValue({
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      data: {
        data: [
          {
            id: 'member-1',
            name: 'Sara',
            role: 'TEACHER',
            activeSessionsCount: 3,
          },
        ],
      },
    });
    (useOrgInvitations as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        data: [
          {
            id: 'invite-1',
            inviteeEmail: 'teacher@example.com',
            inviteePhone: null,
            expiresAt: '2026-03-20T00:00:00.000Z',
          },
        ],
      },
    });
    (useRemoveMember as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    (useCancelInvitation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    (useResendInvitation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it('renders members and pending invitations', () => {
    render(<TeachersScreen />);

    expect(screen.getByText('manager.teachers.title')).toBeTruthy();
    expect(screen.getByText('Sara')).toBeTruthy();
    expect(screen.getByText('teacher@example.com')).toBeTruthy();
    expect(screen.getByText('manager.teachers.pendingTitle')).toBeTruthy();
    expect(screen.getByLabelText('manager.teachers.inviteTitle')).toBeTruthy();
  });

  it('hides the pending section when there are no invitations', () => {
    (useOrgInvitations as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { data: [] },
    });

    render(<TeachersScreen />);

    expect(screen.getByText('Sara')).toBeTruthy();
    expect(screen.queryByText('manager.teachers.pendingTitle')).toBeNull();
  });
});
