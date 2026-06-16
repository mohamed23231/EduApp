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
    <View className="mb-4 rounded-3xl border border-excused bg-excused-soft p-4">
      <Text className="font-inter text-base font-semibold text-excused-ink">
        {t('manager.trialBanner.title', { defaultValue: 'Trial expired' })}
      </Text>
      <Text className="mt-1 font-inter text-sm text-excused-ink">
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
