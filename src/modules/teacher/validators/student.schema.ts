import { z } from 'zod';
import { isValidE164Phone } from '@/shared/utils/phone';

export const studentSchema = z.object({
  name: z.string().trim().min(1, 'teacher.students.form.validation.nameRequired'),
  gradeLevel: z.string().optional(),
  notes: z.string().optional(),
});

export const createStudentSchema = studentSchema.extend({
  parentPhone: z
    .string()
    .trim()
    .min(1, 'teacher.students.form.validation.parentPhoneRequired')
    .refine(value => isValidE164Phone(value), {
      message: 'teacher.students.form.validation.parentPhoneInvalid',
    }),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
export type CreateStudentFormValues = z.infer<typeof createStudentSchema>;
