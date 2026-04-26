import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import colors from '@/components/ui/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PressButton — the only button primitive on redesigned surfaces.
 *
 * `variant` is the contract: it owns background, text color, shadow, padding,
 * radius, and the disabled treatment. Callers MUST pick a variant per the
 * matching `contracts/visual-<role>.md` file. The "legacy" form
 * (no `variant`, raw className passthrough) is deprecated and is enforced
 * out of redesigned screens by `__tests__/reject-saas-fallback.test.ts`.
 */

export type PressButtonVariant
  = | 'primary' // ink fill, white text — paper surfaces
    | 'accent' // brand lime, ink text — "Live"/CTA on dark
    | 'gradient' // brand blue→green gradient — auth + welcome CTAs
    | 'secondary' // paper card, ink text, hairline border
    | 'ghost' // transparent, ink text — tertiary actions on paper
    | 'darkGhost' // 6%-white fill on dark — secondary on auth/hero
    | 'danger' // semantic absent — destructive actions
    | 'success'; // semantic present — confirmations

export type PressButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<PressButtonSize, {
  height: number;
  paddingX: number;
  fontSize: number;
  radius: number;
  iconGap: number;
}> = {
  sm: { height: 40, paddingX: 16, fontSize: 13, radius: 10, iconGap: 6 },
  md: { height: 52, paddingX: 22, fontSize: 15, radius: 14, iconGap: 8 },
  lg: { height: 60, paddingX: 26, fontSize: 16, radius: 18, iconGap: 8 },
  xl: { height: 68, paddingX: 28, fontSize: 17, radius: 20, iconGap: 10 },
};

type VariantStyle = {
  background: string | null; // null = gradient renderer takes over
  textColor: string;
  border: string | null;
  shadowColor: string | null;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffsetY: number;
};

const VARIANTS: Record<PressButtonVariant, VariantStyle> = {
  primary: {
    background: colors.neutral.ink,
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.neutral.ink,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffsetY: 6,
  },
  accent: {
    background: colors.brand.primary,
    textColor: colors.neutral.ink,
    border: null,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.42,
    shadowRadius: 24,
    shadowOffsetY: 8,
  },
  gradient: {
    background: null, // LinearGradient overlay
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.35,
    shadowRadius: 40,
    shadowOffsetY: 12,
  },
  secondary: {
    background: colors.neutral.card,
    textColor: colors.neutral.ink,
    border: colors.neutral.rule,
    shadowColor: null,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetY: 0,
  },
  ghost: {
    background: 'transparent',
    textColor: colors.neutral.ink,
    border: null,
    shadowColor: null,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetY: 0,
  },
  darkGhost: {
    background: 'rgba(255,255,255,0.08)',
    textColor: colors.neutral.white,
    border: 'rgba(255,255,255,0.15)',
    shadowColor: null,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffsetY: 0,
  },
  danger: {
    background: colors.semantic.absent,
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.semantic.absent,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffsetY: 6,
  },
  success: {
    background: colors.semantic.present,
    textColor: colors.neutral.white,
    border: null,
    shadowColor: colors.semantic.present,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffsetY: 6,
  },
};

type PressButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  /**
   * Visual contract. Required on redesigned surfaces. Optional only for
   * legacy callers (caught by reject-saas-fallback test in Phase B work).
   */
  variant?: PressButtonVariant;
  size?: PressButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  label?: string;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  children?: React.ReactNode;
};

// eslint-disable-next-line max-lines-per-function
export function PressButton({
  children,
  className,
  style,
  variant,
  size = 'lg',
  fullWidth,
  loading,
  label,
  icon,
  trailingIcon,
  disabled,
  accessibilityRole,
  accessibilityState,
  accessibilityLabel,
  onPressIn,
  onPressOut,
  ...props
}: PressButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = !!disabled || !!loading;

  const handlePressIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(e);
  };

  // Legacy passthrough — no variant means caller owns styling via className.
  // This branch is kept for incremental migration; redesigned surfaces MUST
  // pass `variant`.
  if (!variant) {
    if (__DEV__ && !className) {
      console.warn(
        '[PressButton] No `variant` and no `className` provided. '
        + 'Redesigned surfaces must pass a `variant`. See contracts/visual-<role>.md.',
      );
    }
    return (
      <AnimatedPressable
        className={className}
        disabled={isDisabled}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityState={{ disabled: isDisabled, busy: !!loading, ...accessibilityState }}
        accessibilityLabel={accessibilityLabel ?? label}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, style]}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  const v = VARIANTS[variant];
  const s = SIZES[size];
  const innerOpacity = isDisabled ? (variant === 'gradient' ? 0.6 : 0.45) : 1;

  // Disabled-state background overrides — gradient + accent both fade to a
  // muted dark fill so the disabled state reads correctly on dark canvases.
  const renderBackground = isDisabled && (variant === 'gradient' || variant === 'accent')
    ? 'rgba(255,255,255,0.10)'
    : v.background;

  const baseStyle: ViewStyle = {
    height: s.height,
    paddingHorizontal: s.paddingX,
    borderRadius: s.radius,
    borderWidth: v.border ? 1.5 : 0,
    borderColor: v.border ?? 'transparent',
    backgroundColor: renderBackground === null ? 'transparent' : renderBackground,
    overflow: 'hidden',
    width: fullWidth ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const shadowStyle: ViewStyle = v.shadowColor && !isDisabled
    ? {
        shadowColor: v.shadowColor,
        shadowOpacity: v.shadowOpacity,
        shadowRadius: v.shadowRadius,
        shadowOffset: { width: 0, height: v.shadowOffsetY },
        elevation: Math.min(16, Math.round(v.shadowRadius / 3)),
      }
    : {};

  const labelText = label ?? (typeof children === 'string' ? children : undefined);

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.iconGap,
        opacity: innerOpacity,
      }}
    >
      {loading
        ? (
            <ActivityIndicator
              size="small"
              color={v.textColor}
            />
          )
        : (
            <>
              {icon}
              {labelText
                ? (
                    <Text
                      style={{
                        color: v.textColor,
                        fontSize: s.fontSize,
                        fontWeight: '700',
                        letterSpacing: -0.1,
                      }}
                    >
                      {labelText}
                    </Text>
                  )
                : children}
              {trailingIcon}
            </>
          )}
    </View>
  );

  return (
    <AnimatedPressable
      disabled={isDisabled}
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: isDisabled, busy: !!loading, ...accessibilityState }}
      accessibilityLabel={accessibilityLabel ?? labelText}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[baseStyle, shadowStyle, animatedStyle, style]}
      {...props}
    >
      {variant === 'gradient' && !isDisabled
        ? (
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
          )
        : null}
      {content}
    </AnimatedPressable>
  );
}
