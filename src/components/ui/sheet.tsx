import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { BottomSheetModal, BottomSheetView, useBottomSheet } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/components/ui/colors';
import { Text } from '@/components/ui/text';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  tall?: boolean;
  children: React.ReactNode;
  dismissOnBackdrop?: boolean;
  dismissOnDragDown?: boolean;
  dismissOnHardwareBack?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

function SheetBackdrop({ dismissible }: { dismissible: boolean }) {
  const { close } = useBottomSheet();

  const handlePress = React.useCallback(() => {
    if (dismissible) {
      close();
    }
  }, [dismissible, close]);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.backdrop}
      accessible={false}
    />
  );
}

export function Sheet({
  open,
  onClose,
  title,
  tall = false,
  children,
  dismissOnBackdrop = true,
  dismissOnDragDown = true,
  dismissOnHardwareBack = true,
  accessibilityLabel,
  testID,
}: SheetProps) {
  const ref = React.useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      ref.current?.present();
    }
    else if (mounted) {
      ref.current?.dismiss();
    }
  }, [open, mounted]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open || !dismissOnHardwareBack)
      return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return subscription.remove;
  }, [open, dismissOnHardwareBack, onClose]);

  const snapPoints = React.useMemo(
    () => (tall ? ['85%'] : ['70%']),
    [tall],
  );

  const renderHandle = React.useCallback(
    () => (
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>
    ),
    [],
  );

  const renderHeader = React.useCallback(() => {
    if (!title)
      return null;
    return (
      <View style={styles.titleRow}>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  }, [title]);

  const renderBackdrop = React.useCallback(
    (_props: BottomSheetBackdropProps) => (
      <SheetBackdrop dismissible={dismissOnBackdrop} />
    ),
    [dismissOnBackdrop],
  );

  const bottomInset = insets.bottom === 0 ? 14 : insets.bottom;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enablePanDownToClose={dismissOnDragDown}
      handleComponent={renderHandle}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.background}
      detached
      bottomInset={bottomInset}
      topInset={0}
      enableDynamicSizing={false}
      style={styles.container}
      // BottomSheetModal's typings don't expose testID/a11y props; underlying
      // View accepts them. Spread via cast.
      {...({ testID, accessible: !!accessibilityLabel, accessibilityLabel } as Record<string, unknown>)}
    >
      <BottomSheetView style={styles.content}>
        {/* Inner View carries testID/a11y — @gorhom/bottom-sheet's outer modal
            strips them, so route through a real RN View. */}
        <View
          testID={testID}
          accessible={!!accessibilityLabel}
          accessibilityLabel={accessibilityLabel}
        >
          {renderHeader()}
          {children}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.neutral.card,
    borderTopLeftRadius: colors.radii.r5,
    borderTopRightRadius: colors.radii.r5,
  },
  container: {
    marginHorizontal: 14,
    overflow: 'visible' as const,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.neutral.rule,
    borderRadius: 2,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral.ink,
  },
  content: {
    flex: 1,
  },
});
