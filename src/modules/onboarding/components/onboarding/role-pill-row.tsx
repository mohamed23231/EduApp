import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import colors from '@/components/ui/colors';
import { UserRole } from '@/core/auth/roles';
import { RolePillInk } from './role-pill-ink';

type Role = UserRole.TEACHER | UserRole.PARENT;

const ROLE_OPTIONS: Array<{ value: Role; labelKey: string; icon: 'graduationCap' | 'users' }> = [
  { value: UserRole.TEACHER, labelKey: 'auth.signup.teacherLabel', icon: 'graduationCap' },
  { value: UserRole.PARENT, labelKey: 'auth.signup.parentLabel', icon: 'users' },
];

type RolePillRowProps = {
  isRTL: boolean;
  selectedRole: Role | null;
  onSelect: (role: Role) => void;
};

export function RolePillRow({ isRTL, selectedRole, onSelect }: RolePillRowProps) {
  const { t } = useTranslation();
  return (
    <View>
      <Text
        style={{
          color: colors.neutral.inkMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          marginBottom: 8,
          marginStart: 2,
          textAlign: isRTL ? 'right' : 'left',
          writingDirection: isRTL ? 'rtl' : 'ltr',
        }}
      >
        {t('auth.signup.roleLabel')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {ROLE_OPTIONS.map(option => (
          <RolePillInk
            key={option.value}
            selected={selectedRole === option.value}
            label={t(option.labelKey)}
            iconName={option.icon}
            onPress={() => onSelect(option.value)}
            testID={`role-card-${option.value.toLowerCase()}`}
          />
        ))}
      </View>
    </View>
  );
}
