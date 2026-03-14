export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
}

export function isAdminSurfaceRole(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}
