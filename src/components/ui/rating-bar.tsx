import * as React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import colors from '@/components/ui/colors';
import { MOTION, useReducedMotion } from '@/components/ui/theme';

type RatingBarProps = {
  value: number;
  max?: number;
  height?: number;
  color?: string;
  animateOnChange?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function RatingBar({
  value,
  max = 10,
  height = 8,
  color = colors.brand.primary,
  animateOnChange = false,
  accessibilityLabel,
  testID,
}: RatingBarProps) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animateOnChange && !reducedMotion;
  const targetPercent = Math.min(Math.max((value / max) * 100, 0), 100);

  const width = useSharedValue(shouldAnimate ? 0 : targetPercent);

  React.useEffect(() => {
    if (shouldAnimate) {
      width.value = withTiming(targetPercent, {
        duration: MOTION.durations.base,
      });
    }
    else {
      width.value = targetPercent;
    }
  }, [targetPercent, shouldAnimate, width]);

  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const label = accessibilityLabel ?? `${value} out of ${max}`;

  return (
    <View
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      style={{
        width: '100%',
        height,
        backgroundColor: colors.neutral.rule,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          animatedFillStyle,
          {
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}
