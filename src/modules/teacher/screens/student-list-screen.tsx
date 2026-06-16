/**
 * StudentListScreen — Teacher
 * Enhanced student list with session assignment visibility,
 * filter chips (All / Assigned / Unassigned), rich student cards,
 * search, bottom-sheet quick actions, skeleton loader.
 */

import type { StudentActionsSheetRef } from '../components';
import type { Student } from '../types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeatureFlags } from '@/core/feature-flags/use-feature-flags';
import { AppRoute } from '@/core/navigation/routes';
import { FilterChips, StudentActionsSheet, StudentCard } from '../components';
import { StudentListBody } from '../components/students/student-list-body';
import { StudentListHeader, StudentSearchBar } from '../components/students/student-list-header';
import { useStudents, useStudentSessions } from '../hooks';
import { useStudentFiltering } from '../hooks/use-student-filtering';

export function StudentListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const actionsRef = useRef<StudentActionsSheetRef>(null);
  const { isTeacherPerformanceEnabled } = useFeatureFlags();

  const { students, isLoading, isRefreshing, isPaginating, error, setSearch, loadMore, refetch, silentRefetch } = useStudents();
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

  const handleViewPerformance = useCallback(
    (id: string) => router.push(AppRoute.teacher.studentPerformance(id) as any),
    [router],
  );

  const handleRefresh = useCallback(() => {
    refetch();
    refetchSessions();
  }, [refetch, refetchSessions]);

  useFocusEffect(
    useCallback(() => {
      silentRefetch();
      refetchSessions();
    }, [silentRefetch, refetchSessions]),
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
      <StudentSearchBar value={searchText} onChange={handleSearchChange} t={t} />
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
      <StudentActionsSheet ref={actionsRef} onEdit={handleEdit} onDeleted={handleRefresh} onViewPerformance={isTeacherPerformanceEnabled ? handleViewPerformance : undefined} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F0' },
  filterRow: { marginBottom: 10 },
});
