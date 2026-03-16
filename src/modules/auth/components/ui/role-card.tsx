import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

type RoleOption = {
  value: string;
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconSelected: keyof typeof Ionicons.glyphMap;
};

type RoleCardProps = {
  roles: RoleOption[];
  selected: string | null;
  onSelect: (value: string) => void;
  overlineLabel?: string;
};

export const ROLE_OPTIONS: Record<string, RoleOption> = {
  TEACHER: {
    value: 'TEACHER',
    labelKey: 'auth.signup.teacherLabel',
    icon: 'book-outline',
    iconSelected: 'book',
  },
  PARENT: {
    value: 'PARENT',
    labelKey: 'auth.signup.parentLabel',
    icon: 'people-outline',
    iconSelected: 'people',
  },
  MANAGER: {
    value: 'MANAGER',
    labelKey: 'auth.signup.managerLabel',
    icon: 'business-outline',
    iconSelected: 'business',
  },
};

export function RoleCards({
  roles,
  selected,
  onSelect,
  overlineLabel,
}: RoleCardProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      {overlineLabel && (
        <Text className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
          {overlineLabel}
        </Text>
      )}
      <View className="flex-row gap-3">
        {roles.map((role) => {
          const isSelected = selected === role.value;
          return (
            <Pressable
              key={role.value}
              onPress={() => onSelect(role.value)}
              className={`flex-1 items-center rounded-xl border-2 py-4 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Ionicons
                name={isSelected ? role.iconSelected : role.icon}
                size={24}
                color={isSelected ? '#3478F6' : '#6B7280'}
              />
              <Text
                className={`mt-2 text-[13px] font-semibold ${
                  isSelected ? 'text-blue-500' : 'text-gray-700'
                }`}
              >
                {t(role.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
