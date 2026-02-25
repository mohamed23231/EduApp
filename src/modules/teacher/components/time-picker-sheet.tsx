/**
 * TimePickerSheet
 * Bottom-sheet time picker with scrollable hour + minute wheels.
 * No external dependencies beyond what the project already has.
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Modal, Text } from '@/components/ui';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

type TimePickerSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
};

function Column({
  items,
  selected,
  onSelect,
  label,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
  label: string;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <FlatList
        data={items}
        keyExtractor={item => item}
        showsVerticalScrollIndicator={false}
        style={styles.columnList}
        contentContainerStyle={styles.columnContent}
        renderItem={({ item }) => {
          const active = item === selected;
          return (
            <Pressable
              onPress={() => onSelect(item)}
              style={[styles.columnItem, active && styles.columnItemActive]}
            >
              <Text style={[styles.columnItemText, active && styles.columnItemTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

export function TimePickerSheet({ ref, value, onChange }: TimePickerSheetProps) {
  const { t } = useTranslation();

  const [hh, mm] = value.match(/^(\d{2}):(\d{2})$/)
    ? value.split(':')
    : ['08', '00'];

  const [selectedHour, setSelectedHour] = useState(hh ?? '08');
  const [selectedMinute, setSelectedMinute] = useState(mm ?? '00');

  const handleDone = useCallback(() => {
    onChange(`${selectedHour}:${selectedMinute}`);
    ref?.current?.dismiss();
  }, [selectedHour, selectedMinute, onChange, ref]);

  return (
    <Modal ref={ref} snapPoints={['50%']} title={t('teacher.sessions.timeLabel')}>
      <View style={styles.content}>
        <View style={styles.wheels}>
          <Column
            items={HOURS}
            selected={selectedHour}
            onSelect={setSelectedHour}
            label={t('teacher.timePicker.hours')}
          />
          <View style={styles.separator}>
            <Text style={styles.separatorText}>:</Text>
          </View>
          <Column
            items={MINUTES}
            selected={selectedMinute}
            onSelect={setSelectedMinute}
            label={t('teacher.timePicker.minutes')}
          />
        </View>

        <Button
          label={t('teacher.timePicker.done')}
          onPress={handleDone}
          variant="default"
          style={styles.doneBtn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flex: 1,
  },
  wheels: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 180,
    gap: 4,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  columnList: {
    flex: 1,
  },
  columnContent: {
    gap: 4,
    paddingVertical: 8,
  },
  columnItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  columnItemActive: {
    backgroundColor: '#3B82F6',
  },
  columnItemText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },
  columnItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  separator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  separatorText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  doneBtn: {
    width: '100%',
  },
});
