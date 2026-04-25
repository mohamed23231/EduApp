/**
 * RatingInputEnhanced component
 * Multiple input methods for efficient bulk rating:
 * 1. Quick preset buttons (0, 5, 7, 8, 9, 10)
 * 2. Tap-to-type direct number entry via numpad modal
 * RTL-aware, 44x44pt minimum touch targets, disabled state support.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, Modal, Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

const QUICK_PRESETS = [10, 9, 8, 7, 5, 0] as const;

type RatingInputEnhancedProps = {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
  compact?: boolean;
};

type NumpadModalProps = {
  visible: boolean;
  value: string;
  onInput: (digit: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onClear: () => void;
};

function useRatingInput(value: number | null, onChange: (r: number | null) => void, disabled: boolean) {
  const [showNumpad, setShowNumpad] = useState(false);
  const [tempValue, setTempValue] = useState('');

  const handlePresetPress = useCallback((preset: number) => {
    if (!disabled)
      onChange(preset);
  }, [disabled, onChange]);

  const handleClear = useCallback(() => {
    if (!disabled)
      onChange(null);
  }, [disabled, onChange]);

  const openNumpad = useCallback(() => {
    if (disabled)
      return;
    setTempValue(value !== null ? String(value) : '');
    setShowNumpad(true);
  }, [disabled, value]);

  const handleNumpadConfirm = useCallback(() => {
    const num = Number.parseInt(tempValue, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 10)
      onChange(num);
    setShowNumpad(false);
    setTempValue('');
  }, [tempValue, onChange]);

  const handleNumpadCancel = useCallback(() => {
    setShowNumpad(false);
    setTempValue('');
  }, []);

  const handleNumpadInput = useCallback((digit: string) => {
    setTempValue((prev) => {
      if (digit === 'backspace')
        return prev.slice(0, -1);
      const newVal = prev + digit;
      const num = Number.parseInt(newVal, 10);
      if (num > 10 || newVal.length > 2)
        return prev;
      return newVal;
    });
  }, []);

  return { showNumpad, tempValue, handlePresetPress, handleClear, openNumpad, handleNumpadConfirm, handleNumpadCancel, handleNumpadInput };
}

function NumpadModal({ visible, value, onInput, onConfirm, onCancel, onClear }: NumpadModalProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.numpadContainer} onPress={e => e.stopPropagation()}>
          <View style={[styles.numpadHeader, isRTL && styles.numpadHeaderRTL]}>
            <Pressable onPress={onCancel} style={styles.numpadClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
            <Text style={styles.numpadTitle}>{t('teacher.attendance.enterRating')}</Text>
            <View style={{ width: 32 }} />
          </View>
          <View style={styles.numpadDisplay}>
            <RNText style={styles.numpadValue}>{value || '—'}</RNText>
            <RNText style={styles.numpadMax}>{isRTL ? '10/' : '/10'}</RNText>
          </View>
          <View style={styles.numpadGrid}>
            {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(d => (
              <Pressable key={d} style={({ pressed }) => [styles.numpadKey, pressed && styles.numpadKeyPressed]} onPress={() => onInput(d)}>
                <Text style={styles.numpadKeyText}>{d}</Text>
              </Pressable>
            ))}
            <Pressable
              style={({ pressed }) => [styles.numpadKey, styles.numpadKeyAction, pressed && styles.numpadKeyPressed]}
              onPress={() => {
                onInput('1');
                onInput('0');
              }}
            >
              <Text style={styles.numpadKeyText}>10</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.numpadKey, pressed && styles.numpadKeyPressed]} onPress={() => onInput('0')}>
              <Text style={styles.numpadKeyText}>0</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.numpadKey, styles.numpadKeyAction, pressed && styles.numpadKeyPressed]} onPress={() => onInput('backspace')}>
              <Ionicons name="backspace-outline" size={24} color="#6B7280" />
            </Pressable>
          </View>
          <View style={[styles.numpadActions, isRTL && styles.numpadActionsRTL]}>
            <Pressable style={[styles.numpadActionBtn, styles.numpadConfirmBtn]} onPress={onConfirm}>
              <Text style={styles.numpadConfirmText}>{t('teacher.common.confirm')}</Text>
            </Pressable>
            <Pressable
              style={[styles.numpadActionBtn, styles.numpadClearBtn]}
              onPress={() => {
                onClear();
                onCancel();
              }}
            >
              <Text style={styles.numpadClearText}>{t('teacher.attendance.clearRating')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function RatingInputEnhanced({ value, onChange, disabled = false, compact = false }: RatingInputEnhancedProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const { showNumpad, tempValue, handlePresetPress, handleClear, openNumpad, handleNumpadConfirm, handleNumpadCancel, handleNumpadInput } = useRatingInput(value, onChange, disabled);

  if (compact) {
    return (
      <>
        <Pressable
          style={[styles.compactBadge, value !== null && styles.compactBadgeActive, disabled && styles.compactBadgeDisabled]}
          onPress={openNumpad}
          disabled={disabled}
          accessibilityLabel={t('teacher.attendance.rating')}
          accessibilityRole="button"
          accessibilityHint={t('teacher.attendance.ratingTapToEdit')}
        >
          <Text style={[styles.compactBadgeText, value === null && styles.compactBadgePlaceholder]}>{value !== null ? `${value}/10` : '—'}</Text>
        </Pressable>
        <NumpadModal visible={showNumpad} value={tempValue} onInput={handleNumpadInput} onConfirm={handleNumpadConfirm} onCancel={handleNumpadCancel} onClear={handleClear} />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{t('teacher.attendance.rating')}</Text>
        {value !== null && (
          <Pressable onPress={handleClear} style={styles.clearButton} accessibilityLabel={t('teacher.attendance.clearRating')} accessibilityRole="button">
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
      <Pressable style={[styles.valueDisplay, disabled && styles.valueDisplayDisabled]} onPress={openNumpad} disabled={disabled} accessibilityRole="button">
        <Text style={[styles.valueText, value === null && styles.valuePlaceholder]}>{value !== null ? t('teacher.attendance.ratingLabel', { value }) : t('teacher.attendance.noRating')}</Text>
        <Ionicons name="create-outline" size={16} color="#9CA3AF" />
      </Pressable>
      <View style={[styles.presetsRow, isRTL && styles.presetsRowRTL]}>
        {QUICK_PRESETS.map(preset => (
          <Pressable
            key={preset}
            style={[styles.presetButton, value === preset && styles.presetButtonActive, disabled && styles.presetButtonDisabled]}
            onPress={() => handlePresetPress(preset)}
            disabled={disabled}
            accessibilityLabel={`${t('teacher.attendance.rating')} ${preset}`}
            accessibilityRole="button"
          >
            <Text style={[styles.presetText, value === preset && styles.presetTextActive]}>{preset}</Text>
          </Pressable>
        ))}
      </View>
      <NumpadModal visible={showNumpad} value={tempValue} onInput={handleNumpadInput} onConfirm={handleNumpadConfirm} onCancel={handleNumpadCancel} onClear={handleClear} />
    </View>
  );
}

const styles = StyleSheet.create({
  clearButton: { padding: 4 },
  compactBadge: { alignItems: 'center', backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderRadius: 8, borderWidth: 1, height: 32, justifyContent: 'center', minWidth: 52, paddingHorizontal: 10 },
  compactBadgeActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  compactBadgeDisabled: { opacity: 0.5 },
  compactBadgePlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  compactBadgeText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
  container: { gap: 8, marginTop: 10 },
  label: { color: '#6B7280', fontSize: 12, fontWeight: '500' },
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  modalOverlay: { alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', flex: 1, justifyContent: 'center' },
  numpadActionBtn: { alignItems: 'center', borderRadius: 10, flex: 1, height: 48, justifyContent: 'center' },
  numpadActions: { flexDirection: 'row', gap: 12 },
  numpadActionsRTL: { flexDirection: 'row-reverse' },
  numpadClearBtn: { backgroundColor: '#FEE2E2' },
  numpadClearText: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
  numpadClose: { padding: 4 },
  numpadConfirmBtn: { backgroundColor: '#3B82F6' },
  numpadConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  numpadContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: 320 },
  numpadDisplay: { alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', marginBottom: 16, height: 90, paddingHorizontal: 40 },
  numpadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  numpadHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  numpadHeaderRTL: { flexDirection: 'row-reverse' },
  numpadKey: { alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, height: 56, justifyContent: 'center', width: 88 },
  numpadKeyAction: { backgroundColor: '#FEF3C7' },
  numpadKeyPressed: { backgroundColor: '#E5E7EB' },
  numpadKeyText: { color: '#111827', fontSize: 22, fontWeight: '600' },
  numpadMax: { color: '#9CA3AF', fontSize: 28, fontWeight: '500' },
  numpadTitle: { color: '#111827', fontSize: 16, fontWeight: '600' },
  numpadValue: { color: '#111827', fontSize: 36, fontWeight: '700' },
  presetButton: { alignItems: 'center', backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderRadius: 8, borderWidth: 1, flex: 1, height: 40, justifyContent: 'center' },
  presetButtonActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  presetButtonDisabled: { opacity: 0.5 },
  presetText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  presetTextActive: { color: '#3B82F6' },
  presetsRow: { flexDirection: 'row', gap: 8 },
  presetsRowRTL: { flexDirection: 'row-reverse' },
  valueDisplay: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: 10, borderWidth: 1, flexDirection: 'row', height: 44, justifyContent: 'space-between', paddingHorizontal: 14 },
  valueDisplayDisabled: { backgroundColor: '#F9FAFB', opacity: 0.5 },
  valuePlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  valueText: { color: '#111827', fontSize: 15, fontWeight: '600' },
});
