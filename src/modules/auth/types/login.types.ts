import type { z } from 'zod';
import type { loginSchema } from '../validators/login.schema';
import type { UserRole } from '@/core/auth/roles';

export type LoginFormValues = z.infer<typeof loginSchema>;

export type LoginRequestParams = LoginFormValues;

export type LoginUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type LoginResponseSuccess = {
  access: string;
  refresh: string;
  user: LoginUser;
  onboardingRequired: false;
};

export type LoginResponseOnboarding = {
  access: string;
  refresh: string;
  user: null;
  onboardingRequired: true;
};

export type LoginResponse = LoginResponseSuccess | LoginResponseOnboarding;
