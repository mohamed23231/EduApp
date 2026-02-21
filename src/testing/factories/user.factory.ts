import { UserRole } from '@/core/auth/roles';

type UserFactoryInput = {
  id?: string;
  email?: string;
  role?: UserRole;
};

export function createUserFactory(input: UserFactoryInput = {}) {
  return {
    id: input.id ?? 'user-1',
    email: input.email ?? 'user@privatedu.com',
    role: input.role ?? UserRole.PARENT,
  };
}
