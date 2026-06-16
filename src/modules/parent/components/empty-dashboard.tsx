import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { Color } from '@/components/ui/color-utils';
import colors from '@/components/ui/colors';

type EmptyDashboardProps = {
  onLinkStudent: () => void;
};

export function EmptyDashboard({ onLinkStudent }: EmptyDashboardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {/* Illustration placeholder */}
      <View style={styles.illustrationCircle}>
        <Text style={styles.emoji}>🎓</Text>
      </View>

      <Text style={styles.title}>
        {t('parent.dashboard.emptyTitle')}
      </Text>

      <Text style={styles.message}>
        {t('parent.dashboard.emptyMessage')}
      </Text>

      <Button
        label={t('parent.dashboard.linkStudentCta')}
        onPress={onLinkStudent}
        testID="link-student-cta"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: Color.text.secondary(),
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
});
