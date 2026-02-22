import { z } from 'zod';

export const SignupSchema = z.object({
  fullName: z
    .string()
    .min(1, 'auth.signup.validation.fullNameRequired')
    .max(100, 'auth.signup.validation.fullNameTooLong'),
  email: z.string().email('auth.signup.validation.emailInvalid'),
  password: z.string().min(8, 'auth.signup.validation.passwordTooShort'),
  role: z.enum(['TEACHER', 'PARENT'], {
    error: 'auth.signup.validation.roleRequired',
  }),
});

export type SignupPayload = z.infer<typeof SignupSchema>;
