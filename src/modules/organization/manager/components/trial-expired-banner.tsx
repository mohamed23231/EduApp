import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { Button, Text, View } from '@/components/ui';

export function TrialExpiredBanner({
  visible,
  onCreateNewOrg,
}: {
  visible: boolean;
  onCreateNewOrg?: () => void;
}) {
  const { t } = useTranslation();

  if (!visible) {
    return null;
  }

  const supportEmail = t('manager.trialBanner.supportEmail', {
    defaultValue: 'support@privatedulink.com',
  });

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${supportEmail}`);
  };

  return (
    <View className="mb-4 rounded-3xl border border-amber-300 bg-amber-50 p-4">
      <Text className="font-inter text-base font-semibold text-amber-900">
        {t('manager.trialBanner.title', { defaultValue: 'Trial expired' })}
      </Text>
      <Text className="font-inter mt-1 text-sm text-amber-800">
        {t('manager.trialBanner.body', {
          defaultValue: 'This organization is now read-only until a subscription is activated.',
        })}
      </Text>
      <View className="mt-3 flex-row gap-3">
        <Button
          variant="outline"
          size="sm"
          label={t('manager.trialBanner.contactSupport', { defaultValue: 'Contact support' })}
          onPress={handleContactSupport}
          fullWidth={false}
        />
        {onCreateNewOrg
          ? (
              <Button
                size="sm"
                label={t('manager.trialBanner.createNew', { defaultValue: 'Create new org' })}
                onPress={onCreateNewOrg}
                fullWidth={false}
              />
            )
          : null}
      </View>
    </View>
  );
}
