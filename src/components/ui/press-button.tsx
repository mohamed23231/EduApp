import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import type { PressButtonSize, PressButtonVariant } from '@/components/ui/press-button-variants';
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
import {
  DISABLED_FILL,
  SIZES,
  VARIANTS,
} from '@/components/ui/press-button-variants';
import { GradientFill } from '@/components/ui/press-button/gradient-fill';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * PressButton — the only button primitive on redesigned surfaces.
 *
 * `variant` is the contract and is REQUIRED (no default): it owns background,
 * text color, shadow, padding, radius, and the disabled treatment. Callers MUST
 * pick a variant per the matching `contracts/visual-<role>.md` file. The
 * `gradient` variant renders an inner blue→green `LinearGradient` with the
 * green-glow shadow recipe from `contracts/visual-auth.md`.
 *
 * @example
 *   <PressButton variant="gradient" label={t('auth.continue')} onPress={submit} />
 */

export type { PressButtonSize, PressButtonVariant } from '@/components/ui/press-button-variants';

type PressButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Visual contract — required. See `contracts/visual-<role>.md`. */
  variant: PressButtonVariant;
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

  const v = VARIANTS[variant];
  const s = SIZES[size];
  const innerOpacity = isDisabled ? (variant === 'gradient' ? 0.6 : 0.45) : 1;

  // Disabled gradient + accent fade to a muted dark fill so the disabled state
  // reads correctly on dark canvases.
  const renderBackground = isDisabled && (variant === 'gradient' || variant === 'accent')
    ? DISABLED_FILL
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
      {variant === 'gradient' && !isDisabled ? <GradientFill /> : null}
      {content}
    </AnimatedPressable>
  );
}
