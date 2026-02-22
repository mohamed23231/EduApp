import type { LoginRequestParams, LoginResponse } from '../types';
import { useMutation } from '@tanstack/react-query';
import { loginService } from '../services';

export function useLogin() {
  return useMutation<LoginResponse, Error, LoginRequestParams>({
    mutationFn: loginService,
  });
}
