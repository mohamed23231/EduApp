/**
 * ConnectionCodeScreen component
 * Display and manage student access code
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '@/components/ui';
import { useConnectionCode } from '../hooks';

export function ConnectionCodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);

  const {
    code,
    isLoading,
    isRegenerating,
    error,
    regenerate,
    copyToClipboard,
    share,
  } = useConnectionCode(id as string);

  const handleRegeneratePress = () => {
    setShowConfirmRegenerate(true);
  };

  const handleConfirmRegenerate = async () => {
    setShowConfirmRegenerate(false);
    await regenerate();
  };

  const handleCopyPress = async () => {
    await copyToClipboard();
    Alert.alert(t('teacher.connectionCode.copiedTitle'), t('teacher.connectionCode.copiedMessage'));
  };

  const handleSharePress = async () => {
    await share();
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{t('teacher.common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('teacher.connectionCode.title')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {code && (
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>{t('teacher.connectionCode.codeLabel')}</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{code.code}</Text>
            </View>

            {code.expiresAt && (
              <Text style={styles.expiryText}>
                {t('teacher.connectionCode.expiresAt', {
                  date: new Date(code.expiresAt).toLocaleDateString(),
                })}
              </Text>
            )}

            <View style={styles.buttonsContainer}>
              <Button
                label={t('teacher.connectionCode.copyButton')}
                onPress={handleCopyPress}
                variant="secondary"
                style={styles.button}
              />
              <Button
                label={t('teacher.connectionCode.shareButton')}
                onPress={handleSharePress}
                variant="secondary"
                style={styles.button}
              />
            </View>

            <View style={styles.divider} />

            <Button
              label={
                isRegenerating
                  ? t('teacher.connectionCode.regenerating')
                  : t('teacher.connectionCode.regenerateButton')
              }
              onPress={handleRegeneratePress}
              loading={isRegenerating}
              variant="destructive"
              style={styles.regenerateButton}
            />

            {!isRegenerating && !showConfirmRegenerate && (
              <Text style={styles.warningText}>
                {t('teacher.connectionCode.regenerateWarning')}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {showConfirmRegenerate && (
        <View style={styles.confirmDialogOverlay}>
          <View style={styles.confirmDialog}>
            <Text style={styles.confirmTitle}>
              {t('teacher.connectionCode.confirmRegenerateTitle')}
            </Text>
            <Text style={styles.confirmMessage}>
              {t('teacher.connectionCode.confirmRegenerateMessage')}
            </Text>
            <View style={styles.confirmButtonsContainer}>
              <Button
                label={t('teacher.common.cancel')}
                onPress={() => setShowConfirmRegenerate(false)}
                variant="secondary"
                style={styles.confirmButton}
              />
              <Button
                label={t('teacher.common.confirm')}
                onPress={handleConfirmRegenerate}
                variant="destructive"
                style={styles.confirmButton}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
  codeContainer: {
    flex: 1,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 2,
    fontFamily: 'Menlo',
  },
  expiryText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  regenerateButton: {
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
  },
});
