import type {
  PhoneAuthResponse,
  PhoneOtpRequestParams,
  PhoneSignupParams,
  PhoneSignupVerifyParams,
  PhoneSignupVerifyResponse,
} from '../types';
import { useMutation } from '@tanstack/react-query';
import {
  phoneSignup,
  requestPhoneOtp,
  verifyPhoneSignup,
} from '../services/phone-auth.service';

export function usePhoneSignup() {
  return useMutation<PhoneAuthResponse, Error, PhoneSignupParams>({
    mutationFn: phoneSignup,
  });
}

export function usePhoneOtpRequest() {
  return useMutation<void, Error, PhoneOtpRequestParams>({
    mutationFn: requestPhoneOtp,
  });
}

export function usePhoneSignupVerify() {
  return useMutation<PhoneSignupVerifyResponse, Error, PhoneSignupVerifyParams>({
    mutationFn: verifyPhoneSignup,
  });
}
