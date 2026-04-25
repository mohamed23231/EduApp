import { z } from 'zod';

export const createOrgSchema = z.object({
  name: z.string().trim().min(2, 'manager.setup.validation.nameRequired'),
  phoneE164: z.string().trim().optional(),
  email: z.string().trim().email('manager.setup.validation.emailInvalid').optional().or(z.literal('')),
  address: z.string().trim().optional(),
});

export type CreateOrgValues = z.infer<typeof createOrgSchema>;
