/**
 * ConnectionCodeScreen — Teacher
 * Beautiful display of student access code with copy/share actions.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Burnt from 'burnt';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  I18nManager,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { ConfirmSheet, ScreenHeader } from '../components';
import { useConnectionCode } from '../hooks';

function ActionButton({ icon, label, onPress, variant }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'success';
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const colors = {
    primary: { bg: '#3B82F6', text: '#FFFFFF', ic: '#FFFFFF' },
    secondary: { bg: '#F1F5F9', text: '#334155', ic: '#64748B' },
    success: { bg: '#10B981', text: '#FFFFFF', ic: '#FFFFFF' },
  };
  const c = colors[variant];

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <Pressable
        onPress={onPress}
        // eslint-disable-next-line react-hooks/immutability
        onPressIn={() => { scale.value = withSpring(0.95); }}
        // eslint-disable-next-line react-hooks/immutability
        onPressOut={() => { scale.value = withSpring(1); }}
        style={[styles.actionBtn, { backgroundColor: c.bg }]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={18} color={c.ic} />
        <Text style={[styles.actionLabel, { color: c.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function CodeCard({ code, copied, onCopy, onShare, onAssign, t }: {
  code: string;
  copied: boolean;
  onCopy: () => void;
  onShare: () => void;
  onAssign: () => void;
  t: (k: string) => string;
}) {
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

function DangerZone({ isRegenerating, onRegenerate, t }: {
  isRegenerating: boolean;
  onRegenerate: () => void;
  t: (k: string) => string;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(150).duration(400)}>
      <View style={styles.dangerCard}>
        <View style={styles.dangerRow}>
          <View style={styles.dangerIconCircle}>
            <Ionicons name="warning-outline" size={18} color="#DC2626" />
          </View>
          <View style={styles.dangerInfo}>
            <Text style={styles.dangerTitle}>{t('teacher.connectionCode.regenerateButton')}</Text>
            <Text style={styles.dangerDesc}>{t('teacher.connectionCode.regenerateWarning')}</Text>
          </View>
        </View>
        <Pressable
          onPress={onRegenerate}
          disabled={isRegenerating}
          style={({ pressed }) => [styles.regenBtn, pressed && styles.regenBtnPressed]}
          accessibilityRole="button"
        >
          {isRegenerating
            ? <ActivityIndicator size="small" color="#DC2626" />
            : <Ionicons name="refresh-outline" size={16} color="#DC2626" />}
          <Text style={styles.regenLabel}>
            {isRegenerating ? t('teacher.connectionCode.regenerating') : t('teacher.connectionCode.regenerateButton')}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function ConnectionCodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const confirmModal = useModal();
  const [copied, setCopied] = useState(false);

  const { code, isLoading, isRegenerating, error, regenerate, copyToClipboard, share }
    = useConnectionCode(id as string);

  const handleCopyPress = async () => {
    await copyToClipboard();
    setCopied(true);
    Burnt.toast({ title: t('teacher.toast.copied'), preset: 'done', haptic: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmRegenerate = async () => {
    confirmModal.dismiss();
    await regenerate();
    Burnt.toast({ title: t('teacher.studentActions.codeRegenerated'), preset: 'done', haptic: 'success' });
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScreenHeader title={t('teacher.connectionCode.title')} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScreenHeader title={t('teacher.connectionCode.title')} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </Animated.View>
        )}
        {code && (
          <>
            <CodeCard
              code={code.code}
              copied={copied}
              onCopy={handleCopyPress}
              onShare={share}
              onAssign={() => router.push(`${AppRoute.teacher.sessionCreate}?studentId=${id}` as any)}
              t={t}
            />
            <DangerZone
              isRegenerating={isRegenerating}
              onRegenerate={() => confirmModal.present()}
              t={t}
            />
          </>
        )}
      </ScrollView>
      <ConfirmSheet
        ref={confirmModal.ref}
        title={t('teacher.connectionCode.confirmRegenerateTitle')}
        message={t('teacher.connectionCode.confirmRegenerateMessage')}
        confirmLabel={t('teacher.common.confirm')}
        cancelLabel={t('teacher.common.cancel')}
        onConfirm={handleConfirmRegenerate}
        onCancel={confirmModal.dismiss}
        isLoading={isRegenerating}
        variant="destructive"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 14, color: '#DC2626' },
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionLabel: { fontSize: 14, fontWeight: '600' },
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
  dangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  dangerRow: { flexDirection: 'row', gap: 12 },
  dangerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dangerInfo: { flex: 1, gap: 4 },
  dangerTitle: { fontSize: 15, fontWeight: '700', color: '#991B1B' },
  dangerDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  regenBtnPressed: { backgroundColor: '#FEE2E2' },
  regenLabel: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
});
