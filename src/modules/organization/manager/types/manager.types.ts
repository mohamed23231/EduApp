export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export type OrgLimits = {
  maxStudents: number | null;
  maxTeachers: number | null;
  maxSessions: number | null;
  maxSessionMinutes: number | null;
};

export type OrgTrial = {
  startDate: string;
  endDate: string;
  maxStudents: number;
  maxTeachers: number;
  maxSessions: number;
  maxSessionMinutes: number;
};

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  memberRole: 'OWNER' | 'TEACHER';
  currentStudents: number;
  currentTeachers: number;
};

export type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  phoneE164: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  currentStudents: number;
  currentTeachers: number;
  currentSessions: number;
  currentSessionMinutes: number;
  memberRole?: 'OWNER' | 'TEACHER';
  trial?: OrgTrial;
  limits: OrgLimits | null;
  entitlementSource: 'subscription' | 'trial' | 'expired';
  createdAt?: string;
  updatedAt?: string;
};

export type OrgStudent = {
  id: string;
  name: string;
  gradeLevel: string | null;
  parentPhone: string | null;
  connectionCode: string;
  hasParentLinked?: boolean;
  assignedSessionsCount?: number;
  isDeleted?: boolean;
  createdAt?: string;
  parentRelationship?: string | null;
  tone?: string | null;
  isAtRiskManualFlag?: boolean | null;
};

export type OrgStudentDetail = OrgStudent & {
  notes?: string | null;
  assignedSessions?: Array<{
    templateId: string;
    subject: string;
    teacherName: string;
  }>;
};

export type OrgMember = {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  role: 'OWNER' | 'TEACHER';
  joinedAt: string;
  removedAt: string | null;
  activeSessionsCount: number;
};

export type OrgSessionTemplate = {
  id: string;
  organizationId?: string;
  subject: string;
  daysOfWeek: number[];
  time: string;
  durationMinutes: number;
  assignedMember: {
    id: string;
    name: string;
  };
  students?: Array<{
    id: string;
    name: string;
    gradeLevel?: string | null;
  }>;
  studentCount?: number;
  isPaused: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  recentInstances?: OrgSessionInstance[];
};

export type OrgSessionInstance = {
  id: string;
  templateId: string;
  subject: string;
  date: string;
  time: string;
  durationMinutes: number;
  state: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  startedAt?: string | null;
  endedAt?: string | null;
  assignedTeacher: {
    id: string;
    name: string;
  };
  studentCount?: number;
  students?: Array<{
    id: string;
    name: string;
    gradeLevel?: string | null;
  }>;
  attendanceRecords?: OrgAttendanceRecord[];
};

export type OrgAttendanceRecord = {
  id: string;
  studentId: string;
  studentName?: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  excuseNote?: string | null;
  rating?: number | null;
  isSystemGenerated?: boolean;
  note?: string | null;
  noteAuthorName?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
};

export type OrgStatsOverview = {
  period: { from: string; to: string };
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalSessions: number;
  completedSessions: number;
  averageAttendanceRate: number;
  averagePerformanceRating: number;
  absentCount: number;
  excusedCount: number;
  todaySessions: number;
  runningNow: number;
  absentToday: number;
};

export type OrgTeacherStatsItem = {
  memberId: string;
  name: string;
  assignedSessions: number;
  completedSessions: number;
  averageAttendanceRate: number;
  averageRating: number;
  lastSessionDate: string;
};

export type OrgStudentStats = {
  studentId: string;
  name: string;
  period: { from: string; to: string };
  totalSessions: number;
  present: number;
  absent: number;
  excused: number;
  attendanceRate: number;
  averageRating: number;
  ratingTrend: number[];
  ratingDelta: number | null;
  atRiskReason?: {
    isAtRisk: boolean;
    atRiskTriggers: string[];
  } | null;
  subjects: Array<{
    subject: string;
    teacherName: string;
    sessionsAttended: number;
    averageRating: number;
  }>;
};

export type CreateOrganizationInput = {
  name: string;
  phoneE164?: string;
  email?: string;
  address?: string;
};

export type CreateStudentInput = {
  name: string;
  gradeLevel?: string;
  notes?: string;
  parentPhone?: string;
};

export type UpdateStudentInput = Partial<CreateStudentInput> & {
  parentRelationship?: string;
  tone?: string;
  isAtRiskManualFlag?: boolean;
};

export type OrgInvitation = {
  id: string;
  organizationId: string;
  inviteePhone: string | null;
  inviteeEmail: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
};

export type InviteTeacherInput = {
  inviteePhone?: string;
  inviteeEmail?: string;
};

export type CreateSessionInput = {
  subject: string;
  daysOfWeek: number[];
  time: string;
  durationMinutes?: number;
  assignedMemberId: string;
  studentIds?: string[];
};

export type MarkAttendanceInput = {
  records: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    excuseNote?: string;
    rating?: number;
  }>;
};
