import { z } from 'zod';

export const studentSchema = z.object({
  name: z.string().trim().min(1, 'teacher.students.validation.nameRequired'),
  gradeLevel: z.string().optional(),
  notes: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
