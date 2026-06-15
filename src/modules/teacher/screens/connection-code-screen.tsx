/**
 * ConnectionCodeScreen — Teacher
 * Beautiful display of student access code with copy/share actions.
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useModal, useToast } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { ConfirmSheet, ScreenHeader } from '../components';
import { CodeCard, DangerZone } from '../components/connection-code';
import { useConnectionCode } from '../hooks';

export function ConnectionCodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const confirmModal = useModal();
  const [copied, setCopied] = useState(false);

  const { code, isLoading, isRegenerating, error, regenerate, copyToClipboard, share }
    = useConnectionCode(id as string);

  const handleCopyPress = async () => {
    await copyToClipboard();
    setCopied(true);
    toast.show({ kind: 'success', message: t('teacher.toast.copied') });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmRegenerate = async () => {
    confirmModal.dismiss();
    await regenerate();
    toast.show({ kind: 'success', message: t('teacher.studentActions.codeRegenerated') });
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <ScreenHeader title={t('teacher.connectionCode.title')} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
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
});
