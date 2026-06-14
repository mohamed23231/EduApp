/**
 * StudentCard — attendance + rating input for a single student.
 * Extracted from OrgAttendanceScreen to stay under the 300-line file cap.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, Modal, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Input, Monogram, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

const c = colors;

// ---------------------------------------------------------------------------
// NumpadModal
// ---------------------------------------------------------------------------

function NumpadModal({
  visible,
  value,
  onInput,
  onConfirm,
  onCancel,
  onClear,
}: {
  visible: boolean;
  value: string;
  onInput: (digit: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();

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
          <View className="mb-4 flex-row items-center justify-between">
            <Pressable onPress={onCancel} className="p-1">
              <Ionicons name="close" size={24} color={c.neutral.inkMuted} />
            </Pressable>
            <Text style={{ fontSize: 16, fontWeight: '600', color: c.neutral.ink }}>
              {t('manager.attendance.enterRating', { defaultValue: 'Enter rating' })}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Display — force LTR so value/10 never reverses */}
          <View
            className="mb-4 h-[90px] flex-row items-center justify-center rounded-xl px-10"
            style={{ backgroundColor: c.neutral.paper, direction: 'ltr' } as object}
          >
            <Text style={{ fontSize: 36, fontWeight: '700', color: c.neutral.ink, writingDirection: 'ltr' }}>
              {value || '—'}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '500', color: c.neutral.inkMuted, writingDirection: 'ltr' }}>
              /10
            </Text>
          </View>

          {/* Grid */}
          <View className="mb-4 flex-row flex-wrap justify-center gap-2">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '10', '0', 'backspace'].map(d => (
              <Pressable
                key={d}
                className="h-14 w-[88px] items-center justify-center rounded-xl"
                style={({ pressed }) => ({ backgroundColor: pressed ? c.neutral.rule : (d === '10' || d === 'backspace' ? c.semantic.excusedSoft : c.neutral.cardWarm) })}
                onPress={() => onInput(d)}
              >
                {d === 'backspace'
                  ? <Ionicons name="backspace-outline" size={24} color={c.neutral.inkMuted} />
                  : <Text style={{ fontSize: 22, fontWeight: '600', color: c.neutral.ink }}>{d}</Text>}
              </Pressable>
            ))}
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <Pressable
              className="h-12 flex-1 items-center justify-center rounded-xl"
              style={({ pressed }) => ({ backgroundColor: pressed ? c.semantic.info : c.brand.primary, opacity: 1 })}
              onPress={onConfirm}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>
                {t('manager.common.confirm', { defaultValue: 'Confirm' })}
              </Text>
            </Pressable>
            <Pressable
              className="h-12 flex-1 items-center justify-center rounded-xl"
              style={({ pressed }) => ({ backgroundColor: pressed ? c.semantic.absentSoft : c.semantic.absentSoft })}
              onPress={() => {
                onClear();
                onCancel();
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: c.semantic.absent }}>
                {t('manager.attendance.clearRating', { defaultValue: 'Clear' })}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// useRatingInput
// ---------------------------------------------------------------------------

function useRatingInput(value: number | null, onChange: (r: number | null) => void, disabled: boolean) {
  const [showNumpad, setShowNumpad] = useState(false);
  const [tempValue, setTempValue] = useState('');

  const handlePresetPress = useCallback(
    (preset: number) => {
      if (!disabled)
        onChange(preset);
    },
    [disabled, onChange],
  );

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
      if (digit === '10')
        return '10';
      const appended = prev + digit;
      const num = Number.parseInt(appended, 10);
      if (num <= 10 && appended.length <= 2)
        return appended;
      return digit;
    });
  }, []);

  return { showNumpad, tempValue, handlePresetPress, handleClear, openNumpad, handleNumpadConfirm, handleNumpadCancel, handleNumpadInput };
}

// ---------------------------------------------------------------------------
// RatingInput
// ---------------------------------------------------------------------------

const QUICK_PRESETS = [10, 9, 8, 7, 5, 0] as const;

