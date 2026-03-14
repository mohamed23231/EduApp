import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { Alert, Linking } from 'react-native';
import { Button } from '@/components/ui';

export function WhatsAppShareButton({
  message,
}: {
  message: string;
}) {
  const { t } = useTranslation();

  const handlePress = async () => {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/?text=${encodedMessage}`;
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    await Clipboard.setStringAsync(message);
    Alert.alert(
      t('manager.whatsapp.copiedTitle', { defaultValue: 'Copied' }),
      t('manager.whatsapp.copiedBody', {
        defaultValue: 'WhatsApp is unavailable, so the message was copied.',
      }),
    );
  };

  return (
    <Button
      variant="outline"
      label={t('manager.whatsapp.share', { defaultValue: 'Share via WhatsApp' })}
      onPress={handlePress}
    />
  );
}
