/**
 * useLinkStudent hook
 * Mutation hook for linking a student to the authenticated parent
 * Validates: Requirements 9.3, 9.4, 9.8
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '@/shared/constants/query-keys';
import { linkStudent } from '../services/students.service';

export function useLinkStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: linkStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKey.parent.students });
    },
  });
}
