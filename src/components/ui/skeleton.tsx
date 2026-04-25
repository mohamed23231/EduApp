import * as React from 'react';
import { Animated, View } from 'react-native';

import colors from '@/components/ui/colors';
import { useReducedMotion } from '@/components/ui/theme';

type SkeletonProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  testID?: string;
};

export function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  testID,
}: SkeletonProps) {
  const reducedMotion = useReducedMotion();
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    if (reducedMotion)
      return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [reducedMotion, opacity]);

  return (
    <Animated.View
      testID={testID}
      // width may be a percentage string; cast to satisfy Animated.View typing.
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: colors.neutral.rule,
        opacity: reducedMotion ? 1 : opacity,
      } as Record<string, unknown>}
    />
  );
}

type SkeletonCardProps = {
  testID?: string;
};

export function SkeletonCard({ testID }: SkeletonCardProps) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.neutral.card,
        borderColor: colors.neutral.rule,
        borderWidth: 1,
        borderRadius: colors.radii.r3,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.neutral.rule,
        }}
      />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="45%" height={14} />
      </View>
    </View>
  );
}
