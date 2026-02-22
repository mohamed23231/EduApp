export const AppRoute = {
  auth: {
    login: '/login',
    signup: '/signup',
    onboarding: '/onboarding',
  },
  parent: {
    dashboard: '/(parent)/dashboard',
    students: '/(parent)/students',
    linkStudent: '/(parent)/students/link',
    studentDetails: (id: string) => `/(parent)/students/${id}` as const,
    studentAttendance: (id: string) => `/(parent)/students/${id}/attendance` as const,
  },
  teacher: {
    dashboard: '/(teacher)/dashboard',
    students: '/(teacher)/students',
    sessions: '/(teacher)/sessions',
  },
  admin: {
    dashboard: '/(admin)/dashboard',
    teachers: '/(admin)/teachers',
    parents: '/(admin)/parents',
  },
  superAdmin: {
    dashboard: '/(super-admin)/dashboard',
    plans: '/(super-admin)/plans',
    admins: '/(super-admin)/admins',
  },
} as const;
