import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui';
import colors from '@/components/ui/colors';
import { PushDisabledBanner } from '../push-disabled-banner';
import { NotificationHeader } from './notification-header';

function StateFrame({ isRTL, onBack, children }: { isRTL: boolean; onBack: () => void; children: React.ReactNode }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      <PushDisabledBanner />
      <NotificationHeader isRTL={isRTL} onBack={onBack} />
      {children}
    </SafeAreaView>
  );
}

export function NotificationLoadingState({ isRTL, onBack }: { isRTL: boolean; onBack: () => void }) {
  return (
    <StateFrame isRTL={isRTL} onBack={onBack}>
      <View className="flex-1 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            className={`mb-3 flex-row items-start rounded-2xl border p-4 shadow-sm ${isRTL ? 'flex-row-reverse' : ''}`}
            style={{ backgroundColor: colors.neutral.card, borderColor: colors.neutral.rule }}
          >
            <View className={isRTL ? 'ms-3' : 'me-3'}>
              <Skeleton width={48} height={48} radius={24} />
            </View>
            <View className="flex-1 gap-2">
              <Skeleton width="66%" height={16} />
              <Skeleton width="100%" height={12} />
              <Skeleton width="80%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </StateFrame>
  );
}

export function NotificationErrorState({
  isRTL,
  onBack,
  onRetry,
}: {
  isRTL: boolean;
  onBack: () => void;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  return (
    <StateFrame isRTL={isRTL} onBack={onBack}>
      <View className="flex-1 justify-center">
        <ErrorState
          title={t('parent.notifications.errorTitle', 'Oops! Something went wrong')}
          body={t('parent.notifications.error', 'We could not load your notifications. Please try again.')}
          action={{ label: t('parent.common.retry', 'Retry'), onPress: onRetry }}
          testID="notification-error"
        />
      </View>
    </StateFrame>
  );
}

export function NotificationEmptyState({ isRTL, onBack }: { isRTL: boolean; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <StateFrame isRTL={isRTL} onBack={onBack}>
      <View className="flex-1 justify-center">
        <EmptyState
          scope="parentNoNotifications"
          title={t('parent.notifications.emptyTitle', 'All caught up!')}
          body={t('parent.notifications.empty', 'You have no new notifications at the moment.')}
          testID="notification-empty"
        />
      </View>
    </StateFrame>
  );
}
