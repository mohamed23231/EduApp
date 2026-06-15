/**
 * CodeCard — connection-code
 * Displays the student access code with copy / share / assign actions.
 * Extracted from connection-code-screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { ActionButton } from './action-button';

type CodeCardProps = {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onAssign: () => void;
  t: (k: string) => string;
};

export function CodeCard({ code, copied, onCopy, onShare, onAssign, t }: CodeCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(0).duration(400)}>
      <View style={styles.card}>
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>{t('teacher.connectionCode.codeLabel')}</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{code}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <ActionButton
            icon={copied ? 'checkmark-circle' : 'copy-outline'}
            label={copied ? t('teacher.connectionCode.copied') : t('teacher.connectionCode.copyButton')}
            onPress={onCopy}
            variant={copied ? 'success' : 'primary'}
          />
          <ActionButton
            icon="share-outline"
            label={t('teacher.connectionCode.shareButton')}
            onPress={onShare}
            variant="secondary"
          />
        </View>
        <Pressable
          onPress={onAssign}
          style={({ pressed }) => [styles.assignBtn, pressed && styles.assignBtnPressed]}
          accessibilityRole="button"
        >
          <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
          <Text style={styles.assignLabel}>{t('teacher.connectionCode.assignToSessionButton')}</Text>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#93C5FD" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    gap: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  codeContainer: { alignItems: 'center', gap: 12 },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeBox: {
    width: '100%',
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 4,
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', gap: 10 },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  assignBtnPressed: { backgroundColor: '#DBEAFE' },
  assignLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#3B82F6' },
});
