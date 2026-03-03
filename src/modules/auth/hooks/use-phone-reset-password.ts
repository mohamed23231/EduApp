import type { PhoneResetPasswordConfirmParams, PhoneResetPasswordRequestParams } from '../types';
import { useMutation } from '@tanstack/react-query';
import { confirmPhoneResetPassword, requestPhoneResetPassword } from '../services/phone-auth.service';

export function usePhoneResetPasswordRequest() {
  return useMutation<void, Error, PhoneResetPasswordRequestParams>({
    mutationFn: requestPhoneResetPassword,
  });
}

export function usePhoneResetPasswordConfirm() {
  return useMutation<void, Error, PhoneResetPasswordConfirmParams>({
    mutationFn: confirmPhoneResetPassword,
  });
}
