import * as React from 'react';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import colors from '@/components/ui/colors';

/**
 * GradientText — renders text filled with the brand blue→green gradient
 * using react-native-svg. No native modules required (works in Expo Go).
 *
 * Used per visual-auth.md for hero second-line text. Falls back to solid
 * brand.primary if SVG measurement is not yet ready (first paint).
 */

export type GradientTextProps = {
  children: string;
  size: number;
  weight?: '500' | '600' | '700' | '800';
  letterSpacing?: number;
  colors?: [string, string];
  fontFamily?: string;
  testID?: string;
};

function measureWidth(text: string, fontSize: number): number {
  // Approximation: average character width ≈ 0.55 * fontSize for Geist/Inter.
  // We over-measure by 4px to avoid right-side clipping for descenders or
  // wider locales (Arabic). Real measurement happens on first onLayout.
  return Math.ceil(text.length * fontSize * 0.55) + 4;
}

export function GradientText({
  children,
  size,
  weight = '700',
  letterSpacing,
  colors: gradientColors,
  fontFamily,
  testID,
}: GradientTextProps) {
  const [width, setWidth] = useState<number>(measureWidth(children, size));
  const [c1, c2] = gradientColors ?? [colors.brand.blue, colors.brand.primary];

  const trackedLetterSpacing = letterSpacing ?? -size * 0.035;

  // Height accounts for the line-box ascent + descent. 1.15× lineHeight is the
  // typical Geist metric and prevents clipping for tall Arabic glyphs.
  const height = Math.ceil(size * 1.15);

  return (
    <View
      onLayout={(event) => {
        const measured = event.nativeEvent.layout.width;
        if (measured > 0 && Math.abs(measured - width) > 1) {
          setWidth(measured);
        }
      }}
      style={{ width, height }}
      testID={testID}
    >
      {/*
        Hidden Text used solely so the View shrinks/grows to the natural
        text width. The visible glyphs come from <SvgText> below.
      */}
      <Text
        style={{
          position: 'absolute',
          opacity: 0,
          fontSize: size,
          fontWeight: weight,
          letterSpacing: trackedLetterSpacing,
          fontFamily,
        }}
      >
        {children}
      </Text>
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <Defs>
          <LinearGradient id="brandGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={c1} />
            <Stop offset="1" stopColor={c2} />
          </LinearGradient>
        </Defs>
        <SvgText
          x="0"
          y={size * 0.85}
          fill="url(#brandGrad)"
          fontSize={size}
          fontWeight={weight}
          letterSpacing={trackedLetterSpacing}
          fontFamily={fontFamily ?? (Platform.OS === 'ios' ? 'Geist' : undefined)}
        >
          {children}
        </SvgText>
      </Svg>
    </View>
  );
}
