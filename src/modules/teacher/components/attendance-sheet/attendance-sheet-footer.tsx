import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';

type AttendanceSheetFooterProps = {
  isSubmitting: boolean;
  disabled: boolean;
  error: string | null;
  onSubmit: () => void;
};

export function AttendanceSheetFooter({ isSubmitting, disabled, error, onSubmit }: AttendanceSheetFooterProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-3 border-t border-[#E5E7EB] bg-white px-5 py-4">
      <Button
        label={isSubmitting ? t('teacher.attendance.submitting') : t('teacher.attendance.submitButton')}
        onPress={onSubmit}
        loading={isSubmitting}
        disabled={disabled}
        variant="default"
      />
      {error && (
        <Text className="text-center text-xs text-absent">{error}</Text>
      )}
    </View>
  );
}
