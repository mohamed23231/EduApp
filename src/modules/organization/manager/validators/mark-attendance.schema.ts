import { z } from 'zod';

export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED']),
  excuseNote: z.string().optional(),
  rating: z.number().min(0).max(10).optional(),
});

export const markAttendanceSchema = z.object({
  records: z.array(attendanceRecordSchema).min(1),
});

export type MarkAttendanceValues = z.infer<typeof markAttendanceSchema>;
