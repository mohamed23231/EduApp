/**
 * AttendanceStatusControl component
 * Student card with initials avatar, name, and three-way status toggle.
 * Unmarked state has a subtle dashed border cue.
 * Spring-animated press feedback on status buttons.
 */

import type { AttendanceStatus } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Input, Text } from '@/components/ui';

type AttendanceStatusControlProps = {
  student: { id: string; name: string };
  status: AttendanceStatus | null;
  excuseNote: string;
  onStatusChange: (status: AttendanceStatus) => void;
  onExcuseNoteChange: (note: string) => void;
  disabled: boolean;
};

const STATUS_CONFIG: Record<AttendanceStatus, {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  activeBg: string;
  activeText: string;
}> = {
  PRESENT: { icon: 'checkmark-circle', bg: '#FFFFFF', activeBg: '#D1FAE5', activeText: '#065F46' },
  ABSENT: { icon: 'close-circle', bg: '#FFFFFF', activeBg: '#FEE2E2', activeText: '#991B1B' },
  EXCUSED: { icon: 'time', bg: '#FFFFFF', activeBg: '#FEF3C7', activeText: '#92400E' },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function StatusButton({
  label,
  icon,
  isActive,
  config,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  isActive: boolean;
  config: typeof STATUS_CONFIG.PRESENT;
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
          isActive && { backgroundColor: config.activeBg, borderColor: config.activeBg },
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
          color={isActive ? config.activeText : '#9CA3AF'}
        />
        <Text
          style={[
            styles.statusButtonText,
            isActive && { color: config.activeText, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function AttendanceStatusControl({
  student,
  status,
  excuseNote,
  onStatusChange,
  onExcuseNoteChange,
  disabled,
}: AttendanceStatusControlProps) {
  const { t } = useTranslation();
  const isMarked = status !== null;
  const avatarColor = getAvatarColor(student.name);

  return (
    <View style={[styles.container, !isMarked && styles.containerUnmarked]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{getInitials(student.name)}</Text>
        </View>
        <Text style={styles.studentName}>{student.name}</Text>
        {isMarked
          ? <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          : <View style={styles.unmarkedDot} />}
      </View>

      <View style={styles.statusButtons}>
        <StatusButton
          label={t('teacher.attendance.present')}
          icon={STATUS_CONFIG.PRESENT.icon}
          isActive={status === 'PRESENT'}
          config={STATUS_CONFIG.PRESENT}
          disabled={disabled}
          onPress={() => onStatusChange('PRESENT')}
        />
        <StatusButton
          label={t('teacher.attendance.absent')}
          icon={STATUS_CONFIG.ABSENT.icon}
          isActive={status === 'ABSENT'}
          config={STATUS_CONFIG.ABSENT}
          disabled={disabled}
          onPress={() => onStatusChange('ABSENT')}
        />
        <StatusButton
          label={t('teacher.attendance.excused')}
          icon={STATUS_CONFIG.EXCUSED.icon}
          isActive={status === 'EXCUSED'}
          config={STATUS_CONFIG.EXCUSED}
          disabled={disabled}
          onPress={() => onStatusChange('EXCUSED')}
        />
      </View>

      {status === 'EXCUSED' && (
        <Input
          placeholder={t('teacher.attendance.excuseNote')}
          value={excuseNote}
          onChangeText={onExcuseNoteChange}
          disabled={disabled}
          multiline
          numberOfLines={2}
          style={styles.excuseNoteInput}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  containerUnmarked: {
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  header: {
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
});