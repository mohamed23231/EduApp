/**
 * OptionPickerSheet
 * Reusable single-select bottom sheet picker.
 * Follows the same pattern as StudentSelectSheet (teacher module).
 *
 * Usage:
 *   const picker = useModal();
 *
 *   <Pressable onPress={picker.present}>
 *     <Text>{selectedLabel}</Text>
 *   </Pressable>
 *
 *   <OptionPickerSheet
 *     ref={picker.ref}
 *     title="Pick an option"
 *     options={[{ label: 'One', value: '1' }, ...]}
 *     value={selected}
 *     onSelect={(value) => setSelected(value)}
 *   />
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Modal, Text } from '@/components/ui';

export type PickerOption = {
  label: string;
  value: string | number;
};

type OptionPickerSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  options: PickerOption[];
  value?: string | number;
  onSelect: (value: string | number) => void;
  title?: string;
  snapPoints?: (string | number)[];
};

function OptionRow({
  option,
  selected,
  onPress,
}: {
  option: PickerOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
        {option.label}
      </Text>
      {selected && (
        <Ionicons name="checkmark" size={18} color="#1D4ED8" />
      )}
    </Pressable>
  );
}

function keyExtractor(item: PickerOption) {
  return String(item.value);
}

export function OptionPickerSheet({
  ref,
  options,
  value,
  onSelect,
  title,
  snapPoints = ['60%'],
}: OptionPickerSheetProps) {
  const renderItem = React.useCallback(
    ({ item }: { item: PickerOption }) => (
      <OptionRow
        option={item}
        selected={item.value === value}
        onPress={() => {
          onSelect(item.value);
          ref?.current?.dismiss();
        }}
      />
    ),
    [value, onSelect, ref],
  );

  return (
    <Modal ref={ref} snapPoints={snapPoints} title={title}>
      <View style={styles.container}>
        <FlatList
          data={options}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    gap: 6,
    paddingVertical: 8,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rowSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  rowPressed: {
    backgroundColor: '#F9FAFB',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  rowLabelSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
});
