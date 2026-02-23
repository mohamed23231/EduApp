/**
 * useStudentCrud hook
 * CRUD operations for students
 * Validates: Requirements 11.1, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9, 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.9
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { QueryKey } from '@/shared/constants/query-keys';
import type { CreateStudentInput, Student, UpdateStudentInput } from '../types';
import {
  createStudent,
  deleteStudent,
  updateStudent,
} from '../services';

type UseStudentCrudResult = {
  createStudent: (data: CreateStudentInput) => Promise<Student>;
  updateStudent: (id: string, data: UpdateStudentInput) => Promise<Student>;
  deleteStudent: (id: string) => Promise<void>;
  isSubmitting: boolean;
};

/**
 * Hook to manage student CRUD operations
 */
export function useStudentCrud(): UseStudentCrudResult {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentInput }) =>
      updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const handleCreateStudent = useCallback(
    async (data: CreateStudentInput): Promise<Student> => {
      return createMutation.mutateAsync(data);
    },
    [createMutation],
  );

  const handleUpdateStudent = useCallback(
    async (id: string, data: UpdateStudentInput): Promise<Student> => {
      return updateMutation.mutateAsync({ id, data });
    },
    [updateMutation],
  );

  const handleDeleteStudent = useCallback(
    async (id: string): Promise<void> => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    createStudent: handleCreateStudent,
    updateStudent: handleUpdateStudent,
    deleteStudent: handleDeleteStudent,
    isSubmitting: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
