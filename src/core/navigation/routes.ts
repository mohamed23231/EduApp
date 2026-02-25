export const AppRoute = {
  auth: {
    login: '/login',
    signup: '/signup',
    onboarding: '/onboarding',
  },
  parent: {
    dashboard: '/(parent)/(tabs)/dashboard',
    profile: '/(parent)/(tabs)/profile',
    students: '/(parent)/students',
    linkStudent: '/(parent)/students/link',
    studentDetails: (id: string) => `/(parent)/students/${id}` as const,
    studentAttendance: (id: string) => `/(parent)/students/${id}/attendance` as const,
    notifications: '/(parent)/notifications',
  },
  teacher: {
    dashboard: '/(teacher)/(tabs)/dashboard',
    students: '/(teacher)/(tabs)/students',
    sessions: '/(teacher)/(tabs)/sessions',
    profile: '/(teacher)/(tabs)/profile',
    studentCreate: '/(teacher)/students/create',
    studentEdit: (id: string) => `/(teacher)/students/${id}/edit` as const,
    connectionCode: (id: string) => `/(teacher)/students/${id}/connection-code` as const,
    sessionCreate: '/(teacher)/sessions/create',
    sessionEdit: (id: string) => `/(teacher)/sessions/${id}/edit` as const,
    attendance: (instanceId: string) => `/(teacher)/attendance/${instanceId}` as const,
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
