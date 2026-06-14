import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';

export const RANGE_OPTIONS = ['week', 'month', 'term'] as const;

export type ReportRange = (typeof RANGE_OPTIONS)[number];

type ReportRangeSelectorProps = {
  range: ReportRange;
  onChange: (range: ReportRange) => void;
};

export function ReportRangeSelector({ range, onChange }: ReportRangeSelectorProps) {
  const { t } = useTranslation();
  return (
    <View accessibilityRole="radiogroup" className="mt-5 flex-row gap-2">
      {RANGE_OPTIONS.map((option) => {
        const selected = range === option;
        const label = t(`manager.reports.range.${option}`, { defaultValue: option });
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityLabel={label}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            className="rounded-full px-4 py-2"
            style={{ backgroundColor: selected ? colors.brand.primary : colors.neutral.card }}
          >
            <Text
              className="text-sm"
              style={{ color: selected ? colors.neutral.white : colors.neutral.inkMuted, textTransform: 'capitalize' }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
