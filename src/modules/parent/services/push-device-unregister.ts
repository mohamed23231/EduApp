import axios from 'axios';
import Env from 'env';
import {
  clearPushDeviceRegistration,
  getPushDeviceRegistration,
} from '@/lib/push-device-registration';

type BestEffortUnregisterOptions = {
  accessToken: string | null;
  tokenId?: string | null;
};

function getApiBaseUrl(): string {
  return Env.EXPO_PUBLIC_API_URL;
}

/**
 * Best-effort push token unregister used during sign-out and explicit device unlink.
 * Always clears local registration to avoid stale client state.
 */
export async function bestEffortUnregisterPushToken({
  accessToken,
  tokenId,
}: BestEffortUnregisterOptions): Promise<void> {
  const registration = getPushDeviceRegistration();
  const resolvedTokenId = tokenId ?? registration?.id ?? null;

  if (!resolvedTokenId || !accessToken) {
    clearPushDeviceRegistration();
    return;
  }

  const url = `${getApiBaseUrl()}/parents/devices/${resolvedTokenId}`;

  try {
    await axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }
  catch (error) {
    if (__DEV__) {
      console.warn('[Push] Failed to unregister device token', error);
    }
  }
  finally {
    clearPushDeviceRegistration();
  }
}
