import { useTranslation } from 'react-i18next';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';

type AttendanceSheetHeaderProps = {
  sessionClosed: boolean;
  sessionNotActive: boolean;
  onBack: () => void;
};

export function AttendanceSheetHeader({ sessionClosed, sessionNotActive, onBack }: AttendanceSheetHeaderProps) {
  const { t } = useTranslation();
  return (
    <>
      <View className="flex-row items-center border-b border-[#E6E3DB] bg-[#FFFFFF] px-5 py-4">
        <TouchableOpacity onPress={onBack}>
          <Text className="me-3 text-base text-brand">{t('teacher.common.back')}</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-[#111827]">{t('teacher.attendance.title')}</Text>
      </View>

      {(sessionClosed || sessionNotActive) && (
        <View className="border-b border-[#FCD34D] bg-[#FEF08A] px-5 py-3">
          <Text className="text-body text-[#78350F]">
            {t(sessionClosed ? 'teacher.attendance.sessionClosed' : 'teacher.attendance.sessionNotActive')}
          </Text>
        </View>
      )}
    </>
  );
}
