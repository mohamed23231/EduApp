import type { UserRole } from '@/core/auth/roles';

export type PhoneOtpPurpose = 'SIGNUP' | 'RESET_PASSWORD';

export type PhoneOtpRequestParams = {
  phone: string;
  purpose: PhoneOtpPurpose;
};

export type PhoneSignupParams = {
  phone: string;
  otp: string;
  password: string;
  role: UserRole;
  fullName: string;
  email?: string;
};

export type PhoneLoginParams = {
  phone: string;
  password: string;
};

export type PhoneResetPasswordRequestParams = {
  phone: string;
};

export type PhoneResetPasswordConfirmParams = {
  phone: string;
  otp: string;
  newPassword: string;
};

export type ParentInviteValidateResponse = {
  valid: boolean;
  expired: boolean;
  alreadyOnboarded: boolean;
};

export type ParentInviteAcceptParams = {
  token: string;
  password: string;
  fullName?: string;
};

export type PhoneAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string | null;
    role: UserRole;
    fullName?: string;
  };
  onboardingRequired?: boolean;
  onboardingReason?: 'USER_NOT_FOUND' | 'PROFILE_NOT_FOUND';
};

export type PhoneLoginResponse = {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string | null;
    role: UserRole;
    fullName?: string;
  };
  onboardingRequired: false;
};

export type PhoneLoginResponseOnboarding = {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string | null;
    role: UserRole;
    fullName?: string;
  } | null;
  onboardingRequired: true;
  onboardingReason?: 'USER_NOT_FOUND' | 'PROFILE_NOT_FOUND';
};

export type PhoneLoginResponseUnion = PhoneLoginResponse | PhoneLoginResponseOnboarding;
