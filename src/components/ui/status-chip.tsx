import { useTranslation } from 'react-i18next';

import { View } from 'react-native';
import colors from '@/components/ui/colors';
import { Dot } from '@/components/ui/dot';
import { Text } from '@/components/ui/text';

type StatusChipStatus = 'present' | 'absent' | 'excused' | 'pending' | 'live' | 'closed' | 'draft';

type StatusChipProps = {
  status: StatusChipStatus;
  compact?: boolean;
  dark?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

type StatusStyle = {
  bg: string;
  textColor: string;
  showDot?: boolean;
};

function getStatusStyle(status: StatusChipStatus, dark?: boolean): StatusStyle {
  switch (status) {
    case 'present':
      return {
        bg: dark ? colors.semantic.presentSoft : colors.semantic.present,
        textColor: dark ? colors.semantic.presentInk : colors.semantic.presentInk,
      };
    case 'absent':
      return {
        bg: dark ? colors.semantic.absentSoft : colors.semantic.absent,
        textColor: dark ? colors.semantic.absentInk : colors.semantic.absentInk,
      };
    case 'excused':
      return {
        bg: dark ? colors.semantic.excusedSoft : colors.semantic.excused,
        textColor: colors.semantic.excusedInk,
      };
    case 'pending':
      return {
        bg: colors.neutral.dim,
        textColor: colors.neutral.ink,
      };
    case 'live':
      return {
        bg: colors.brand.primary,
        textColor: colors.brand.primaryInk,
        showDot: true,
      };
    case 'closed':
      return {
        bg: colors.neutral.rule,
        textColor: colors.neutral.inkMuted,
      };
    case 'draft':
      return {
        bg: colors.semantic.excused,
        textColor: colors.semantic.excusedInk,
      };
  }
}

function StatusChip({ status, compact = false, dark = false, testID, accessibilityLabel }: StatusChipProps) {
  const { t } = useTranslation();
  const style = getStatusStyle(status, dark);
  const height = compact ? 22 : 26;

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? t(`status.${status}`, status)}
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: style.bg,
        borderRadius: height / 2,
        paddingHorizontal: 8,
        height,
        gap: 4,
      }}
    >
      {style.showDot && (
        <Dot size={6} color="#FFFFFF" pulse testID={testID ? `${testID}-dot` : undefined} />
      )}
      <Text
        style={{
          color: style.textColor,
          fontSize: compact ? 10 : 12,
          fontWeight: '600',
          lineHeight: height,
        }}
      >
        {t(`status.${status}`, status)}
      </Text>
    </View>
  );
}

export { StatusChip };
export type { StatusChipProps, StatusChipStatus };
