import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ message: 'auth.login.validation.emailRequired' })
    .min(1, 'auth.login.validation.emailRequired')
    .email('auth.login.validation.emailInvalid'),
  password: z
    .string({ message: 'auth.login.validation.passwordRequired' })
    .min(1, 'auth.login.validation.passwordRequired')
    .min(8, 'auth.login.validation.passwordMinLength'),
});
