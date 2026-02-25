/**
 * StudentListScreen — Teacher
 * Enhanced student list with session assignment visibility,
 * filter chips (All / Assigned / Unassigned), rich student cards,
 * search, bottom-sheet quick actions, skeleton loader.
 */

import type { StudentActionsSheetRef } from '../components';
import type { FilterOption } from '../components/filter-chips';
import type { Student } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  I18nManager,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import {
  EmptyState,
  FilterChips,
  StudentActionsSheet,
  StudentCard,
  StudentListSkeleton,
} from '../components';
import { useStudents, useStudentSessions } from '../hooks';

type FilterKey = 'all' | 'assigned' | 'unassigned';

function StudentListBody({
  isInitialLoad,
  error,
  students,
  isRefreshing,
  isPaginating,
  renderItem,
  onRefetch,
  onAddStudent,
  onLoadMore,
  filter,
  t,
}: {
  isInitialLoad: boolean;
  error: string | null;
  students: Student[];
  isRefreshing: boolean;
  isPaginating: boolean;
  renderItem: (info: { item: Student; index: number }) => React.ReactElement;
  onRefetch: () => void;
  onAddStudent: () => void;
  onLoadMore: () => void;
  filter: FilterKey;
  t: (key: string) => string;
}) {
  if (isInitialLoad) {
    return <StudentListSkeleton />;
  }
  if (error) {
    return (
      <View style={styles.errorBox}>
        <Ionicons name="alert-circle-outline" size={36} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          onPress={onRefetch}
          style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.retryLabel}>{t('teacher.common.retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const emptyTitle = filter === 'assigned'
    ? t('teacher.students.emptyAssigned')
    : filter === 'unassigned'
      ? t('teacher.students.emptyUnassigned')
      : t('teacher.students.emptyTitle');

  const emptyMessage = filter === 'all'
    ? t('teacher.students.emptyMessage')
    : t('teacher.students.emptyFilterMessage');

  let footerComponent: React.ReactElement | null = null;
  if (isPaginating) {
    footerComponent = (
      <View style={styles.footerLoader}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <FlatList
      data={students}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      contentContainerStyle={[styles.list, students.length === 0 && styles.listEmpty]}
      ListEmptyComponent={(
        <EmptyState
          icon={filter === 'unassigned' ? 'checkmark-circle-outline' : 'people-outline'}
          title={emptyTitle}
          message={emptyMessage}
          actionLabel={filter === 'all' ? t('teacher.students.createButton') : undefined}
          onAction={filter === 'all' ? onAddStudent : undefined}
        />
      )}
      ListFooterComponent={footerComponent}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      refreshControl={(
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefetch}
          tintColor="#3B82F6"
        />
      )}
    />
  );
}

function StudentListHeader({ totalCount, onAdd, t }: {
  totalCount: number;
  onAdd: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>{t('teacher.students.title')}</Text>
        <Text style={styles.subtitle}>
          {t('teacher.students.totalCount', { count: totalCount })}
        </Text>
      </View>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.students.createButton')}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function SearchBar({ value, onChange, t }: {
  value: string;
  onChange: (text: string) => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={16} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder={t('teacher.students.searchPlaceholder')}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

function useStudentFiltering(
  students: Student[],
  assignedStudentIds: Set<string>,
) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filteredStudents = useMemo(() => {
    if (filter === 'all') {
      return students;
    }
    if (filter === 'assigned') {
      return students.filter(s => assignedStudentIds.has(s.id));
    }
    return students.filter(s => !assignedStudentIds.has(s.id));
  }, [students, filter, assignedStudentIds]);

  const assignedCount = useMemo(
    () => students.filter(s => assignedStudentIds.has(s.id)).length,
    [students, assignedStudentIds],
  );

  const filterOptions: FilterOption<FilterKey>[] = useMemo(() => [
    { key: 'all', label: t('teacher.students.filterAll'), count: students.length },
    { key: 'assigned', label: t('teacher.students.filterAssigned'), count: assignedCount },
    {
      key: 'unassigned',
      label: t('teacher.students.filterUnassigned'),
      count: students.length - assignedCount,
    },
  ], [t, students.length, assignedCount]);

  return { filter, setFilter, filteredStudents, filterOptions };
}

export function StudentListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const actionsRef = useRef<StudentActionsSheetRef>(null);

  const { students, isLoading, isRefreshing, isPaginating, error, setSearch, loadMore, refetch } = useStudents();
  const { sessionMap, assignedStudentIds, refetch: refetchSessions } = useStudentSessions();
  const { filter, setFilter, filteredStudents, filterOptions } = useStudentFiltering(
    students,
    assignedStudentIds,
  );

  const [searchText, setSearchText] = useState('');

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      setSearch(text);
    },
    [setSearch],
  );

  const handleAddStudent = useCallback(
    () => router.push(AppRoute.teacher.studentCreate as any),
    [router],
  );

  const handleStudentPress = useCallback(
    (student: Student) => actionsRef.current?.open(student),
    [],
  );

  const handleEdit = useCallback(
    (id: string) => router.push(AppRoute.teacher.studentEdit(id) as any),
    [router],
  );

  const handleRefresh = useCallback(() => {
    refetch();
    refetchSessions();
  }, [refetch, refetchSessions]);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchSessions();
    }, [refetch, refetchSessions]),
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Student; index: number }) => (
      <StudentCard
        student={item}
        index={index}
        sessionInfo={sessionMap[item.id]}
        onPress={handleStudentPress}
      />
    ),
    [handleStudentPress, sessionMap],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StudentListHeader totalCount={students.length} onAdd={handleAddStudent} t={t} />
      <SearchBar value={searchText} onChange={handleSearchChange} t={t} />
      <View style={styles.filterRow}>
        <FilterChips options={filterOptions} selected={filter} onSelect={setFilter} />
      </View>
      <StudentListBody
        isInitialLoad={isLoading}
        error={error}
        students={filteredStudents}
        isRefreshing={isRefreshing}
        isPaginating={isPaginating}
        renderItem={renderItem}
        onRefetch={handleRefresh}
        onAddStudent={handleAddStudent}
        onLoadMore={loadMore}
        filter={filter}
        t={t}
      />
      <StudentActionsSheet ref={actionsRef} onEdit={handleEdit} onDeleted={handleRefresh} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnPressed: { backgroundColor: '#2563EB', transform: [{ scale: 0.95 }] },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  filterRow: { marginBottom: 10 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  listEmpty: { flexGrow: 1 },
  errorBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: { fontSize: 15, color: '#DC2626', textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  retryLabel: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
});
