/**
 * ScreenHeader
 * Consistent top-bar for all teacher push-screens.
 * RTL-aware back chevron + title + optional right-side slot.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Stable, locale-independent anchor for the title (E2E). */
  titleTestID?: string;
};

export function ScreenHeader({ title, onBack, right, titleTestID }: ScreenHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
    else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.common.back')}
      >
        <Ionicons
          name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
          size={24}
          color={colors.brand.primary}
        />
      </Pressable>

      <Text testID={titleTestID} style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.right}>
        {right ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.neutral.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral.rule,
    minHeight: 56,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    backgroundColor: colors.neutral.cardWarm,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral.ink,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  right: {
    width: 36,
    alignItems: 'flex-end',
  },
});
