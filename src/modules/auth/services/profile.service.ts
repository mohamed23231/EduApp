/**
 * Profile creation API service (used during onboarding)
 */

import { client } from '@/lib/api/client';

type CreateProfileInput = {
  name: string;
  phone?: string;
};

/**
 * Creates a role-specific profile during onboarding.
 * @param role - 'TEACHER' | 'PARENT'
 */
export async function createProfile(role: string, data: CreateProfileInput): Promise<void> {
  const endpoint = `/${role.toLowerCase()}s/profile`;
  await client.post(endpoint, {
    name: data.name,
    phone: data.phone || undefined,
  });
}
