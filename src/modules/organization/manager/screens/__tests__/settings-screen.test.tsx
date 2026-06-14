import type * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';
import { useOrganization, useOrganizations, useUpdateOrg } from '../../hooks';
import { SettingsScreen } from '../settings-screen';

jest.mock('react-i18next');
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
jest.mock('../../hooks');
jest.mock('../../store/manager-store', () => ({
  useManagerStore: {
    use: {
      activeOrgId: jest.fn(() => 'org-1'),
      setActiveOrgId: jest.fn(() => jest.fn()),
    },
  },
}));

describe('settingsScreen', () => {
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) =>
        options && 'source' in options
          ? `${key}:${options.source}`
          : options && 'date' in options
            ? `${key}:${options.date}`
            : key,
    });
    (useOrganizations as jest.Mock).mockReturnValue({
      data: { data: [{ id: 'org-1', name: 'Future Academy' }] },
    });
    (useOrganization as jest.Mock).mockReturnValue({
      isLoading: false,
      data: {
        id: 'org-1',
        name: 'Future Academy',
        phoneE164: '+201000000000',
        email: 'org@example.com',
        address: 'Cairo',
        entitlementSource: 'trial',
        currentStudents: 12,
        currentTeachers: 3,
        currentSessions: 4,
        currentSessionMinutes: 360,
        limits: {
          maxStudents: 20,
          maxTeachers: 5,
          maxSessions: 30,
          maxSessionMinutes: 3600,
        },
        trial: {
          endDate: '2026-03-20',
        },
      },
    });
    (useUpdateOrg as jest.Mock).mockReturnValue({
      mutateAsync,
      isPending: false,
    });
  });

  it('renders organization settings and usage details', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('manager.settings.title')).toBeTruthy();
    expect(screen.getByText('manager.settings.usage.title')).toBeTruthy();
    expect(screen.getByDisplayValue('Future Academy')).toBeTruthy();
  });

  it('submits updated organization settings', async () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('manager.settings.save'));

    expect(mutateAsync).toHaveBeenCalledWith({
      orgId: 'org-1',
      input: {
        name: 'Future Academy',
        phoneE164: '+201000000000',
        email: 'org@example.com',
        address: 'Cairo',
      },
    });
  });
});