function RatingInput({ value, onChange, disabled = false }: { value: number | null; onChange: (r: number | null) => void; disabled?: boolean }) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const { showNumpad, tempValue, handlePresetPress, handleClear, openNumpad, handleNumpadConfirm, handleNumpadCancel, handleNumpadInput } = useRatingInput(value, onChange, disabled);

  return (
    <View className="mt-2.5 gap-2">
      <View className="flex-row items-center justify-between">
        <Text style={{ fontSize: 12, fontWeight: '500', color: c.neutral.inkMuted }}>
          {t('manager.attendance.rating', { defaultValue: 'Rating' })}
        </Text>
        {value !== null && (
          <Pressable onPress={handleClear} className="p-1" accessibilityRole="button" accessibilityLabel={t('manager.attendance.clearRating', { defaultValue: 'Clear' })}>
            <Ionicons name="close-circle" size={16} color={c.neutral.inkMuted} />
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={openNumpad}
        disabled={disabled}
        accessibilityRole="button"
        className="h-11 flex-row items-center justify-between rounded-xl px-3.5"
        style={({ pressed }) => ({ backgroundColor: pressed ? c.neutral.cardWarm : c.neutral.card, borderWidth: 1, borderColor: c.neutral.rule, opacity: disabled ? 0.5 : 1 })}
      >
        <Text style={{ fontSize: 15, fontWeight: '600', color: value !== null ? c.neutral.ink : c.neutral.inkMuted }}>
          {value !== null
            ? t('manager.attendance.ratingLabel', { value, defaultValue: `${value}/10` })
            : t('manager.attendance.noRating', { defaultValue: 'Not rated' })}
        </Text>
        <Ionicons name="create-outline" size={16} color={c.neutral.inkMuted} />
      </Pressable>

      <View className={isRTL ? 'flex-row-reverse gap-2' : 'flex-row gap-2'}>
        {QUICK_PRESETS.map(preset => (
          <Pressable
            key={preset}
            onPress={() => handlePresetPress(preset)}
            disabled={disabled}
            accessibilityRole="button"
            className="h-10 flex-1 items-center justify-center rounded-lg"
            style={{ backgroundColor: value === preset ? c.semantic.infoSoft : c.neutral.cardWarm, borderWidth: 1, borderColor: value === preset ? c.semantic.info : c.neutral.rule, opacity: disabled ? 0.5 : 1 }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: value === preset ? c.semantic.info : c.neutral.inkMuted }}>
              {preset}
            </Text>
          </Pressable>
        ))}
      </View>

      <NumpadModal
        visible={showNumpad}
        value={tempValue}
        onInput={handleNumpadInput}
        onConfirm={handleNumpadConfirm}
        onCancel={handleNumpadCancel}
        onClear={handleClear}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// StatusButton
// ---------------------------------------------------------------------------

function StatusButton({ label, icon, isActive, activeBg, activeText, disabled, onPress }: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  activeBg: string;
  activeText: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[{ flex: 1 }, animStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => {
          if (!disabled)
            // eslint-disable-next-line react-hooks/immutability
            scale.value = withSpring(0.93, { damping: 15 });
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, { damping: 15 });
        }}
        className="flex-row items-center justify-center gap-1 rounded-xl py-2.5"
        style={{
          backgroundColor: isActive ? activeBg : c.neutral.card,
          borderWidth: 1,
          borderColor: isActive ? activeBg : c.neutral.rule,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Ionicons name={icon} size={16} color={isActive ? activeText : c.neutral.inkMuted} />
        <Text style={{ fontSize: 13, fontWeight: isActive ? '600' : '500', color: isActive ? activeText : c.neutral.inkMuted }}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const STATUS_CONFIG: Record<AttendanceStatus, { icon: keyof typeof Ionicons.glyphMap; activeBg: string; activeText: string }> = {
  PRESENT: { icon: 'checkmark-circle', activeBg: colors.semantic.presentSoft, activeText: colors.semantic.presentInk },
  ABSENT: { icon: 'close-circle', activeBg: colors.semantic.absentSoft, activeText: colors.semantic.absentInk },
  EXCUSED: { icon: 'time', activeBg: colors.semantic.excusedSoft, activeText: colors.semantic.excusedInk },
};

// ---------------------------------------------------------------------------
// StudentCard (exported)
// ---------------------------------------------------------------------------

export function StudentCard({
  student,
  status,
  excuseNote,
  rating,
  disabled,
  note,
  noteAuthorName,
  onStatusChange,
  onExcuseNoteChange,
  onRatingChange,
}: {
  student: { id: string; name: string };
  status: AttendanceStatus | null;
  excuseNote: string;
  rating: number | null;
  disabled: boolean;
  note?: string | null;
  noteAuthorName?: string | null;
  onStatusChange: (s: AttendanceStatus) => void;
  onExcuseNoteChange: (n: string) => void;
  onRatingChange: (r: number | null) => void;
}) {
  const { t } = useTranslation();
  const isMarked = status !== null;

  return (
    <View
      className="rounded-2xl p-3.5"
      style={{
        backgroundColor: c.neutral.card,
        borderWidth: 1,
        borderColor: isMarked ? c.neutral.rule : c.neutral.dim,
        borderStyle: isMarked ? 'solid' : 'dashed',
      }}
    >
      {/* Header row */}
      <View className="mb-3 flex-row items-center gap-2.5">
        <Monogram name={student.name} size={36} />
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: c.neutral.ink }}>{student.name}</Text>
        {isMarked
          ? <Ionicons name="checkmark-circle" size={18} color={c.semantic.present} />
          : <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: c.neutral.dim }} />}
      </View>

      {/* Status buttons */}
      <View className="flex-row gap-2">
        {(['PRESENT', 'ABSENT', 'EXCUSED'] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <StatusButton
              key={s}
              label={t(`manager.attendance.${s.toLowerCase() as 'present' | 'absent' | 'excused'}`, { defaultValue: s.charAt(0) + s.slice(1).toLowerCase() })}
              icon={cfg.icon}
              isActive={status === s}
              activeBg={cfg.activeBg}
              activeText={cfg.activeText}
              disabled={disabled}
              onPress={() => onStatusChange(s)}
            />
          );
        })}
      </View>

      {status === 'EXCUSED' && (
        <Input
          placeholder={t('manager.attendance.excuseNote', { defaultValue: 'Excuse note...' })}
          value={excuseNote}
          onChangeText={onExcuseNoteChange}
          disabled={disabled}
          multiline
          numberOfLines={2}
          style={{ marginTop: 12 }}
        />
      )}

      <RatingInput value={rating} onChange={onRatingChange} disabled={disabled} />

      {note
        ? (
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.neutral.rule }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: c.neutral.inkMuted }}>
                {noteAuthorName ?? 'Teacher'}
              </Text>
              <Text style={{ fontSize: 12, color: c.neutral.inkSoft, marginTop: 2, lineHeight: 17 }}>{note}</Text>
            </View>
          )
        : null}
    </View>
  );
}
