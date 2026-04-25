import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptInvitationById,
  acceptInvitationByToken,
  declineInvitationById,
  getContexts,
} from '../services/contexts-api.service';

export const SharedQueryKey = {
  contexts: ['shared', 'contexts'] as const,
} as const;

export function useContexts() {
  return useQuery({
    queryKey: SharedQueryKey.contexts,
    queryFn: getContexts,
  });
}

export function useAcceptInvitationByToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvitationByToken(token),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SharedQueryKey.contexts });
    },
  });
}

export function useAcceptInvitationById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitationById(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SharedQueryKey.contexts });
    },
  });
}

export function useDeclineInvitationById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => declineInvitationById(invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SharedQueryKey.contexts });
    },
  });
}
