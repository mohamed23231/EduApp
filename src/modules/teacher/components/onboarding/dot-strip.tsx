/**
 * DotStrip — step progress indicator for the onboarding wizard.
 * Completed dots: brand green. Current: elongated ink. Future: muted rule.
 */

import { View } from 'react-native';
import colors from '@/components/ui/colors';

type Props = { step: number; total: number };

export function DotStrip({ step, total }: Props) {
  return (
    <View className="flex-row justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const isCurrent = idx === step;
        const isDone = idx < step;
        return (
          <View
            key={idx}
            style={{
              height: 6,
              width: isCurrent ? 22 : 6,
              borderRadius: 999,
              backgroundColor: isDone
                ? colors.brand.primary
                : isCurrent
                  ? colors.neutral.ink
                  : colors.neutral.rule,
            }}
          />
        );
      })}
    </View>
  );
}
