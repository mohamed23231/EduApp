import * as React from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import colors from '@/components/ui/colors';
import { MOTION, useReducedMotion } from '@/components/ui/theme';

type BigNumberProps = {
  value: string | number;
  suffix?: string;
  size?: number;
  weight?: 500 | 600 | 700 | 800;
  color?: string;
  animateOnMount?: boolean;
  testID?: string;
  accessibilityLabel?: string;
};

export function BigNumber({
  value,
  suffix,
  size = 64,
  weight = 700,
  color = colors.neutral.ink,
  animateOnMount = false,
  testID,
  accessibilityLabel,
}: BigNumberProps) {
  const reducedMotion = useReducedMotion();
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value);
  const shouldAnimate = animateOnMount && !reducedMotion && !Number.isNaN(numericValue);

  const display = useSharedValue(shouldAnimate ? 0 : numericValue);

  React.useEffect(() => {
    if (shouldAnimate) {
      display.value = withTiming(numericValue, {
        duration: MOTION.durations.base,
      });
    }
  }, [shouldAnimate, numericValue, display]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const label = accessibilityLabel ?? `${value}${suffix ?? ''}`;

  return (
    <View
      testID={testID}
      accessibilityLabel={label}
      accessibilityRole="text"
      style={{ flexDirection: 'row', alignItems: 'baseline' }}
    >
      {shouldAnimate
        ? (
            <Animated.Text
              style={[
                animatedStyle,
                {
                  fontSize: size,
                  fontWeight: String(weight) as '500' | '600' | '700' | '800',
                  color,
                  lineHeight: size * 1.1,
                },
              ]}
            >
              {shouldAnimate ? numericValue : value}
            </Animated.Text>
          )
        : (
            <Text
              style={{
                fontSize: size,
                fontWeight: String(weight) as '500' | '600' | '700' | '800',
                color,
                lineHeight: size * 1.1,
              }}
            >
              {String(value)}
            </Text>
          )}
      {suffix
        ? (
            <Text
              style={{
                fontSize: size * 0.35,
                fontWeight: String(weight) as '500' | '600' | '700' | '800',
                color,
                lineHeight: size * 0.35 * 1.3,
                marginStart: 2,
              }}
            >
              {suffix}
            </Text>
          )
        : null}
    </View>
  );
}
