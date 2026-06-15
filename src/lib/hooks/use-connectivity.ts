import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Tracks device connectivity via NetInfo. `isOffline` is true only when the
 * device is explicitly disconnected (`isConnected === false`); the
 * indeterminate initial `null` is treated as online so the banner never flashes
 * on a cold start before the first connectivity event resolves.
 */
export function useConnectivity(): { isOffline: boolean } {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  return { isOffline };
}
