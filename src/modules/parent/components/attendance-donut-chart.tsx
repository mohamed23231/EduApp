import { useEffect } from 'react';
import { Text as RNText, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type AttendanceDonutChartProps = {
  attendanceRate: number;
  size?: number;
};

export function AttendanceDonutChart({ attendanceRate, size = 160 }: AttendanceDonutChartProps) {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      Math.min(Math.max(attendanceRate, 0), 100) / 100,
      { duration: 800 },
    );
  }, [attendanceRate, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const displayRate = Math.round(attendanceRate);

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityLabel={`Attendance rate: ${displayRate}%`}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke="#22C55E"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference}`}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <RNText
        style={[styles.rateText, { fontSize: size * 0.18 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {`${displayRate}%`}
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  rateText: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
});
