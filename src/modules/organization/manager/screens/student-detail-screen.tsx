/**
 * StudentDetailScreen — Manager
 * Shows student info, assigned sessions, and attendance/performance stats.
 */

import type { OrgStudentStats } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, I18nManager, Linking, Pressable, View as RNView, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import {
  useDeleteStudent,
  useOrgStudent,
  useOrgStudentStats,
  useRegenerateStudentCode,
} from '../hooks';
import { useManagerStore } from '../store/manager-store';

const APP_DOWNLOAD_URL = 'https://privatedu.app';

const RANGE_OPTIONS = ['week', 'month', 'term'] as const;
type Range = (typeof RANGE_OPTIONS)[number];

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ value, label, icon, color }: {
  value: string | number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <RNView style={styles.statCard}>
      <RNView style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </RNView>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </RNView>
  );
}

// ---------------------------------------------------------------------------
// Subject row
// ---------------------------------------------------------------------------

function SubjectRow({ subject }: {
  subject: OrgStudentStats['subjects'][number];
}) {
  const { t } = useTranslation();
  const rating = subject.averageRating > 0
    ? subject.averageRating.toFixed(1)
    : '—';

  return (
    <RNView style={styles.subjectRow}>
      <RNView style={styles.subjectIcon}>
        <Ionicons name="book-outline" size={16} color="#6366F1" />
      </RNView>
      <RNView style={styles.subjectInfo}>
        <Text style={styles.subjectName}>{subject.subject}</Text>
        <Text style={styles.subjectTeacher}>{subject.teacherName}</Text>
      </RNView>
      <RNView style={styles.subjectStats}>
        <RNView style={styles.subjectStatPill}>
          <Ionicons name="checkmark-circle-outline" size={12} color="#10B981" />
          <Text style={styles.subjectStatText}>
            {t('manager.studentDetail.attended', {
              count: subject.sessionsAttended,
              defaultValue: '{{count}} attended',
            })}
          </Text>
        </RNView>
        <RNView style={styles.subjectStatPill}>
          <Ionicons name="star-outline" size={12} color="#F59E0B" />
          <Text style={styles.subjectStatText}>{rating}</Text>
        </RNView>
      </RNView>
    </RNView>
  );
}

// ---------------------------------------------------------------------------
// Rating trend mini-chart (horizontal dots)
// ---------------------------------------------------------------------------

