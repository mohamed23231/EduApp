/**
 * ConnectionCodeCard — shows the student's connection code with Copy / WhatsApp actions.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Pressable, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

const APP_DOWNLOAD_URL = 'https://privatedu.app';

type ConnectionCodeCardProps = {
  name: string;
  connectionCode: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

export function ConnectionCodeCard({ name, connectionCode, t }: ConnectionCodeCardProps) {
  const c = colors;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(connectionCode);
    Alert.alert(
      t('manager.students.copiedTitle', { defaultValue: 'Copied' }),
      t('manager.students.copiedBody', { defaultValue: 'The connection code is ready to paste.' }),
    );
  };

  const handleWhatsApp = async () => {
    const message = `${name} - ${connectionCode}\n${APP_DOWNLOAD_URL}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
    else {
      await Clipboard.setStringAsync(message);
      Alert.alert(
        t('manager.whatsapp.copiedTitle', { defaultValue: 'Copied' }),
        t('manager.whatsapp.copiedBody', { defaultValue: 'WhatsApp is unavailable, message copied.' }),
      );
    }
  };

  return (
    <View
      className="mx-4 mb-4 items-center gap-1.5 rounded-2xl p-4"
      style={{ backgroundColor: c.semantic.infoSoft, borderWidth: 2, borderColor: `${c.semantic.info}40` }}
    >
      <Text style={{ fontSize: 11, color: c.semantic.info, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
        {t('manager.students.connectionCode', { defaultValue: 'Connection code' })}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: c.semantic.info, letterSpacing: 4, textAlign: 'center' }}>
        {connectionCode}
      </Text>
      <View className="mt-2 flex-row gap-2.5">
        <Pressable
          onPress={handleCopy}
          className="flex-row items-center gap-1.5 rounded-xl px-3.5 py-2"
          style={{ backgroundColor: c.neutral.card, borderWidth: 1, borderColor: c.neutral.rule }}
        >
          <Ionicons name="copy-outline" size={14} color={c.semantic.info} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: c.semantic.info }}>
            {t('manager.students.actions.copy', { defaultValue: 'Copy code' })}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleWhatsApp}
          className="flex-row items-center gap-1.5 rounded-xl px-3.5 py-2"
          style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' }}
        >
          <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#25D366' }}>
            {t('manager.whatsapp.share', { defaultValue: 'WhatsApp' })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
