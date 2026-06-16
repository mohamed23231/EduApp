import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, TextInput, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type AttendanceSheetToolbarProps = {
  showBatchRating: boolean;
  showSearch: boolean;
  unratedCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onBatchRatingPress: () => void;
};

export function AttendanceSheetToolbar({
  showBatchRating,
  showSearch,
  unratedCount,
  searchQuery,
  onSearchChange,
  onBatchRatingPress,
}: AttendanceSheetToolbarProps) {
  const { t } = useTranslation();
  return (
    <>
      {showBatchRating && (
        <Pressable
          className="mx-5 mt-3 flex-row items-center gap-2 rounded-[10px] border px-3.5 py-3"
          style={{ borderColor: colors.semantic.excused, backgroundColor: colors.semantic.excusedSoft }}
          onPress={onBatchRatingPress}
        >
          <Ionicons name="flash" size={18} color={colors.semantic.excused} />
          <Text className="flex-1 text-sm font-medium" style={{ color: colors.semantic.excusedInk }}>
            {t('teacher.attendance.batchRatingButton', { count: unratedCount })}
          </Text>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.neutral.inkMuted} />
        </Pressable>
      )}

      {showSearch && (
        <View className="mx-5 mt-3 flex-row items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5" style={{ borderColor: colors.neutral.rule, backgroundColor: colors.neutral.card }}>
          <Ionicons name="search" size={18} color={colors.neutral.dim} />
          <TextInput
            className="flex-1 p-0 text-body-lg"
            style={{ color: colors.neutral.ink }}
            placeholder={t('teacher.attendance.searchStudent')}
            placeholderTextColor={colors.neutral.dim}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={18} color={colors.neutral.dim} />
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}
