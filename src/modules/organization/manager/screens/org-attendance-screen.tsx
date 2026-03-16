/**
 * OrgAttendanceScreen
 * Dedicated attendance marking screen for the manager role.
 * Mirrors the teacher's AttendanceSheetScreen pattern with inline
 * rating input (domain isolation prevents importing from teacher module).
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  I18nManager,
  Modal,
  Pressable,
  Text as RNText,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ConfirmModal, Input, Text } from '@/components/ui';
import { useOrgAttendance } from '../hooks/use-org-attendance';
import { useManagerStore } from '../store/manager-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#F59E0B',
    '#10B981',
    '#6366F1',
    '#EF4444',
    '#14B8A6',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ---------------------------------------------------------------------------
// Status button config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    icon: keyof typeof Ionicons.glyphMap;
    activeBg: string;
    activeText: string;
  }
> = {
  PRESENT: {
    icon: 'checkmark-circle',
    activeBg: '#D1FAE5',
    activeText: '#065F46',
  },
  ABSENT: {
    icon: 'close-circle',
    activeBg: '#FEE2E2',
    activeText: '#991B1B',
  },
  EXCUSED: {
    icon: 'time',
    activeBg: '#FEF3C7',
    activeText: '#92400E',
  },
};

// ---------------------------------------------------------------------------
// StatusButton (spring-animated)
// ---------------------------------------------------------------------------

function StatusButton({
  label,
  icon,
  isActive,
  activeBg,
  activeText,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  activeBg: string;
  activeText: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      // eslint-disable-next-line react-hooks/immutability
      scale.value = withSpring(0.93, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        style={[
          styles.statusButton,
          isActive && { backgroundColor: activeBg, borderColor: activeBg },
          disabled && styles.statusButtonDisabled,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Ionicons
          name={icon}
          size={16}
          color={isActive ? activeText : '#9CA3AF'}
        />
        <Text
          style={[
            styles.statusButtonText,
            isActive && { color: activeText, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Numpad modal for custom rating
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
      <Pressable style={styles.modalOverlay} onPress={onCancel}>
        <Pressable style={styles.numpadContainer} onPress={e => e.stopPropagation()}>
          <View style={styles.numpadHeader}>
            <Pressable onPress={onCancel} style={styles.numpadClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
            <RNText style={styles.numpadTitle}>
              {t('manager.attendance.enterRating', { defaultValue: 'Enter rating' })}
            </RNText>
            <View style={{ width: 32 }} />
          </View>
          {/* Force LTR so value/10 never reverses */}
          <View style={styles.numpadDisplay}>
            <RNText style={styles.numpadValue}>{value || '\u2014'}</RNText>
            <RNText style={styles.numpadMax}>/10</RNText>
          </View>
          <View style={styles.numpadGrid}>
            {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(d => (
              <Pressable key={d} style={({ pressed }) => [styles.numpadKey, pressed && styles.numpadKeyPressed]} onPress={() => onInput(d)}>
                <RNText style={styles.numpadKeyText}>{d}</RNText>
              </Pressable>
            ))}
            <Pressable style={({ pressed }) => [styles.numpadKey, styles.numpadKeyAction, pressed && styles.numpadKeyPressed]} onPress={() => onInput('10')}>
              <RNText style={styles.numpadKeyText}>10</RNText>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.numpadKey, pressed && styles.numpadKeyPressed]} onPress={() => onInput('0')}>
              <RNText style={styles.numpadKeyText}>0</RNText>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.numpadKey, styles.numpadKeyAction, pressed && styles.numpadKeyPressed]} onPress={() => onInput('backspace')}>
              <Ionicons name="backspace-outline" size={24} color="#6B7280" />
            </Pressable>
          </View>
          <View style={styles.numpadActions}>
            <Pressable style={({ pressed }) => [styles.numpadActionBtn, styles.numpadConfirmBtn, pressed && { opacity: 0.8 }]} onPress={onConfirm}>
              <RNText style={styles.numpadConfirmText}>
                {t('manager.common.confirm', { defaultValue: 'Confirm' })}
              </RNText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.numpadActionBtn, styles.numpadClearBtn, pressed && { opacity: 0.8 }]}
              onPress={() => {
                onClear();
                onCancel();
              }}
            >
              <RNText style={styles.numpadClearText}>
                {t('manager.attendance.clearRating', { defaultValue: 'Clear' })}
              </RNText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// useRatingInput (local hook)
