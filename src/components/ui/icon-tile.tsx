import * as React from 'react';
import { View } from 'react-native';
import colors from '@/components/ui/colors';

type IconTileProps = {
  icon: React.ReactNode;
  bg: string;
  fg?: string;
  size?: number;
  radius?: number;
  testID?: string;
  accessibilityLabel?: string;
};

export function IconTile({
  icon,
  bg,
  fg: _fg,
  size = 44,
  radius = colors.radii.r2,
  testID,
  accessibilityLabel,
}: IconTileProps) {
  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </View>
  );
}
