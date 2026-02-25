/**
 * useSessionCrud hook
 * CRUD operations for session templates
 * Validates: Requirements 2.1, 3.1, 6.1, 6.2, 6.3, 6.4, 7.1, 11.1, 11.3, 13.1, 14.1
 */

import type { CreateSessionInput, SessionTemplate, UpdateSessionInput } from '../types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { QueryKey } from '@/shared/constants/query-keys';
import {
  assignStudents,
  createTemplate,
  deleteTemplate,
  getTemplate,
  removeStudents,
  updateTemplate,
} from '../services';
import { getTeacherIdHash, trackSessionCreated } from '../services/analytics.service';

type UseSessionCrudResult = {
  createSession: (data: CreateSessionInput) => Promise<SessionTemplate>;
  updateSession: (id: string, data: UpdateSessionInput) => Promise<SessionTemplate>;
  deleteSession: (id: string) => Promise<void>;
  assignStudents: (templateId: string, studentIds: string[]) => Promise<void>;
  removeStudents: (templateId: string, studentIds: string[]) => Promise<void>;
  isSubmitting: boolean;
};

type ReconcileConfig = {
  templateId: string;
  targetIds: string[];
  existingIds: string[];
  doAssign: (p: { templateId: string; studentIds: string[] }) => Promise<void>;
  doRemove: (p: { templateId: string; studentIds: string[] }) => Promise<void>;
};

/**
 * Reconcile student assignments: add new, remove old
 */
async function reconcileStudents(config: ReconcileConfig) {
  const existingSet = new Set(config.existingIds);
  const targetSet = new Set(config.targetIds);

  const idsToAdd = config.targetIds.filter(id => !existingSet.has(id));
  const idsToRemove = config.existingIds.filter(id => !targetSet.has(id));

  if (idsToAdd.length > 0)
    await config.doAssign({ templateId: config.templateId, studentIds: idsToAdd });
  if (idsToRemove.length > 0)
    await config.doRemove({ templateId: config.templateId, studentIds: idsToRemove });
}

/**
 * Hook to manage session template CRUD operations
 */
export function useSessionCrud(): UseSessionCrudResult {
  const queryClient = useQueryClient();
  const user = useAuthStore.use.user();
  const invalidateSessions = () => queryClient.invalidateQueries({ queryKey: QueryKey.teacher.sessions });

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: (template) => {
      if (user?.id)
        trackSessionCreated(getTeacherIdHash(user.id), template.id);
      invalidateSessions();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionInput }) => updateTemplate(id, data),
    onSuccess: invalidateSessions,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: invalidateSessions,
  });

  const assignMutation = useMutation({
    mutationFn: ({ templateId, studentIds }: { templateId: string; studentIds: string[] }) => assignStudents(templateId, studentIds),
    onSuccess: invalidateSessions,
  });

  const removeMutation = useMutation({
    mutationFn: ({ templateId, studentIds }: { templateId: string; studentIds: string[] }) => removeStudents(templateId, studentIds),
    onSuccess: invalidateSessions,
  });

  const handleCreateSession = useCallback(
    async (data: CreateSessionInput): Promise<SessionTemplate> => {
      const { studentIds, ...templateData } = data;
      const template = await createMutation.mutateAsync(templateData);

      if (studentIds.length > 0) {
        await assignMutation.mutateAsync({ templateId: template.id, studentIds });
      }

      return getTemplate(template.id);
    },
    [assignMutation, createMutation],
  );

  const handleUpdateSession = useCallback(
    async (id: string, data: UpdateSessionInput): Promise<SessionTemplate> => {
      const { studentIds, ...templateData } = data;
      const updated = await updateMutation.mutateAsync({ id, data: templateData });

      if (!studentIds)
        return updated;

      const existing = await getTemplate(id);
      await reconcileStudents({
        templateId: id,
        targetIds: studentIds,
        existingIds: existing.assignedStudents.map(s => s.id),
        doAssign: p => assignMutation.mutateAsync(p),
        doRemove: p => removeMutation.mutateAsync(p),
      });

      return getTemplate(id);
    },
    [assignMutation, removeMutation, updateMutation],
  );

  const handleDeleteSession = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  const handleAssignStudents = useCallback(
    (templateId: string, studentIds: string[]) => assignMutation.mutateAsync({ templateId, studentIds }),
    [assignMutation],
  );

  const handleRemoveStudents = useCallback(
    (templateId: string, studentIds: string[]) => removeMutation.mutateAsync({ templateId, studentIds }),
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
