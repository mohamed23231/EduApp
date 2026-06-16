import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Button, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type AttendanceSheetFooterProps = {
  isSubmitting: boolean;
  disabled: boolean;
  error: string | null;
  onSubmit: () => void;
};

export function AttendanceSheetFooter({ isSubmitting, disabled, error, onSubmit }: AttendanceSheetFooterProps) {
  const { t } = useTranslation();
  return (
    <View className="gap-3 border-t px-5 py-4" style={{ borderTopColor: colors.neutral.rule, backgroundColor: colors.neutral.card }}>
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
