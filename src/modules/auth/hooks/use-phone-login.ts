import type { PhoneLoginParams, PhoneLoginResponseUnion } from '../types';
import { useMutation } from '@tanstack/react-query';
import { phoneLogin } from '../services/phone-auth.service';

export function usePhoneLogin() {
  return useMutation<PhoneLoginResponseUnion, Error, PhoneLoginParams>({
    mutationFn: phoneLogin,
  });
}
