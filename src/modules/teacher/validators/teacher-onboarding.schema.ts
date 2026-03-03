import { z } from 'zod';
import { isValidE164Phone } from '@/shared/utils/phone';

export const teacherOnboardingSchema = z.object({
  name: z.string().trim().min(1, 'teacher.onboarding.validation.nameRequired'),
  phone: z.string().optional().refine(value => !value || isValidE164Phone(value), {
    message: 'teacher.onboarding.validation.phoneInvalid',
  }),
});

export type TeacherOnboardingFormValues = z.infer<typeof teacherOnboardingSchema>;
