import { useTranslation } from 'react-i18next';
import { Button, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

type WizardStep = {
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
  done?: boolean;
};

export function OnboardingWizard({ steps }: { steps: WizardStep[] }) {
  const { t } = useTranslation();
  const doneCount = steps.filter(s => s.done).length;

  return (
    <View className="rounded-[28px] p-5" style={{ backgroundColor: colors.neutral.ink }}>
      <Text className="font-inter text-xs tracking-[1.4px] uppercase" style={{ color: colors.brand.primary }}>
        {t('manager.wizard.progress', {
          defaultValue: '{{done}}/{{total}} complete',
          done: doneCount,
          total: steps.length,
        })}
      </Text>
      <Text className="font-inter mt-2 text-xl font-semibold text-white">
        {t('manager.wizard.title', { defaultValue: 'Launch checklist' })}
      </Text>
      <Text className="font-inter mt-1 text-sm text-slate-300">
        {t('manager.wizard.subtitle', {
          defaultValue: 'Complete these three steps to get your organization live.',
        })}
      </Text>
      <View className="mt-4 gap-3">
        {steps.map((step, index) => (
          <View
            key={step.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <Text className="font-inter text-xs tracking-[1.4px] uppercase" style={{ color: colors.brand.primary }}>
              {t('manager.wizard.stepLabel', {
                defaultValue: 'Step {{count}}',
                count: index + 1,
              })}
            </Text>
            <Text className="font-inter mt-1 text-base font-semibold text-white">
              {step.title}
            </Text>
            <Text className="font-inter mt-1 text-sm text-slate-300">
              {step.description}
            </Text>
            <Button
              className="mt-3"
              variant={step.done ? 'outline' : 'default'}
              label={step.done
                ? t('manager.wizard.completed', { defaultValue: 'Completed' })
                : step.ctaLabel}
              disabled={step.done}
              onPress={step.onPress}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
