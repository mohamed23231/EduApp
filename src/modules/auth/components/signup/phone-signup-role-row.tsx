import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import colors from '@/components/ui/colors';
import { UserRole } from '@/core/auth/roles';
import { RolePill } from './role-pill';

/**
 * Role selector row (label + teacher/parent/manager pills) for the phone-signup
 * details step. Extracted to keep `PhoneSignupDetailsStep` under the
 * `max-lines-per-function` cap.
 */

const ROLE_OPTIONS: Array<{
  value: UserRole.TEACHER | UserRole.PARENT | UserRole.MANAGER;
  labelKey: 'auth.signup.teacherLabel' | 'auth.signup.parentLabel' | 'auth.signup.managerLabel';
  icon: 'graduationCap' | 'users' | 'building';
}> = [
  { value: UserRole.TEACHER, labelKey: 'auth.signup.teacherLabel', icon: 'graduationCap' },
  { value: UserRole.PARENT, labelKey: 'auth.signup.parentLabel', icon: 'users' },
  { value: UserRole.MANAGER, labelKey: 'auth.signup.managerLabel', icon: 'building' },
];

export type PhoneSignupRoleRowProps = {
  isRTL: boolean;
  role: UserRole | '';
  onRoleChange: (value: UserRole) => void;
};

export function PhoneSignupRoleRow({ isRTL, role, onRoleChange }: PhoneSignupRoleRowProps) {
  const { t } = useTranslation();

  return (
    <View>
      <Text
        style={{
          color: colors.neutral.dim,
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
          <RolePill
            key={option.value}
            selected={role === option.value}
            label={t(option.labelKey)}
            iconName={option.icon}
            onPress={() => onRoleChange(option.value)}
            testID={`phone-signup-role-${option.value.toLowerCase()}`}
          />
        ))}
      </View>
    </View>
  );
}
