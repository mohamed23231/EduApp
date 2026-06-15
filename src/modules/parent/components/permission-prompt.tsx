import { useTranslation } from 'react-i18next';
import { I18nManager, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, PressButton, Text } from '@/components/ui';
import { Color } from '@/components/ui/color-utils';
import { useAppSettings } from '@/core/settings/use-app-settings';

/**
 * PermissionPrompt — TEMPORARY, CONFIG-GATED push-notification priming mock.
 *
 * Renders nothing unless `useAppSettings().permissionPrompt.enabled` is true
 * (which defaults FALSE until the backend turns it on). It owns NO side effects:
 * the CTA and dismiss are callbacks so the mount site keeps control of the OS
 * permission flow. Copy resolves from remote config when present, otherwise
 * falls back to i18n keys (EN+AR). No product copy is baked in here.
 */

type PermissionPromptProps = {
  /** Invoked when the user taps the CTA. Owner triggers the real permission flow. */
  onEnable: () => void;
  /** Invoked when the user dismisses the prompt (e.g. hide for the session). */
  onDismiss: () => void;
};

export function PermissionPrompt({ onEnable, onDismiss }: PermissionPromptProps) {
  const { t } = useTranslation();
  const { permissionPrompt } = useAppSettings();

  if (!permissionPrompt.enabled) {
    return null;
  }

  const { copy } = permissionPrompt;
  const title = copy.title ?? t('parent.permissionPrompt.title', 'Stay in the loop');
  const body
    = copy.body
      ?? t(
        'parent.permissionPrompt.body',
        'Turn on notifications to get attendance and performance alerts.',
      );
  const cta = copy.cta ?? t('parent.permissionPrompt.cta', 'Enable notifications');
  const dismiss = t('parent.permissionPrompt.dismiss', 'Not now');

  return (
    <View style={styles.card} accessibilityRole="alert" testID="permission-prompt">
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Icon name="bell" size={20} color={Color.brand.blue()} />
        </View>
        <View style={styles.copy}>
          <Text className="text-base font-bold" style={styles.title}>
            {title}
          </Text>
          <Text className="text-sm" style={styles.body}>
            {body}
          </Text>
        </View>
      </View>

      <PressButton
        variant="gradient"
        size="md"
        fullWidth
        label={cta}
        onPress={onEnable}
        testID="permission-prompt-cta"
      />

      <TouchableOpacity
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={dismiss}
        testID="permission-prompt-dismiss"
        style={styles.dismissButton}
      >
        <Text className="text-sm font-semibold" style={styles.dismissText}>
          {dismiss}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: Color.neutral.card(),
    borderColor: Color.neutral.rule(),
    gap: 14,
  },
  header: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.semantic.infoSoft(),
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Color.neutral.ink(),
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  body: {
    color: Color.neutral.inkMuted(),
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  dismissButton: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  dismissText: {
    color: Color.neutral.inkMuted(),
  },
});
