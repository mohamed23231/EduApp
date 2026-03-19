import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import { Button, Text } from '@/components/ui';

type EmptyDashboardProps = {
  onLinkStudent: () => void;
};

export function EmptyDashboard({ onLinkStudent }: EmptyDashboardProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-6 items-center">
        <LottieView
          source={require('@assets/lottie/education-welcome.json')}
          autoPlay
          loop
          renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
          style={{ width: 200, height: 160 }}
        />
      </View>

      <Text className="mb-2 text-center text-[22px] font-bold text-gray-900">
        {t('parent.dashboard.emptyTitle')}
      </Text>

      <Text className="mb-8 text-center text-[15px]/6 text-gray-500">
        {t('parent.dashboard.emptyMessage')}
      </Text>

      <Button
        label={t('parent.dashboard.linkStudentCta')}
        onPress={onLinkStudent}
        testID="link-student-cta"
        className="h-[52px] rounded-xl"
      />
    </View>
  );
}
