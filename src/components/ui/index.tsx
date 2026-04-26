/* eslint-disable react-refresh/only-export-components */
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { withUniwind } from 'uniwind';

export { AuthShell } from './auth-shell';
export { BigNumber } from './big-number';
export * from './button';
export * from './checkbox';
export { default as colors } from './colors';
export * from './confirm-modal';
export { ConfirmSheet } from './confirm-sheet';
export { Dot } from './dot';
export { EmptyState } from './empty-state';
export { ErrorState } from './error-state';
export * from './focus-aware-status-bar';
export { GradientText } from './gradient-text';
export { Hairline } from './hairline';
export { Icon } from './icon';
export { IconTile } from './icon-tile';
export * from './image';
export * from './input';

export * from './list';
export * from './modal';
// Phase 4 US7 — additional primitives
export { Monogram } from './monogram';
export { OfflineBanner } from './offline-banner';
export * from './option-picker-sheet';
export * from './phone-field';
export { PressButton } from './press-button';
export * from './progress-bar';
export { RatingBar } from './rating-bar';
export { SectionLabel } from './section-label';
export { SegTabs } from './seg-tabs';

export * from './select';
export { Sheet } from './sheet';
export { Skeleton } from './skeleton';
export { StatusChip } from './status-chip';
export { TabaMark } from './taba-mark';
export { TabaWordmark } from './taba-wordmark';
export * from './text';
export { TextField } from './text-field';
export { LAYOUT, MOTION, ThemeProvider, useReducedMotion, useTheme, Z_INDEX } from './theme';
export type { ThemeMode } from './theme';
export { ToastHost, ToastView, useToast } from './toast-host';
export type { ToastIntent } from './toast-host';
export { TopBar } from './top-bar';
export * from './utils';

export {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';

export const SafeAreaView = withUniwind(RNSafeAreaView);
export const StyledSvg = withUniwind(Svg);
