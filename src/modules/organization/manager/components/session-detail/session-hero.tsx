/**
 * SessionHero — dark card for ManagerSessionDetail.
 * Shows status pill, subject, time/duration/grade, teacher row.
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Dot, Monogram, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type SessionStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';

type SessionHeroProps = {
  subject: string;
  status: SessionStatus;
  time?: string;
  durationMinutes?: number;
  grade?: string;
  teacherName?: string;
  teacherTone?: 'indigo' | 'rose' | 'teal' | 'amber' | 'violet' | 'sky' | 'lime' | 'present' | 'absent' | 'excused' | 'ink';
  onTeacherPress?: () => void;
};

const STATUS_LABEL: Record<SessionStatus, string> = {
  DRAFT: 'UPCOMING',
  ACTIVE: 'LIVE NOW',
  CLOSED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export function SessionHero({
  subject,
  status,
  time,
  durationMinutes,
  grade,
  teacherName,
  teacherTone = 'sky',
  onTeacherPress,
}: SessionHeroProps) {
  const { t } = useTranslation();
  const isLive = status === 'ACTIVE';
  const statusLabel = STATUS_LABEL[status] ?? status;
  const c = colors;

  const metaParts = [
    time,
    durationMinutes ? t('manager.sessionDetail.durationValue', { minutes: durationMinutes, defaultValue: '{{minutes}} min' }) : undefined,
    grade,
  ].filter(Boolean).join(' · ');

  return (
    <View
      className="mx-4 mb-4 overflow-hidden rounded-[22px] p-5"
      style={{ backgroundColor: c.neutral.ink }}
    >
      {/* Lime glow */}
      <View
        style={{
          position: 'absolute',
          top: -50,
          end: -50,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: c.brand.primary,
          opacity: 0.28,
        }}
      />

      {/* Status pill */}
      <View
        className="flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' }}
      >
        {isLive && <Dot size={5} color={c.brand.primary} pulse />}
        <Text
          style={{ fontSize: 9, letterSpacing: 1.5, fontWeight: '800', color: isLive ? c.brand.primary : c.neutral.dim }}
        >
          {statusLabel}
        </Text>
      </View>

      {/* Subject */}
      <Text
        style={{ fontSize: 28, fontWeight: '800', letterSpacing: -1, marginTop: 12, color: '#fff', lineHeight: 32 }}
      >
        {subject}
      </Text>

      {/* Meta */}
      {metaParts
        ? (
            <Text style={{ fontSize: 13, color: c.neutral.dim, fontWeight: '500', marginTop: 6 }}>
              {metaParts}
            </Text>
          )
        : null}

      {/* Teacher row */}
      {teacherName
        ? (
            <View className="mt-4 flex-row items-center gap-2.5">
              <Monogram name={teacherName} tone={teacherTone} size={36} />
              <View className="flex-1">
                <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>{teacherName}</Text>
                <Text style={{ fontSize: 11, color: c.neutral.dim, fontWeight: '500' }}>
                  {t('manager.sessionDetail.teacherLabel', { defaultValue: 'Teacher' })}
                </Text>
              </View>
              {onTeacherPress
                ? (
                    <Pressable
                      onPress={onTeacherPress}
                      className="rounded-full px-3 py-1.5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' }}
                    >
                      <Ionicons name="person-outline" size={14} color="#fff" />
                    </Pressable>
                  )
                : null}
            </View>
          )
        : null}
    </View>
  );
}
