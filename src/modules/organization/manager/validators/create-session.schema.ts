import { z } from 'zod';

export const createSessionSchema = z.object({
  subject: z.string().trim().min(1, 'manager.sessions.validation.subjectRequired'),
  daysOfWeek: z
    .array(z.number().min(1).max(7))
    .min(1, 'manager.sessions.validation.daysRequired'),
  time: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'manager.sessions.validation.timeInvalid'),
  durationMinutes: z.number().min(1).max(240),
  assignedMemberId: z.string().min(1, 'manager.sessions.validation.teacherRequired'),
  studentIds: z.array(z.string()).optional(),
});

export type CreateSessionValues = z.infer<typeof createSessionSchema>;
