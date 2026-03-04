import { getItem, removeItem, setItem } from '@/lib/storage';

export const PUSH_DEVICE_REGISTRATION_KEY = 'push_device_registration';
export const PUSH_DEVICE_REFRESH_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export type PushDeviceRegistration = {
  id: string;
  token: string;
  parentId?: string;
  registeredAt: number;
};

export function getPushDeviceRegistration(): PushDeviceRegistration | null {
  const raw = getItem<PushDeviceRegistration | {
    id: string;
    token: string;
    registeredAt?: number;
  }>(PUSH_DEVICE_REGISTRATION_KEY);

  if (!raw || typeof raw.id !== 'string' || typeof raw.token !== 'string') {
    return null;
  }

  return {
    id: raw.id,
    token: raw.token,
    parentId: typeof (raw as PushDeviceRegistration).parentId === 'string'
      ? (raw as PushDeviceRegistration).parentId
      : undefined,
    registeredAt:
      typeof raw.registeredAt === 'number' ? raw.registeredAt : 0,
  };
}

export function setPushDeviceRegistration(
  registration: Omit<PushDeviceRegistration, 'registeredAt'>
    & Partial<Pick<PushDeviceRegistration, 'registeredAt'>>,
): void {
  void setItem<PushDeviceRegistration>(PUSH_DEVICE_REGISTRATION_KEY, {
    ...registration,
    registeredAt: registration.registeredAt ?? Date.now(),
  });
}

export function clearPushDeviceRegistration(): void {
  void removeItem(PUSH_DEVICE_REGISTRATION_KEY);
}
