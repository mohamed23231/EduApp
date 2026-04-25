import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import colors from '@/components/ui/colors';

type EmptyStateScope
  = | 'teacherNoSessions'
    | 'teacherNoStudents'
    | 'parentNoChildren'
    | 'parentNoAttendance'
    | 'parentNoNotifications'
    | 'managerNoOrg'
    | 'managerNoStudents'
    | 'managerNoSessions'
    | 'managerNoTeachers'
    | 'generic';

type EmptyStateProps = {
  scope?: EmptyStateScope;
  icon?: React.ReactNode;
  title?: string;
  body?: string;
  action?: { label: string; onPress: () => void };
  tone?: 'default' | 'lime';
  testID?: string;
};

const SCOPE_DEFAULTS: Record<
  EmptyStateScope,
  { icon: string; title: string; body: string }
> = {
  teacherNoSessions: {
    icon: 'calendar-outline',
    title: 'No sessions yet',
    body: 'Create your first session to get started.',
  },
  teacherNoStudents: {
    icon: 'people-outline',
    title: 'No students yet',
    body: 'Share your connection code to add students.',
  },
  parentNoChildren: {
    icon: 'person-outline',
    title: 'No children linked',
    body: 'Link a child to start tracking their progress.',
  },
  parentNoAttendance: {
    icon: 'calendar-outline',
    title: 'No attendance records',
    body: 'Attendance will appear here after sessions.',
  },
  parentNoNotifications: {
    icon: 'notifications-outline',
    title: 'No notifications',
    body: 'You\'re all caught up!',
  },
  managerNoOrg: {
    icon: 'business-outline',
    title: 'No organization',
    body: 'Set up your organization to get started.',
  },
  managerNoStudents: {
    icon: 'people-outline',
    title: 'No students yet',
    body: 'Students will appear here once added.',
  },
  managerNoSessions: {
    icon: 'calendar-outline',
    title: 'No sessions yet',
    body: 'Sessions will appear here once scheduled.',
  },
  managerNoTeachers: {
    icon: 'people-outline',
    title: 'No teachers yet',
    body: 'Add teachers to your organization.',
  },
  generic: {
    icon: 'sparkles-outline',
    title: 'Nothing here',
    body: 'Check back later.',
  },
};

export function EmptyState({
  scope = 'generic',
  icon,
  title,
  body,
  action,
  tone = 'default',
  testID,
}: EmptyStateProps) {
  const defaults = SCOPE_DEFAULTS[scope];
  const resolvedTitle = title ?? defaults.title;
  const resolvedBody = body ?? defaults.body;

  const iconTint = tone === 'lime' ? colors.brand.primary : colors.neutral.inkMuted;

  return (
    <View
      testID={testID}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor:
            tone === 'lime'
              ? `${colors.brand.primary}1A`
              : `${colors.neutral.inkMuted}1A`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {icon ?? (
          <Text
            style={{
              fontSize: 22,
              color: iconTint,
            }}
          >
            ✦
          </Text>
        )}
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.neutral.ink,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {resolvedTitle}
      </Text>

      <Text
        style={{
          fontSize: 14,
          fontWeight: '400',
          color: colors.neutral.inkMuted,
          textAlign: 'center',
          lineHeight: 20,
          marginStart: 16,
          marginEnd: 16,
        }}
      >
        {resolvedBody}
      </Text>

      {action
        ? (
            <Pressable
              testID={testID ? `${testID}-action` : undefined}
              onPress={action.onPress}
              style={{
                marginTop: 20,
                backgroundColor: colors.brand.primary,
                borderRadius: colors.radii.r1,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: colors.brand.primaryInk,
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          )
        : null}
    </View>
  );
}
