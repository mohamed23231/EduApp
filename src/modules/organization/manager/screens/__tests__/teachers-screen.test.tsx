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
    SafeAreaView: View,
    ScrollView,
    Text,
    View,
  };
});
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
    expect(screen.getByText('invite-teacher-modal')).toBeTruthy();
  });

  it('renders the pending empty state when there are no invitations', () => {
    (useOrgInvitations as jest.Mock).mockReturnValue({
      isLoading: false,
      data: { data: [] },
    });

    render(<TeachersScreen />);

    expect(screen.getByText('manager.teachers.pendingEmpty')).toBeTruthy();
  });
});
