/**
 * StudentCard — Enhanced
 * Rich card with avatar, grade, session assignment badges,
 * spring-animated press feedback, and staggered entrance.
 */

import type { StudentSessionInfo } from '../hooks/use-student-sessions';
import type { Student } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';

type StudentCardProps = {
  student: Student;
  index: number;
  sessionInfo?: StudentSessionInfo;
  onPress: (student: Student) => void;
};

const AVATAR_COLORS = [
  { bg: '#EDE9FE', text: '#7C3AED' },
  { bg: '#DBEAFE', text: '#2563EB' },
  { bg: '#D1FAE5', text: '#059669' },
  { bg: '#FEF3C7', text: '#D97706' },
  { bg: '#FCE7F3', text: '#DB2777' },
  { bg: '#E0E7FF', text: '#4338CA' },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function StudentCard({ student, index, sessionInfo, onPress }: StudentCardProps) {
  const { t } = useTranslation();
  const color = getAvatarColor(student.name);
  const isAssigned = sessionInfo && sessionInfo.sessionCount > 0;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250, delay: Math.min(index * 40, 200) }}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          style={styles.card}
          onPress={() => onPress(student)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={student.name}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: color.bg }]}>
            <Text style={[styles.avatarLetter, { color: color.text }]}>
              {student.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{student.name}</Text>

            <View style={styles.metaRow}>
              {student.gradeLevel
                ? (
                  <View style={styles.gradePill}>
                    <Ionicons name="school-outline" size={11} color="#6B7280" />
                    <Text style={styles.gradeText}>{student.gradeLevel}</Text>
                  </View>
                )
                : null}

              {isAssigned
                ? (
                  <View style={styles.sessionPill}>
                    <Ionicons name="calendar-outline" size={11} color="#059669" />
                    <Text style={styles.sessionText}>
                      {t('teacher.students.sessionCount', { count: sessionInfo.sessionCount })}
                    </Text>
                  </View>
                )
                : (
                  <View style={styles.unassignedPill}>
                    <Ionicons name="alert-circle-outline" size={11} color="#D97706" />
                    <Text style={styles.unassignedText}>
                      {t('teacher.students.noSessions')}
                    </Text>
                  </View>
                )}
            </View>

            {/* Session subjects preview */}
            {isAssigned && sessionInfo.sessions.length > 0
              ? (
                <Text style={styles.sessionSubjects} numberOfLines={1}>
                  {sessionInfo.sessions.map(s => s.subject).join(' · ')}
                </Text>
              )
              : null}
          </View>

          {/* Action hint */}
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#D1D5DB" />
        </Pressable>
      </Animated.View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 19, fontWeight: '700' },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: '600', color: '#111827' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gradeText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  sessionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sessionText: { fontSize: 11, color: '#059669', fontWeight: '500' },
  unassignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unassignedText: { fontSize: 11, color: '#D97706', fontWeight: '500' },
  sessionSubjects: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
});
