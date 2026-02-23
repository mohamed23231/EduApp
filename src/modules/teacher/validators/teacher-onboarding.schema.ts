import { z } from 'zod';

export const teacherOnboardingSchema = z.object({
  name: z.string().trim().min(1, 'teacher.onboarding.validation.nameRequired'),
  phone: z.string().optional(),
});

export type TeacherOnboardingFormValues = z.infer<typeof teacherOnboardingSchema>;
