import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, I18nManager, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

const AVATAR_COLORS = [
  '#3478F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() || '?';
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type StudentItemProps = {
  fullName: string;
  gradeLevel?: string;
  onPress: () => void;
};

function StudentItem({ fullName, gradeLevel, onPress }: StudentItemProps) {
  const avatarColor = getAvatarColor(fullName);
  const initials = getInitials(fullName);
  const chevronName = I18nManager.isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-xl border border-gray-200 bg-white p-4"
      accessibilityRole="button"
    >
      <View
        className="me-3 size-10 items-center justify-center rounded-full"
        style={{ backgroundColor: avatarColor }}
      >
        <Text className="text-sm font-bold text-white">{initials}</Text>
      </View>

      <View className="flex-1">
        <Text className="text-[15px] font-semibold text-gray-900">{fullName}</Text>
        {gradeLevel
          ? (
              <Text className="mt-0.5 text-[13px] text-gray-500">{gradeLevel}</Text>
            )
          : null}
      </View>

      <Ionicons name={chevronName} size={18} color="#9CA3AF" />
    </Pressable>
  );
}

type ListHeaderProps = {
  title: string;
  backLabel: string;
  addLabel: string;
  onBack: () => void;
  onAdd: () => void;
};

function ListHeader({ title, backLabel, addLabel, onBack, onAdd }: ListHeaderProps) {
  return (
    <View className="flex-row items-center px-4 pt-2 pb-4">
      <Pressable
        onPress={onBack}
        className="size-10 items-center justify-center rounded-full border border-gray-200"
        accessibilityRole="button"
        accessibilityLabel={backLabel}
      >
        <Ionicons name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color="#111827" />
      </Pressable>
      <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
        {title}
      </Text>
      <Pressable
        onPress={onAdd}
        className="size-10 items-center justify-center rounded-full border border-gray-200"
        accessibilityRole="button"
        accessibilityLabel={addLabel}
      >
        <Ionicons name="add" size={22} color="#111827" />
      </Pressable>
    </View>
  );
}

/**
 * StudentListScreen component
 * Displays all students linked to the authenticated parent
 * Implements four-state pattern: loading, empty, success, error
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export function StudentListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: students, isLoading, error, refetch } = useStudents();

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
        <View className="flex-1 items-center justify-center" testID="loading-indicator">
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    const errorMessage = extractErrorMessage(error, t);
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
        <View className="flex-1 items-center justify-center px-4">
          <View className="mb-4 size-20 items-center justify-center rounded-full bg-red-50">
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          </View>
          <Text className="mb-2 text-center text-[15px] font-semibold text-red-600">
            {errorMessage}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-4 h-[52px] items-center justify-center rounded-xl bg-gray-900 px-8"
            accessibilityRole="button"
          >
            <Text className="text-[15px] font-semibold text-white">
              {t('parent.common.retry')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!students || students.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
        <View className="flex-row items-center px-4 pt-2 pb-4">
          <Pressable
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-full border border-gray-200"
            accessibilityRole="button"
            accessibilityLabel={t('parent.common.back')}
          >
            <Ionicons name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color="#111827" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-gray-900">
            {t('parent.studentList.title')}
          </Text>
          <View className="size-10" />
        </View>

        <View className="flex-1 items-center justify-center px-4">
          <View className="mb-4 size-20 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="people-outline" size={40} color="#9CA3AF" />
          </View>
          <Text className="mb-2 text-[22px] font-bold text-gray-900">
            {t('parent.studentList.emptyTitle')}
          </Text>
          <Text className="mb-6 text-center text-[15px] text-gray-500">
            {t('parent.studentList.emptyMessage')}
          </Text>
          <Pressable
            onPress={() => router.push('/(parent)/students/link')}
            className="h-[52px] items-center justify-center rounded-xl bg-gray-900 px-8"
            accessibilityRole="button"
          >
            <Text className="text-[15px] font-semibold text-white">
              {t('parent.dashboard.linkStudentCta')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
      <ListHeader
        title={t('parent.studentList.title')}
        backLabel={t('parent.common.back')}
        addLabel={t('parent.dashboard.linkStudentCta')}
        onBack={() => router.back()}
        onAdd={() => router.push('/(parent)/students/link')}
      />

      <FlatList
        data={students}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <StudentItem
            fullName={item.fullName}
            gradeLevel={item.gradeLevel}
            onPress={() => router.push(AppRoute.parent.studentDetails(item.id))}
          />
        )}
      />
    </SafeAreaView>
  );
}
