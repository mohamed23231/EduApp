export const QueryKey = {
  auth: ['auth'] as const,
  parent: {
    me: ['parent', 'me'] as const,
    students: ['parent', 'students'] as const,
    attendanceStats: (studentId: string) =>
      ['parent', 'attendance', studentId, 'statistics'] as const,
    attendanceTimeline: (studentId: string, page: number) =>
      ['parent', 'attendance', studentId, 'timeline', page] as const,
  },
  teacher: {
    me: ['teacher', 'me'] as const,
    students: ['teacher', 'students'] as const,
  },
  admin: {
    teachers: ['admin', 'teachers'] as const,
    parents: ['admin', 'parents'] as const,
  },
  superAdmin: {
    plans: ['super-admin', 'plans'] as const,
    admins: ['super-admin', 'admins'] as const,
  },
} as const;
