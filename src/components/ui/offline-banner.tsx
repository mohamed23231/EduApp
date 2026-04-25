import * as React from 'react';
import { Text, View } from 'react-native';

import colors from '@/components/ui/colors';
import { Z_INDEX } from '@/components/ui/theme';

type OfflineBannerProps = {
  visible: boolean;
  testID?: string;
};

export function OfflineBanner({ visible, testID }: OfflineBannerProps) {
  if (!visible)
    return null;

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.semantic.excused,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: Z_INDEX.offlineBanner,
      }}
    >
      <Text style={{ fontSize: 14 }}>
        ⚠
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.semantic.excusedInk,
        }}
      >
        You're offline
      </Text>
    </View>
  );
}
