import type { SignupResponse } from '../services/signup.service';
import type { SignupPayload } from '../types/signup.types';
import { useMutation } from '@tanstack/react-query';
import { signupService } from '../services';

export function useSignup() {
  return useMutation<SignupResponse, Error, SignupPayload>({
    mutationFn: signupService,
  });
}
