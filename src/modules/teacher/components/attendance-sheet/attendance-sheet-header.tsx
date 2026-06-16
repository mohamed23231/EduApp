import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type AttendanceSheetHeaderProps = {
  sessionClosed: boolean;
  sessionNotActive: boolean;
  onBack: () => void;
};

export function AttendanceSheetHeader({ sessionClosed, sessionNotActive, onBack }: AttendanceSheetHeaderProps) {
  const { t } = useTranslation();
  return (
    <>
      <View className="flex-row items-center border-b px-5 py-4" style={{ borderBottomColor: colors.neutral.rule, backgroundColor: colors.neutral.card }}>
        <TouchableOpacity onPress={onBack}>
          <Text className="me-3 text-base text-brand">{t('teacher.common.back')}</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold" style={{ color: colors.neutral.ink }}>{t('teacher.attendance.title')}</Text>
      </View>

      {(sessionClosed || sessionNotActive) && (
        <View className="border-b px-5 py-3" style={{ borderBottomColor: colors.semantic.excused, backgroundColor: colors.semantic.excusedSoft }}>
          <Text className="text-body" style={{ color: colors.semantic.excusedInk }}>
            {t(sessionClosed ? 'teacher.attendance.sessionClosed' : 'teacher.attendance.sessionNotActive')}
          </Text>
        </View>
      )}
    </>
  );
}
