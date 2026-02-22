import { z } from 'zod';

export const linkStudentSchema = z.object({
  accessCode: z.string().trim().min(1, 'parent.linkStudent.validation.codeRequired'),
});

export type LinkStudentFormValues = z.infer<typeof linkStudentSchema>;
