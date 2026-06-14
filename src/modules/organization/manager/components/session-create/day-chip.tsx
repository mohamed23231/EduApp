import { useTranslation } from 'react-i18next';
import { Pressable, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

export function DayChip({
  dayKey,
  selected,
  onToggle,
}: {
  dayKey: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const dayLabel = t(`manager.days.${dayKey}`, { defaultValue: dayKey });
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => ({
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: selected
          ? colors.neutral.ink
          : pressed
            ? colors.neutral.cardWarm
            : colors.neutral.card,
        borderWidth: 1.5,
        borderColor: selected ? colors.neutral.ink : colors.neutral.rule,
      })}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: selected ? colors.neutral.white : colors.neutral.ink,
          letterSpacing: -0.1,
        }}
      >
        {dayLabel}
      </Text>
    </Pressable>
  );
}
