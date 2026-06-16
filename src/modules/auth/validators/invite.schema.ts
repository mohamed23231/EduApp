import { z } from 'zod';

export const inviteAcceptSchema = z.object({
  fullName: z
    .string({ message: 'auth.invite.validation.fullNameRequired' })
    .min(1, 'auth.invite.validation.fullNameRequired'),
  password: z
    .string({ message: 'auth.invite.validation.passwordRequired' })
    .min(8, 'auth.invite.validation.passwordMinLength'),
});
