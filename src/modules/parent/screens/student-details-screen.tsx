import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, I18nManager, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { useStudentDetails } from '../hooks';
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

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  showDivider: boolean;
};

function InfoRow({ icon, label, value, showDivider }: InfoRowProps) {
  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3.5">
        <View className="flex-1 flex-row items-center">
          <View className="me-3 size-8 items-center justify-center rounded-lg bg-gray-100">
            <Ionicons name={icon} size={18} color="#6B7280" />
          </View>
          <Text className="text-[15px] font-medium text-gray-700">{label}</Text>
        </View>
        <Text className="shrink-0 text-sm text-gray-500">{value}</Text>
      </View>
      {showDivider && <View className="ms-[56px] h-px bg-gray-200" />}
    </>
  );
}

type ScreenHeaderProps = {
  title: string;
  backLabel: string;
  onBack: () => void;
};

function ScreenHeader({ title, backLabel, onBack }: ScreenHeaderProps) {
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
      <View className="size-10" />
    </View>
  );
}

type CenteredStatusProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgClassName: string;
  message: string;
  messageClassName: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
};

function CenteredStatus({ icon, iconColor, bgClassName, message, messageClassName, actionLabel, onAction, testID }: CenteredStatusProps) {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
      <View className="flex-1 items-center justify-center px-4" testID={testID}>
        <View className={`mb-4 size-20 items-center justify-center rounded-full ${bgClassName}`}>
          <Ionicons name={icon} size={40} color={iconColor} />
        </View>
        <Text className={`mb-2 text-center text-[15px] font-semibold ${messageClassName}`}>
          {message}
        </Text>
        {actionLabel && onAction && (
          <Pressable
            onPress={onAction}
            className="mt-4 h-[52px] items-center justify-center rounded-xl bg-gray-900 px-8"
            accessibilityRole="button"
          >
            <Text className="text-[15px] font-semibold text-white">{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

type InfoField = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function buildInfoFields(
  student: { gradeLevel?: string; email?: string; phone?: string; enrollmentDate?: string },
  t: (key: string) => string,
): InfoField[] {
  const fields: InfoField[] = [];

  if (student.gradeLevel) {
    fields.push({ icon: 'school-outline', label: t('parent.studentDetails.labels.grade'), value: student.gradeLevel });
  }
  if (student.email) {
    fields.push({ icon: 'mail-outline', label: t('parent.studentDetails.labels.email'), value: student.email });
  }
  if (student.phone) {
    fields.push({ icon: 'call-outline', label: t('parent.studentDetails.labels.phone'), value: student.phone });
  }
  if (student.enrollmentDate) {
    fields.push({ icon: 'calendar-outline', label: t('parent.studentDetails.labels.enrollmentDate'), value: student.enrollmentDate });
  }

  return fields;
}

/**
 * StudentDetailsScreen component
 * Displays detailed information about a linked student
 * Implements four-state pattern: loading, empty, success, error
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 */
export function StudentDetailsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: student, isLoading, error, refetch } = useStudentDetails(id || '');
  const { isParentPerformanceEnabled } = useFeatureFlags();
  if (!id) {
    return (
      <CenteredStatus
        icon="alert-circle-outline"
        iconColor="#EF4444"
        bgClassName="bg-red-50"
        message={t('parent.common.genericError')}
        messageClassName="text-red-600"
      />
    );
  }
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
    return (
      <CenteredStatus
        icon="alert-circle-outline"
        iconColor="#EF4444"
        bgClassName="bg-red-50"
        message={extractErrorMessage(error, t)}
        messageClassName="text-red-600"
        actionLabel={t('parent.common.retry')}
        onAction={() => refetch()}
      />
    );
  }
  if (!student) {
    return (
      <CenteredStatus
        icon="person-outline"
        iconColor="#9CA3AF"
        bgClassName="bg-gray-100"
        message={t('parent.common.genericError')}
        messageClassName="text-gray-900"
      />
    );
  }

  const infoFields = buildInfoFields(student, t);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1 }} className="bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('parent.studentDetails.title')}
          backLabel={t('parent.common.back')}
          onBack={() => router.back()}
        />

        <View className="items-center pt-2 pb-6">
          <View
            className="mb-3 size-20 items-center justify-center rounded-full"
            style={{ backgroundColor: getAvatarColor(student.fullName) }}
          >
            <Text className="text-[28px] font-bold text-white">{getInitials(student.fullName)}</Text>
          </View>
          <Text className="text-center text-[22px] font-bold text-gray-900">{student.fullName}</Text>
        </View>

        {infoFields.length > 0 && (
          <View className="mx-4 mb-6 rounded-xl border border-gray-200 bg-white">
            {infoFields.map((field, index) => (
              <InfoRow
                key={field.icon}
                icon={field.icon}
                label={field.label}
                value={field.value}
                showDivider={index < infoFields.length - 1}
              />
            ))}
          </View>
        )}

        <View className="gap-3 px-4 pb-8">
          <Pressable
            onPress={() => router.push(AppRoute.parent.studentAttendance(id))}
            className="h-[52px] items-center justify-center rounded-xl bg-gray-900"
            accessibilityRole="button"
          >
            <Text className="text-[15px] font-semibold text-white">{t('parent.studentDetails.viewAttendance')}</Text>
          </Pressable>

          {isParentPerformanceEnabled && (
            <Pressable
              onPress={() => router.push(AppRoute.parent.studentPerformance(id) as any)}
              className="h-[52px] items-center justify-center rounded-xl border border-gray-300 bg-white"
              accessibilityRole="button"
            >
              <Text className="text-[15px] font-semibold text-gray-900">{t('parent.performance.title')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
