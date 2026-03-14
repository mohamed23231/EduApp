import { z } from 'zod';

export const createStudentSchema = z.object({
  name: z.string().trim().min(1, 'manager.students.validation.nameRequired'),
  gradeLevel: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  parentPhone: z.string().trim().optional(),
});

export type CreateStudentValues = z.infer<typeof createStudentSchema>;
