/**
 * InstanceCard — single session instance row inside SessionDetailScreen.
 * Handles DRAFT / ACTIVE / CLOSED states with appropriate actions.
 */

import type { OrgSessionInstance } from '../../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { I18nManager, Pressable, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type InstanceCardProps = {
  instance: OrgSessionInstance;
  onStart: () => void;
  onClose: () => void;
  onViewAttendance: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

const STATE_CONFIG: Record<string, { soft: string; ink: string; dot: string; stripe: string }> = {
  DRAFT: {
    soft: colors.semantic.excusedSoft,
    ink: colors.semantic.excusedInk,
    dot: colors.semantic.excused,
    stripe: colors.semantic.excused,
  },
  ACTIVE: {
    soft: colors.semantic.presentSoft,
    ink: colors.semantic.presentInk,
    dot: colors.brand.primary,
    stripe: colors.brand.primary,
  },
  CLOSED: {
    soft: colors.neutral.cardWarm,
    ink: colors.neutral.inkSoft,
    dot: colors.neutral.dim,
    stripe: colors.neutral.dim,
  },
  CANCELLED: {
    soft: colors.semantic.excusedSoft,
    ink: colors.semantic.excusedInk,
    dot: colors.neutral.dim,
    stripe: colors.neutral.dim,
  },
};

export function InstanceCard({ instance, onStart, onClose, onViewAttendance, t }: InstanceCardProps) {
  const cfg = STATE_CONFIG[instance.state] ?? STATE_CONFIG.CLOSED;
  const studentCount = instance.studentCount ?? instance.students?.length ?? 0;

  return (
    <View
      className="flex-row overflow-hidden rounded-2xl"
      style={{ backgroundColor: colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule }}
    >
      {/* Left stripe */}
      <View style={{ width: 4, backgroundColor: cfg.stripe }} />

      <View className="flex-1 gap-2.5 p-3.5">
        {/* Top row */}
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.ink }}>{instance.time}</Text>
            <View className="mt-0.5 flex-row items-center gap-1">
              <Ionicons name="people-outline" size={12} color={colors.neutral.inkMuted} />
              <Text style={{ fontSize: 12, color: colors.neutral.inkMuted }}>
                {t('manager.dashboard.sessionStudents', { count: studentCount, defaultValue: '{{count}} students' })}
              </Text>
            </View>
          </View>
          {/* Badge */}
          <View className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1" style={{ backgroundColor: cfg.soft }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: cfg.ink }}>
              {t(`manager.sessionDetail.instanceState.${instance.state.toLowerCase()}`, { defaultValue: instance.state })}
            </Text>
          </View>
        </View>

        {/* DRAFT: Start */}
        {instance.state === 'DRAFT' && (
          <View className="self-start">
            <Button
              label={t('manager.dashboard.startSession', { defaultValue: 'Start Session' })}
              onPress={onStart}
              size="sm"
              variant="default"
            />
          </View>
        )}

        {/* ACTIVE: Mark + End */}
        {instance.state === 'ACTIVE' && (
          <View className="flex-row gap-2">
            <Pressable
              onPress={onViewAttendance}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5"
              style={{ backgroundColor: colors.brand.primary }}
            >
              <Ionicons name="checkmark-done-outline" size={16} color={colors.neutral.ink} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.neutral.ink }}>
                {t('manager.dashboard.markAttendance', { defaultValue: 'Mark Attendance' })}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="flex-row items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5"
              style={{ backgroundColor: colors.semantic.absentSoft, borderWidth: 1, borderColor: `${colors.semantic.absent}40` }}
            >
              <Ionicons name="stop-circle-outline" size={16} color={colors.semantic.absentInk} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.semantic.absentInk }}>
                {t('manager.dashboard.endSession', { defaultValue: 'End' })}
              </Text>
            </Pressable>
          </View>
        )}

        {/* CLOSED: View Attendance */}
        {instance.state === 'CLOSED' && (
          <Pressable
            onPress={onViewAttendance}
            className="flex-row items-center gap-1.5 self-start rounded-xl px-3 py-2"
            style={{ backgroundColor: colors.semantic.infoSoft, borderWidth: 1, borderColor: `${colors.semantic.info}40` }}
          >
            <Ionicons name="document-text-outline" size={15} color={colors.semantic.info} />
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.semantic.info }}>
              {t('manager.sessionDetail.viewAttendance', { defaultValue: 'View Attendance' })}
            </Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={14} color={colors.semantic.info} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
