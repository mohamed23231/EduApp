/**
 * NumpadModal — custom rating entry (0–10) used by RatingInput.
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text as RNText, View } from 'react-native';
import colors from '@/components/ui/colors';

type NumpadModalProps = {
  visible: boolean;
  value: string;
  onInput: (digit: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onClear: () => void;
};

const DIGIT_ROWS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];

export function NumpadModal({ visible, value, onInput, onConfirm, onCancel, onClear }: NumpadModalProps) {
  const { t } = useTranslation();
  const c = colors;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onCancel}
      >
        <Pressable
          className="w-80 rounded-2xl p-5"
          style={{ backgroundColor: c.neutral.card }}
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Pressable
              onPress={onCancel}
              style={{ padding: 4 }}
              accessibilityRole="button"
              accessibilityLabel={t('manager.common.close', { defaultValue: 'Close' })}
            >
              <Ionicons name="close" size={24} color={c.neutral.inkMuted} />
            </Pressable>
            <RNText style={{ fontSize: 16, fontWeight: '600', color: c.neutral.ink }}>
              {t('manager.attendance.enterRating', { defaultValue: 'Enter rating' })}
            </RNText>
            <View style={{ width: 32 }} />
          </View>

          {/* Display — forced LTR so "8/10" never reverses */}
          <View style={{ backgroundColor: c.neutral.cardWarm, borderRadius: 12, height: 90, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 16, direction: 'ltr' } as object}>
            <RNText style={{ fontSize: 36, fontWeight: '700', color: c.neutral.ink, writingDirection: 'ltr' }}>
              {value || '—'}
            </RNText>
            <RNText style={{ fontSize: 28, fontWeight: '500', color: c.neutral.inkMuted, writingDirection: 'ltr' }}>
              /10
            </RNText>
          </View>

          {/* Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {DIGIT_ROWS.map(d => (
              <Pressable
                key={d}
                onPress={() => onInput(d)}
                style={({ pressed }) => ({ width: 88, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.neutral.rule : c.neutral.cardWarm, borderRadius: 10 })}
              >
                <RNText style={{ fontSize: 22, fontWeight: '600', color: c.neutral.ink }}>{d}</RNText>
              </Pressable>
            ))}
            <Pressable onPress={() => onInput('10')} style={({ pressed }) => ({ width: 88, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.semantic.excusedSoft : c.semantic.excusedSoft, borderRadius: 10 })}>
              <RNText style={{ fontSize: 22, fontWeight: '600', color: c.neutral.ink }}>10</RNText>
            </Pressable>
            <Pressable onPress={() => onInput('0')} style={({ pressed }) => ({ width: 88, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.neutral.rule : c.neutral.cardWarm, borderRadius: 10 })}>
              <RNText style={{ fontSize: 22, fontWeight: '600', color: c.neutral.ink }}>0</RNText>
            </Pressable>
            <Pressable
              onPress={() => onInput('backspace')}
              style={({ pressed }) => ({ width: 88, height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.neutral.rule : c.semantic.excusedSoft, borderRadius: 10 })}
              accessibilityRole="button"
              accessibilityLabel={t('manager.attendance.backspace', { defaultValue: 'Backspace' })}
            >
              <Ionicons name="backspace-outline" size={24} color={c.neutral.inkMuted} />
            </Pressable>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => ({ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: c.brand.primary, opacity: pressed ? 0.8 : 1 })}
            >
              <RNText style={{ fontSize: 15, fontWeight: '600', color: c.neutral.ink }}>
                {t('manager.common.confirm', { defaultValue: 'Confirm' })}
              </RNText>
            </Pressable>
            <Pressable
              onPress={() => {
                onClear();
                onCancel();
              }}
              style={({ pressed }) => ({ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: c.semantic.absentSoft, opacity: pressed ? 0.8 : 1 })}
            >
              <RNText style={{ fontSize: 15, fontWeight: '600', color: c.semantic.absentInk }}>
                {t('manager.attendance.clearRating', { defaultValue: 'Clear' })}
              </RNText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
