/**
 * useStudentFiltering — derives the All/Assigned/Unassigned filter state,
 * the filtered list, and the filter-chip options. Extracted from
 * student-list-screen.
 */

import type { FilterOption } from '../components/filter-chips';
import type { StudentFilterKey } from '../components/students/student-list-body';
import type { Student } from '../types';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useStudentFiltering(
  students: Student[],
  assignedStudentIds: Set<string>,
) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<StudentFilterKey>('all');

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

  const filterOptions: FilterOption<StudentFilterKey>[] = useMemo(() => [
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
