import { z } from 'zod';

export const sessionSchema = z.object({
  subject: z.string().trim().min(1, 'teacher.sessions.validation.subjectRequired'),
  daysOfWeek: z.array(z.number().int().min(1).max(7)).min(1, 'teacher.sessions.validation.daysOfWeekRequired'),
  time: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'teacher.sessions.validation.timeInvalid'),
  studentIds: z.array(z.string()).min(1, 'teacher.sessions.validation.studentsRequired'),
});

export type SessionFormValues = z.infer<typeof sessionSchema>;
