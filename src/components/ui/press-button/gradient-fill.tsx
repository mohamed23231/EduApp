import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import colors from '@/components/ui/colors';

/**
 * GradientFill — the brand blue→green inner gradient for
 * `<PressButton variant="gradient">`. Absolutely positioned behind the button
 * content. Colors + direction are fixed by `contracts/visual-auth.md`
 * (`LinearGradient([brand.blue, brand.primary])` start {0,0} end {1,1}).
 */
export function GradientFill() {
  return (
    <LinearGradient
      colors={[colors.brand.blue, colors.brand.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
        bottom: 0,
      }}
    />
  );
}