// ---------------------------------------------------------------------------

function useRatingInput(
  value: number | null,
  onChange: (r: number | null) => void,
  disabled: boolean,
) {
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
      // "10" button sends the whole value directly
      if (digit === '10')
        return '10';
      const appended = prev + digit;
      const num = Number.parseInt(appended, 10);
      // If appending works and is valid (0-10), use it
      if (num <= 10 && appended.length <= 2)
        return appended;
      // Otherwise replace: typing "8" after "5" → "8"
      return digit;
    });
  }, []);

  return {
    showNumpad,
    tempValue,
    handlePresetPress,
    handleClear,
    openNumpad,
    handleNumpadConfirm,
    handleNumpadCancel,
    handleNumpadInput,
  };
}

// ---------------------------------------------------------------------------
// RatingInput (inline, matching teacher pattern)
// ---------------------------------------------------------------------------

const QUICK_PRESETS = [10, 9, 8, 7, 5, 0] as const;

function RatingInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const {
    showNumpad,
    tempValue,
    handlePresetPress,
    handleClear,
    openNumpad,
    handleNumpadConfirm,
    handleNumpadCancel,
    handleNumpadInput,
  } = useRatingInput(value, onChange, disabled);

  return (
    <View style={styles.ratingContainer}>
      <View style={styles.ratingLabelRow}>
        <Text style={styles.ratingLabel}>
          {t('manager.attendance.rating', { defaultValue: 'Rating' })}
        </Text>
        {value !== null && (
          <Pressable
            onPress={handleClear}
            style={styles.ratingClearButton}
            accessibilityLabel={t('manager.attendance.clearRating', {
              defaultValue: 'Clear',
            })}
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={16} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
      <Pressable
        style={[
          styles.ratingValueDisplay,
          disabled && styles.ratingValueDisplayDisabled,
        ]}
        onPress={openNumpad}
        disabled={disabled}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.ratingValueText,
            value === null && styles.ratingValuePlaceholder,
          ]}
        >
          {value !== null
            ? t('manager.attendance.ratingLabel', {
                value,
                defaultValue: `${value}/10`,
              })
            : t('manager.attendance.noRating', {
                defaultValue: 'Not rated',
              })}
        </Text>
        <Ionicons name="create-outline" size={16} color="#9CA3AF" />
      </Pressable>
      <View style={[styles.presetsRow, isRTL && styles.presetsRowRTL]}>
        {QUICK_PRESETS.map(preset => (
          <Pressable
            key={preset}
            style={[
              styles.presetButton,
              value === preset && styles.presetButtonActive,
              disabled && styles.presetButtonDisabled,
            ]}
            onPress={() => handlePresetPress(preset)}
            disabled={disabled}
            accessibilityLabel={`${t('manager.attendance.rating', { defaultValue: 'Rating' })} ${preset}`}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.presetText,
                value === preset && styles.presetTextActive,
              ]}
            >
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
// StudentCard
// ---------------------------------------------------------------------------

function StudentCard({
  student,
  status,
  excuseNote,
  rating,
  disabled,
  onStatusChange,
  onExcuseNoteChange,
  onRatingChange,
}: {
  student: { id: string; name: string };
  status: AttendanceStatus | null;
  excuseNote: string;
  rating: number | null;
  disabled: boolean;
  onStatusChange: (status: AttendanceStatus) => void;
  onExcuseNoteChange: (note: string) => void;
  onRatingChange: (rating: number | null) => void;
}) {
  const { t } = useTranslation();
  const isMarked = status !== null;
  const avatarColor = getAvatarColor(student.name);

  return (
    <View style={[styles.studentCard, !isMarked && styles.studentCardUnmarked]}>
      <View style={styles.studentHeader}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
        </View>
        <Text style={styles.studentName}>{student.name}</Text>
        {isMarked
          ? (
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            )
          : (
              <View style={styles.unmarkedDot} />
            )}
      </View>

      <View style={styles.statusButtons}>
        {(
          ['PRESENT', 'ABSENT', 'EXCUSED'] as const
        ).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <StatusButton
              key={s}
              label={t(`manager.attendance.${s.toLowerCase() as 'present' | 'absent' | 'excused'}`, {
                defaultValue: s.charAt(0) + s.slice(1).toLowerCase(),
              })}
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
          placeholder={t('manager.attendance.excuseNote', {
            defaultValue: 'Excuse note...',
          })}
          value={excuseNote}
          onChangeText={onExcuseNoteChange}
          disabled={disabled}
          multiline
          numberOfLines={2}
          style={styles.excuseNoteInput}
        />
      )}

      <RatingInput
        value={rating}
        onChange={onRatingChange}
        disabled={disabled}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// OrgAttendanceScreen
// ---------------------------------------------------------------------------

// eslint-disable-next-line max-lines-per-function
export function OrgAttendanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ 'instance-id': string }>();
  const instanceId = params['instance-id'];
  const activeOrgId = useManagerStore.use.activeOrgId();
  const [searchQuery, setSearchQuery] = useState('');

  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'default' | 'destructive' | 'success';
    hideCancelButton: boolean;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'default',
    hideCancelButton: false,
    onConfirm: () => {},
  });

  const dismissConfirm = () =>
    setConfirmModal(prev => ({ ...prev, visible: false }));

  const {
    instance,
    students,
    attendanceMap,
    isLoading,
    error,
    isSubmitting,
    markedCount,
    totalCount,
    setStudentStatus,
    setExcuseNote,
    setStudentRating,
    submitAttendance,
  } = useOrgAttendance(activeOrgId ?? '', instanceId ?? '');

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim())
      return students;
    const query = searchQuery.toLowerCase().trim();
    return students.filter(s => s.name.toLowerCase().includes(query));
  }, [students, searchQuery]);

  const handleSubmit = async () => {
    if (!instance) {
      setConfirmModal({
        visible: true,
        title: t('manager.common.errorTitle', {
          defaultValue: 'Something went wrong',
        }),
        message: t('manager.attendance.submitError', {
          defaultValue: 'Failed to save attendance. Please try again.',
        }),
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
      return;
    }

    if (instance.state !== 'ACTIVE') {
      setConfirmModal({
        visible: true,
        title: t('manager.common.errorTitle', {
          defaultValue: 'Something went wrong',
        }),
        message: t('manager.attendance.sessionNotActive', {
          defaultValue: 'Start the session first to mark attendance.',
        }),
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
      return;
    }

    try {
      await submitAttendance();
      setConfirmModal({
        visible: true,
        title: t('manager.attendance.submitSuccess', {
          defaultValue: 'Attendance saved successfully!',
        }),
        message: '',
        variant: 'success',
        hideCancelButton: true,
        onConfirm: () => {
          dismissConfirm();
          router.back();
        },
      });
    }
    catch {
      setConfirmModal({
        visible: true,
        title: t('manager.common.errorTitle', {
          defaultValue: 'Something went wrong',
        }),
        message: t('manager.attendance.submitError', {
          defaultValue: 'Failed to save attendance. Please try again.',
        }),
        variant: 'destructive',
        hideCancelButton: true,
        onConfirm: dismissConfirm,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  // Error state with no students
  if (error && students.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            label={t('manager.attendance.back', { defaultValue: 'Back' })}
            onPress={() => router.back()}
            style={{ marginTop: 12 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const sessionClosed = instance?.state === 'CLOSED';
  const sessionDraft = instance?.state === 'DRAFT';
  const sessionNotActive = instance?.state !== 'ACTIVE';

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
            size={24}
            color="#3B82F6"
          />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {instance?.subject
              ?? t('manager.attendance.title', { defaultValue: 'Attendance' })}
          </Text>
          {instance && (
            <Text style={styles.subtitle}>
              {instance.time}
              {' '}
              {'\u00B7'}
              {' '}
              {instance.date}
            </Text>
          )}
        </View>
      </View>

      {/* Warning banners */}
      {sessionClosed && (
        <View style={styles.warningBanner}>
          <Ionicons name="lock-closed" size={14} color="#78350F" />
          <Text style={styles.warningText}>
            {t('manager.attendance.sessionClosed', {
              defaultValue:
                'Session is closed \u2014 attendance is read-only.',
            })}
          </Text>
        </View>
      )}

      {sessionDraft && !sessionClosed && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={14} color="#78350F" />
          <Text style={styles.warningText}>
            {t('manager.attendance.sessionNotActive', {
              defaultValue: 'Start the session first to mark attendance.',
            })}
          </Text>
        </View>
      )}

      {students.length === 0
        ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {t('manager.attendance.emptyStudents', {
                  defaultValue: 'No students assigned to this session.',
                })}
              </Text>
            </View>
          )
        : (
            <>
              {/* Search bar */}
              {students.length > 2 && (
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('manager.attendance.searchStudent', {
                      defaultValue: 'Search students...',
                    })}
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Student list */}
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentInner}
              >
                {filteredStudents.length === 0
                  ? (
                      <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>
                          {t('manager.attendance.noSearchResults', {
                            defaultValue: 'No students match your search.',
                          })}
                        </Text>
                      </View>
                    )
                  : (
                      filteredStudents.map((student) => {
                        const attendance = attendanceMap[student.id];
                        return (
                          <StudentCard
                            key={student.id}
                            student={student}
                            status={attendance?.status ?? null}
                            excuseNote={attendance?.excuseNote ?? ''}
                            rating={attendance?.rating ?? null}
                            disabled={sessionNotActive || isSubmitting}
                            onStatusChange={s => setStudentStatus(student.id, s)}
                            onExcuseNoteChange={n => setExcuseNote(student.id, n)}
                            onRatingChange={r => setStudentRating(student.id, r)}
                          />
                        );
                      })
                    )}
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.markedCount}>
                  {t('manager.attendance.markedCount', {
                    marked: markedCount,
                    total: totalCount,
                    defaultValue: `Marked: ${markedCount}/${totalCount}`,
                  })}
                </Text>
                <Button
                  label={
                    isSubmitting
                      ? t('manager.attendance.submitting', {
                          defaultValue: 'Saving...',
                        })
                      : t('manager.attendance.submitButton', {
                          defaultValue: 'Save Attendance',
                        })
                  }
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={sessionNotActive || isSubmitting}
                  variant="default"
                />
                {error && <Text style={styles.errorBanner}>{error}</Text>}
              </View>
            </>
          )}

      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        disableAnimations
        confirmLabel={t('manager.common.ok', { defaultValue: 'OK' })}
        cancelLabel={t('manager.common.cancel', { defaultValue: 'Cancel' })}
        hideCancelButton={confirmModal.hideCancelButton}
        onConfirm={confirmModal.onConfirm}
        onCancel={dismissConfirm}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#78350F',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    color: '#111827',
    flex: 1,
    fontSize: 15,
    padding: 0,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    color: '#9CA3AF',
    fontSize: 15,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  markedCount: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
  errorBanner: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },

  // Student card
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  studentCardUnmarked: {
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  unmarkedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },

  // Status buttons
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  statusButtonDisabled: {
    opacity: 0.5,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  excuseNoteInput: {
    marginTop: 12,
  },

  // Rating
  ratingContainer: {
    gap: 8,
    marginTop: 10,
  },
  ratingLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  ratingClearButton: {
    padding: 4,
  },
  ratingValueDisplay: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  ratingValueDisplayDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  ratingValueText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  ratingValuePlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetsRowRTL: {
    flexDirection: 'row-reverse',
  },
  presetButton: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  presetButtonDisabled: {
    opacity: 0.5,
  },
  presetText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#3B82F6',
  },

  // Numpad modal
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  numpadContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: 320,
  },
  numpadHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numpadHeaderRTL: {
    flexDirection: 'row-reverse',
  },
  numpadClose: {
    padding: 4,
  },
  numpadTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  numpadDisplay: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    height: 90,
    paddingHorizontal: 40,
    direction: 'ltr',
  },
  numpadValue: {
    color: '#111827',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  numpadMax: {
    color: '#9CA3AF',
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  numpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  numpadKey: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    height: 56,
    justifyContent: 'center',
    width: 88,
  },
  numpadKeyAction: {
    backgroundColor: '#FEF3C7',
  },
  numpadKeyPressed: {
    backgroundColor: '#E5E7EB',
  },
  numpadKeyText: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '600',
  },
  numpadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  numpadActionsRTL: {
    flexDirection: 'row-reverse',
  },
  numpadActionBtn: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  numpadConfirmBtn: {
    backgroundColor: '#3B82F6',
  },
  numpadConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  numpadClearBtn: {
    backgroundColor: '#FEE2E2',
  },
  numpadClearText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
});
