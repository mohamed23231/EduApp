import * as React from 'react';
import { Animated, View } from 'react-native';

import { Color } from '@/components/ui/color-utils';
import { MOTION } from '@/components/ui/theme';

type DotProps = {
  size?: number;
  color?: string;
  pulse?: boolean;
  testID?: string;
};

function Dot({ size = 6, color, pulse = false, testID }: DotProps) {
  const resolvedColor = color ?? Color.brand.primary();
  const scaleRef = React.useRef(new Animated.Value(1));

  React.useEffect(() => {
    if (!pulse) {
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleRef.current, {
          toValue: 1.3,
          duration: MOTION.durations.slow,
          useNativeDriver: true,
        }),
        Animated.timing(scaleRef.current, {
          toValue: 1.0,
          duration: MOTION.durations.slow,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => {
      anim.stop();
    };
  }, [pulse]);

  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: resolvedColor,
          transform: [{ scale: pulse ? scaleRef.current : 1 }],
        }}
      />
    </View>
  );
}

export { Dot };
export type { DotProps };
