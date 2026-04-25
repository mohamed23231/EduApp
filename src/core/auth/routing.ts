import { AppRoute } from '@/core/navigation/routes';
import { UserRole } from './roles';

export function getHomeRouteForRole(role: UserRole, isOnboarding = false) {
  switch (role) {
    case UserRole.ADMIN:
      return AppRoute.admin.dashboard;
    case UserRole.MANAGER:
      return isOnboarding ? AppRoute.manager.setup : AppRoute.manager.dashboard;
    case UserRole.SUPER_ADMIN:
      return AppRoute.superAdmin.dashboard;
    case UserRole.PARENT:
      return AppRoute.parent.dashboard;
    case UserRole.TEACHER:
    default:
      return AppRoute.teacher.dashboard;
  }
}
