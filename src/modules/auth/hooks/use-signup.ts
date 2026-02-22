import type { SignupPayload } from '../types/signup.types';
import { useMutation } from '@tanstack/react-query';
import { authClient } from '@/lib/api/client';

export function useSignup() {
  return useMutation({
    mutationFn: (data: SignupPayload) =>
      authClient.post('/auth/signup', data).then(res => res.data.data),
  });
}