function RatingTrend({ ratings }: { ratings: number[] }) {
  const { t } = useTranslation();
  if (ratings.length === 0) {
    return null;
  }

  const max = 10;
  return (
    <RNView style={styles.trendContainer}>
      <Text style={styles.sectionLabel}>
        {t('manager.studentDetail.ratingTrend', { defaultValue: 'Rating trend (last 10)' })}
      </Text>
      <RNView style={styles.trendRow}>
        {ratings.map((r, idx) => {
          const height = Math.max(8, (r / max) * 36);
          const color = r >= 7
            ? '#10B981'
            : r >= 4
              ? '#F59E0B'
              : '#EF4444';
          return (
            // eslint-disable-next-line react/no-array-index-key
            <RNView key={`trend-${idx}`} style={styles.trendBarWrap}>
              <RNView style={[styles.trendBar, { height, backgroundColor: color }]} />
              <Text style={styles.trendBarLabel}>{r}</Text>
            </RNView>
          );
        })}
      </RNView>
    </RNView>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

// eslint-disable-next-line max-lines-per-function
export function StudentDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const [range, setRange] = useState<Range>('month');

  const studentQuery = useOrgStudent(activeOrgId, params.id);
  const statsQuery = useOrgStudentStats(activeOrgId, params.id, range);
  const deleteMutation = useDeleteStudent(activeOrgId);
  const regenerateMutation = useRegenerateStudentCode(activeOrgId);

  const student = studentQuery.data;
  const stats = statsQuery.data;

  const attendanceItems = useMemo(() => {
    if (!stats) {
      return [];
    }
    return [
      { key: 'present', value: stats.present, color: '#10B981', icon: 'checkmark-circle-outline' as const },
      { key: 'absent', value: stats.absent, color: '#EF4444', icon: 'close-circle-outline' as const },
      { key: 'excused', value: stats.excused, color: '#F59E0B', icon: 'alert-circle-outline' as const },
    ];
  }, [stats]);

  const handleCopy = useCallback(async () => {
    if (!student) {
      return;
    }
    await Clipboard.setStringAsync(student.connectionCode);
    Alert.alert(
      t('manager.students.copiedTitle', { defaultValue: 'Copied' }),
      t('manager.students.copiedBody', { defaultValue: 'The connection code is ready to paste.' }),
    );
  }, [student, t]);

  const handleWhatsApp = useCallback(async () => {
    if (!student) {
      return;
    }
    const message = `${student.name} - ${student.connectionCode}\n${APP_DOWNLOAD_URL}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
    else {
      await Clipboard.setStringAsync(message);
      Alert.alert(
        t('manager.whatsapp.copiedTitle', { defaultValue: 'Copied' }),
        t('manager.whatsapp.copiedBody', { defaultValue: 'WhatsApp is unavailable, message copied.' }),
      );
    }
  }, [student, t]);

  const handleDelete = useCallback(() => {
    if (!student) {
      return;
    }
    Alert.alert(
      t('manager.students.deleteTitle', { defaultValue: 'Delete student?' }),
      t('manager.students.deleteMessage', { defaultValue: 'This will remove the student from future sessions. Historical data is preserved.' }),
      [
        { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('manager.students.deleteConfirm', { defaultValue: 'Delete' }),
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(student.id, {
              onSuccess: () => router.back(),
            });
          },
        },
      ],
    );
  }, [student, deleteMutation, router, t]);

  const handleRegenerate = useCallback(() => {
    if (!student) {
      return;
    }
    Alert.alert(
      t('manager.students.regenerateTitle', { defaultValue: 'Regenerate code?' }),
      t('manager.students.regenerateMessage', { defaultValue: 'The old code will stop working immediately.' }),
      [
        { text: t('manager.common.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('manager.students.actions.regenerate', { defaultValue: 'Regenerate code' }),
          onPress: () => regenerateMutation.mutate(student.id),
        },
      ],
    );
  }, [student, regenerateMutation, t]);

  // Loading state
  if (studentQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F9FAFB]">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  // Error state
  if (studentQuery.isError || !student) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F9FAFB] px-6">
        <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
        <Text className="font-inter mt-3 text-center text-base text-rose-600">
          {t('manager.studentDetail.loadError', { defaultValue: 'Failed to load student.' })}
        </Text>
        <Button
          className="mt-4"
          variant="outline"
          label={t('manager.studentDetail.retry', { defaultValue: 'Retry' })}
          fullWidth={false}
          onPress={() => studentQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView contentContainerClassName="px-5 pb-10 pt-5">
        {/* ── Header ── */}
        <RNView style={styles.header}>
          <RNView style={styles.avatar}>
            <Text style={styles.avatarText}>
              {student.name.charAt(0).toUpperCase()}
            </Text>
          </RNView>
          <View className="flex-1">
            <Text className="font-inter text-2xl font-bold text-slate-900">
              {student.name}
            </Text>
            <RNView style={styles.headerMeta}>
              {student.gradeLevel
                ? (
                    <RNView style={styles.metaPill}>
                      <Ionicons name="school-outline" size={13} color="#6B7280" />
                      <Text className="font-inter text-xs text-slate-500">
                        {student.gradeLevel}
                      </Text>
                    </RNView>
                  )
                : null}
              {student.hasParentLinked
                ? (
                    <RNView style={[styles.metaPill, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="link" size={13} color="#3B82F6" />
                      <Text className="font-inter text-xs font-medium text-blue-600">
                        {t('manager.students.parentLinked', { defaultValue: 'Parent linked' })}
                      </Text>
                    </RNView>
                  )
                : null}
            </RNView>
          </View>
        </RNView>

        {/* ── Connection code ── */}
        <RNView style={styles.codeCard}>
          <Text style={styles.codeLabel}>
            {t('manager.students.connectionCode', { defaultValue: 'Connection code' })}
          </Text>
          <Text style={styles.codeText}>{student.connectionCode}</Text>
          <RNView style={styles.codeActions}>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="copy-outline" size={14} color="#3B82F6" />
              <Text style={[styles.chipLabel, { color: '#3B82F6' }]}>
                {t('manager.students.actions.copy', { defaultValue: 'Copy code' })}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleWhatsApp}
              style={({ pressed }) => [styles.chip, { backgroundColor: '#F0FDF4' }, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
              <Text style={[styles.chipLabel, { color: '#25D366' }]}>
                {t('manager.whatsapp.share', { defaultValue: 'WhatsApp' })}
              </Text>
            </Pressable>
          </RNView>
        </RNView>

        {/* ── Assigned Sessions ── */}
        <Text style={styles.sectionLabel}>
          {t('manager.studentDetail.assignedSessions', { defaultValue: 'Assigned sessions' })}
        </Text>

        {(!student.assignedSessions || student.assignedSessions.length === 0)
          ? (
              <RNView style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={24} color="#D1D5DB" />
                <Text className="font-inter text-sm text-slate-400">
                  {t('manager.studentDetail.noSessions', { defaultValue: 'Not assigned to any sessions yet.' })}
                </Text>
              </RNView>
            )
          : (
              <RNView style={{ gap: 8 }}>
                {student.assignedSessions.map(session => (
                  <Pressable
                    key={session.templateId}
                    onPress={() => router.push(AppRoute.manager.sessionDetail(session.templateId))}
                    style={({ pressed }) => [styles.sessionCard, pressed && { backgroundColor: '#F8FAFC' }]}
                  >
                    <RNView style={styles.sessionStripe} />
                    <RNView style={styles.sessionBody}>
                      <Text style={styles.sessionSubject}>{session.subject}</Text>
                      <RNView style={styles.sessionMeta}>
                        <Ionicons name="person-outline" size={12} color="#9CA3AF" />
                        <Text className="font-inter text-xs text-slate-400">
                          {session.teacherName}
                        </Text>
                      </RNView>
                    </RNView>
                    <Ionicons
                      name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={16}
                      color="#D1D5DB"
                    />
                  </Pressable>
                ))}
              </RNView>
            )}

        {/* ── Performance Stats ── */}
        <RNView style={styles.rangeSection}>
          <Text style={styles.sectionLabel}>
            {t('manager.studentDetail.performance', { defaultValue: 'Performance' })}
          </Text>
          <RNView style={styles.rangeRow}>
            {RANGE_OPTIONS.map(r => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                style={[styles.rangePill, range === r && styles.rangePillActive]}
              >
                <Text style={[styles.rangePillText, range === r && styles.rangePillTextActive]}>
                  {t(`manager.reports.range.${r}`, { defaultValue: r })}
                </Text>
              </Pressable>
            ))}
          </RNView>
        </RNView>

        {statsQuery.isLoading
          ? (
              <RNView style={styles.statsLoading}>
                <ActivityIndicator size="small" color="#6366F1" />
              </RNView>
            )
          : statsQuery.isError
            ? (
                <RNView style={styles.emptyCard}>
                  <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
                  <Text className="font-inter text-sm text-red-500">
                    {t('manager.studentDetail.statsError', { defaultValue: 'Could not load stats.' })}
                  </Text>
                </RNView>
              )
            : stats
              ? (
                  <>
                    {/* Attendance summary */}
                    <RNView style={styles.statsGrid}>
                      <StatCard
                        value={`${Math.round(stats.attendanceRate)}%`}
                        label={t('manager.studentDetail.attendanceRate', { defaultValue: 'Attendance' })}
                        icon="pie-chart-outline"
                        color="#6366F1"
                      />
                      <StatCard
                        value={stats.averageRating > 0
                          ? stats.averageRating.toFixed(1)
                          : '—'}
                        label={t('manager.studentDetail.avgRating', { defaultValue: 'Avg. rating' })}
                        icon="star-outline"
                        color="#F59E0B"
                      />
                      <StatCard
                        value={stats.totalSessions}
                        label={t('manager.studentDetail.totalSessions', { defaultValue: 'Sessions' })}
                        icon="layers-outline"
                        color="#3B82F6"
                      />
                    </RNView>

                    {/* Attendance breakdown */}
                    <RNView style={styles.breakdownRow}>
                      {attendanceItems.map(item => (
                        <RNView key={item.key} style={styles.breakdownItem}>
                          <Ionicons name={item.icon} size={16} color={item.color} />
                          <Text style={[styles.breakdownValue, { color: item.color }]}>{item.value}</Text>
                          <Text style={styles.breakdownLabel}>
                            {t(`manager.studentDetail.${item.key}`, { defaultValue: item.key })}
                          </Text>
                        </RNView>
                      ))}
                    </RNView>

                    {/* Rating trend */}
                    <RatingTrend ratings={stats.ratingTrend} />

                    {/* Per-subject breakdown */}
                    {stats.subjects.length > 0 && (
                      <>
                        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>
                          {t('manager.studentDetail.bySubject', { defaultValue: 'By subject' })}
                        </Text>
                        <RNView style={{ gap: 8 }}>
                          {stats.subjects.map(sub => (
                            <SubjectRow key={sub.subject} subject={sub} />
                          ))}
                        </RNView>
                      </>
                    )}
                  </>
                )
              : null}

        {/* ── Actions ── */}
        <RNView style={styles.dangerSection}>
          <Pressable
            onPress={handleRegenerate}
            style={({ pressed }) => [styles.dangerRow, pressed && { backgroundColor: '#FFFBEB' }]}
          >
            <Ionicons name="refresh-outline" size={20} color="#F59E0B" />
            <Text style={[styles.dangerRowLabel, { color: '#F59E0B' }]}>
              {t('manager.students.actions.regenerate', { defaultValue: 'Regenerate code' })}
            </Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#D1D5DB" />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.dangerRow, styles.dangerRowBorder, pressed && { backgroundColor: '#FEF2F2' }]}
          >
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={[styles.dangerRowLabel, { color: '#DC2626' }]}>
              {t('manager.students.actions.delete', { defaultValue: 'Delete' })}
            </Text>
            <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color="#D1D5DB" />
          </Pressable>
        </RNView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  // Connection code
  codeCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    padding: 16,
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 4,
    textAlign: 'center',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chipLabel: { fontSize: 13, fontWeight: '600' },
  // Section labels
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  // Sessions
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sessionStripe: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#6366F1',
  },
  sessionBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 3,
  },
  sessionSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Empty states
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  // Range picker
  rangeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  rangePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  rangePillActive: {
    backgroundColor: '#6366F1',
  },
  rangePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  rangePillTextActive: {
    color: '#FFFFFF',
  },
  // Stats grid
  statsLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Breakdown row
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  breakdownItem: {
    alignItems: 'center',
    gap: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  // Rating trend
  trendContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 56,
    marginTop: 8,
  },
  trendBarWrap: {
    alignItems: 'center',
    gap: 2,
  },
  trendBar: {
    width: 16,
    borderRadius: 4,
  },
  trendBarLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // Subject rows
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  subjectIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectInfo: {
    flex: 1,
    gap: 2,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  subjectTeacher: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  subjectStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  subjectStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subjectStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Danger actions
  dangerSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  dangerRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dangerRowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
