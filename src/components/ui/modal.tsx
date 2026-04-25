/* eslint-disable react-refresh/only-export-components */
/**
 * Modal
 * Dependencies:
 * - @gorhom/bottom-sheet.
 *
 * Props:
 * - All `BottomSheetModalProps` props.
 * - `title` (string | undefined): Optional title for the modal header.
 *
 * Usage Example:
 * import { Modal, useModal } from '@gorhom/bottom-sheet';
 *
 * function DisplayModal() {
 *   const { ref, present, dismiss } = useModal();
 *
 *   return (
 *     <View>
 *       <Modal
 *         snapPoints={['60%']} // optional
 *         title="Modal Title"
 *         ref={ref}
 *       >
 *         Modal Content
 *       </Modal>
 *     </View>
 *   );
 * }
 *
 */

import type {
  BottomSheetBackdropProps,
  BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { BottomSheetModal, useBottomSheet } from '@gorhom/bottom-sheet';
import * as React from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';

type ModalProps = Omit<BottomSheetModalProps, 'children'> & {
  title?: string;
  children?: React.ReactNode;
};

type ModalRef = React.ForwardedRef<BottomSheetModal>;

export function useModal() {
  const ref = React.useRef<BottomSheetModal>(null);
  const present = React.useCallback((data?: any) => {
    ref.current?.present(data);
  }, []);
  const dismiss = React.useCallback(() => {
    ref.current?.dismiss();
  }, []);
  return { ref, present, dismiss };
}

export function Modal({ ref, snapPoints: _snapPoints = ['60%'] as (string | number)[], title, detached = true, children, ...props }: ModalProps & { ref?: ModalRef }) {
  const modal = useModal();
  const insets = useSafeAreaInsets();
  const snapPoints = React.useMemo(() => _snapPoints, [_snapPoints]);
  const bottomInset = detached
    ? (insets.bottom === 0 ? 14 : insets.bottom)
    : 0;

  React.useImperativeHandle(
    ref,
    () => (modal.ref.current as BottomSheetModal) || null,
  );

  const renderHandleComponent = React.useCallback(
    () => (
      <Pressable
        onPress={modal.dismiss}
        style={handleStyles.container}
        accessibilityRole="button"
        accessibilityLabel="close"
        hitSlop={{ top: 10, bottom: 10, left: 40, right: 40 }}
      >
        <View style={handleStyles.notch} />
      </Pressable>
    ),
    [modal.dismiss],
  );

  const renderHeader = React.useCallback(
    () => {
      if (!title)
        return null;
      return (
        <View style={handleStyles.titleRow}>
          <Text style={handleStyles.title} numberOfLines={1}>{title}</Text>
        </View>
      );
    },
    [title],
  );

  return (
    <BottomSheetModal
      {...props}
      ref={modal.ref}
      index={0}
      snapPoints={snapPoints}
      detached={detached}
      bottomInset={bottomInset}
      backdropComponent={props.backdropComponent || renderBackdrop}
      enableDynamicSizing={false}
      handleComponent={renderHandleComponent}
      topInset={0}
      backgroundStyle={floatingStyles.background}
      style={floatingStyles.container}
    >
      {renderHeader()}
      {children}
    </BottomSheetModal>
  );
}

/**
 * Custom Backdrop
 */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function CustomBackdrop({ style }: BottomSheetBackdropProps) {
  const { close } = useBottomSheet();
  return (
    <AnimatedPressable
      onPress={() => close()}
      entering={FadeIn.duration(50)}
      exiting={FadeOut.duration(20)}
      style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]}
    />
  );
}

export function renderBackdrop(props: BottomSheetBackdropProps) {
  return <CustomBackdrop {...props} />;
}

const floatingStyles = StyleSheet.create({
  background: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  container: {
    marginHorizontal: 14,
    overflow: 'visible' as const,
  },
});

const handleStyles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    left: '50%',
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: I18nManager.isRTL ? 20 : -20 }],
  },
  notch: {
    width: 40,
    height: 4,
    backgroundColor: '#9CA3AF',
    borderRadius: 32,
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
});
