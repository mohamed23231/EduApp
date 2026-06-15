import * as Linking from 'expo-linking';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { useAppSettings } from '@/core/settings/use-app-settings';
import colors from './colors';

/**
 * LegalNote — shared, config-driven legal copy line used across every auth and
 * onboarding surface. Renders an inline sentence whose "Terms" and "Privacy
 * Policy" substrings are individually tappable, each opening its respective URL
 * from `useAppSettings().legal` in the system browser via `expo-linking`.
 *
 * No URL is ever hardcoded here — the URLs come from the remote app-settings
 * value (with config fallback). Visual treatment follows `visual-auth.md`:
 * body = colors.neutral.inkMuted, links underlined in colors.neutral.dim.
 */

export type LegalNoteProps = {
  /** Extra bottom margin (typically safe-area inset). */
  marginBottom?: number;
  marginTop?: number;
  /** Horizontal padding for narrow layouts. */
  paddingHorizontal?: number;
};

async function openUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  }
  catch {
    // Browser unavailable / malformed URL — fail silently rather than crash.
    // Linking.openURL is cross-platform (iOS + Android) with no platform branch.
  }
}

export function LegalNote({ marginBottom, marginTop = 16, paddingHorizontal }: LegalNoteProps) {
  const { t } = useTranslation();
  const { legal } = useAppSettings();

  const linkStyle = {
    color: colors.neutral.dim,
    textDecorationLine: 'underline' as const,
    fontWeight: '700' as const,
  };

  return (
    <Text
      style={{
        color: colors.neutral.inkMuted,
        fontSize: 11,
        lineHeight: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginTop,
        ...(marginBottom !== undefined ? { marginBottom } : {}),
        ...(paddingHorizontal !== undefined ? { paddingHorizontal } : {}),
      }}
    >
      <Trans
        i18nKey="auth.legal.agreement"
        t={t}
        defaults="By continuing you agree to Taba3ny's <terms>Terms</terms> and <privacy>Privacy Policy</privacy>."
        components={{
          terms: (
            <Text
              style={linkStyle}
              onPress={() => void openUrl(legal.termsUrl)}
              accessibilityRole="link"
              accessibilityLabel={t('auth.legal.terms', 'Terms')}
              testID="legal-terms-link"
            />
          ),
          privacy: (
            <Text
              style={linkStyle}
              onPress={() => void openUrl(legal.privacyUrl)}
              accessibilityRole="link"
              accessibilityLabel={t('auth.legal.privacy', 'Privacy Policy')}
              testID="legal-privacy-link"
            />
          ),
        }}
      />
    </Text>
  );
}
