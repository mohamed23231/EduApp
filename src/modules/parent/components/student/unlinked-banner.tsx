import type { TFunction } from 'i18next';
import * as React from 'react';
import { Text, View } from 'react-native';
import { Icon } from '@/components/ui';
import colors from '@/components/ui/colors';

/**
 * Amber inline banner shown on Parent · Student Detail when a child has been
 * unlinked by the teacher/center. Mirrors the Parent States Pass edge case
 * (child-unlinked → amber read-only): explain rather than hard-delete. The
 * surface is purely informational; the screen disables/hides mutating
 * affordances elsewhere. Uses the `excused`/warning semantic token (amber).
 */

export type UnlinkedBannerProps = {
  studentName: string;
  isRTL: boolean;
  t: TFunction;
};

export function UnlinkedBanner({ studentName, isRTL, t }: UnlinkedBannerProps) {
  const textAlign = isRTL ? 'right' : 'left';
  return (
    <View
      accessibilityRole="alert"
      testID="unlinked-banner"
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        flexDirection: isRTL ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: colors.semantic.excusedSoft,
        borderWidth: 1,
        borderColor: colors.semantic.excused,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
      }}
    >
      <View style={{ marginTop: 1 }}>
        <Icon name="flag" size={18} color={colors.semantic.excusedInk} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.semantic.excusedInk,
            fontSize: 14,
            fontWeight: '700',
            textAlign,
          }}
        >
          {t('parent.studentDetails.unlinkedTitle', 'This child is no longer linked')}
        </Text>
        <Text
          style={{
            color: colors.semantic.excusedInk,
            fontSize: 13,
            fontWeight: '500',
            marginTop: 4,
            opacity: 0.9,
            textAlign,
          }}
        >
          {t(
            'parent.studentDetails.unlinkedBody',
            '{{name}} was unlinked — their teacher removed the connection. You are viewing past records only. Contact the center if this is unexpected.',
            { name: studentName },
          )}
        </Text>
      </View>
    </View>
  );
}
