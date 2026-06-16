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
          className="mx-5 mt-3 flex-row items-center gap-2 rounded-[10px] border border-[#FCD34D] bg-[#FFFBEB] px-3.5 py-3"
          onPress={onBatchRatingPress}
        >
          <Ionicons name="flash" size={18} color="#F59E0B" />
          <Text className="flex-1 text-sm font-medium text-[#92400E]">
            {t('teacher.attendance.batchRatingButton', { count: unratedCount })}
          </Text>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#6B7280" />
        </Pressable>
      )}

      {showSearch && (
        <View className="mx-5 mt-3 flex-row items-center gap-2.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2.5">
          <Ionicons name="search" size={18} color={colors.neutral.dim} />
          <TextInput
            className="flex-1 p-0 text-body-lg text-[#111827]"
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
