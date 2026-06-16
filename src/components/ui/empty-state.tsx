import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  { icon: string; titleKey: string; bodyKey: string }
> = {
  teacherNoSessions: {
    icon: 'calendar-outline',
    titleKey: 'emptyState.teacherNoSessions_title',
    bodyKey: 'emptyState.teacherNoSessions_body',
  },
  teacherNoStudents: {
    icon: 'people-outline',
    titleKey: 'emptyState.teacherNoStudents_title',
    bodyKey: 'emptyState.teacherNoStudents_body',
  },
  parentNoChildren: {
    icon: 'person-outline',
    titleKey: 'emptyState.parentNoChildren_title',
    bodyKey: 'emptyState.parentNoChildren_body',
  },
  parentNoAttendance: {
    icon: 'calendar-outline',
    titleKey: 'emptyState.parentNoAttendance_title',
    bodyKey: 'emptyState.parentNoAttendance_body',
  },
  parentNoNotifications: {
    icon: 'notifications-outline',
    titleKey: 'emptyState.parentNoNotifications_title',
    bodyKey: 'emptyState.parentNoNotifications_body',
  },
  managerNoOrg: {
    icon: 'business-outline',
    titleKey: 'emptyState.managerNoOrg_title',
    bodyKey: 'emptyState.managerNoOrg_body',
  },
  managerNoStudents: {
    icon: 'people-outline',
    titleKey: 'emptyState.managerNoStudents_title',
    bodyKey: 'emptyState.managerNoStudents_body',
  },
  managerNoSessions: {
    icon: 'calendar-outline',
    titleKey: 'emptyState.managerNoSessions_title',
    bodyKey: 'emptyState.managerNoSessions_body',
  },
  managerNoTeachers: {
    icon: 'people-outline',
    titleKey: 'emptyState.managerNoTeachers_title',
    bodyKey: 'emptyState.managerNoTeachers_body',
  },
  generic: {
    icon: 'sparkles-outline',
    titleKey: 'emptyState.generic_title',
    bodyKey: 'emptyState.generic_body',
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
  const { t } = useTranslation();
  const defaults = SCOPE_DEFAULTS[scope];
  const resolvedTitle = title ?? t(defaults.titleKey);
  const resolvedBody = body ?? t(defaults.bodyKey);

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
              accessibilityRole="button"
              accessibilityLabel={action.label}
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
