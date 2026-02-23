/**
 * useSessionCrud hook
 * CRUD operations for session templates
 * Validates: Requirements 2.1, 3.1, 6.1, 6.2, 6.3, 6.4, 7.1, 11.1, 11.3, 13.1, 14.1
 */

import type { CreateSessionInput, SessionTemplate, UpdateSessionInput } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { QueryKey } from '@/shared/constants/query-keys';
import {
  assignStudents,
  createTemplate,
  deleteTemplate,
  removeStudents,
  updateTemplate,
} from '../services';

type UseSessionCrudResult = {
  createSession: (data: CreateSessionInput) => Promise<SessionTemplate>;
  updateSession: (id: string, data: UpdateSessionInput) => Promise<SessionTemplate>;
  deleteSession: (id: string) => Promise<void>;
  assignStudents: (templateId: string, studentIds: string[]) => Promise<void>;
  removeStudents: (templateId: string, studentIds: string[]) => Promise<void>;
  isSubmitting: boolean;
};

/**
 * Hook to manage session template CRUD operations
 */
export function useSessionCrud(): UseSessionCrudResult {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionInput }) =>
      updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ templateId, studentIds }: { templateId: string; studentIds: string[] }) =>
      assignStudents(templateId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ templateId, studentIds }: { templateId: string; studentIds: string[] }) =>
      removeStudents(templateId, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.teacher.students });
    },
  });

  const handleCreateSession = useCallback(
    async (data: CreateSessionInput): Promise<SessionTemplate> => {
      return createMutation.mutateAsync(data);
    },
    [createMutation],
  );

  const handleUpdateSession = useCallback(
    async (id: string, data: UpdateSessionInput): Promise<SessionTemplate> => {
      return updateMutation.mutateAsync({ id, data });
    },
    [updateMutation],
  );

  const handleDeleteSession = useCallback(
    async (id: string): Promise<void> => {
      return deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  const handleAssignStudents = useCallback(
    async (templateId: string, studentIds: string[]): Promise<void> => {
      return assignMutation.mutateAsync({ templateId, studentIds });
    },
    [assignMutation],
  );

  const handleRemoveStudents = useCallback(
    async (templateId: string, studentIds: string[]): Promise<void> => {
      return removeMutation.mutateAsync({ templateId, studentIds });
    },
    [removeMutation],
  );

  return {
    createSession: handleCreateSession,
    updateSession: handleUpdateSession,
    deleteSession: handleDeleteSession,
    assignStudents: handleAssignStudents,
    removeStudents: handleRemoveStudents,
    isSubmitting: createMutation.isPending
      || updateMutation.isPending
      || deleteMutation.isPending
      || assignMutation.isPending
      || removeMutation.isPending,
  };
}
