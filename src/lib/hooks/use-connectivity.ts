import { useNetInfo } from '@react-native-community/netinfo';

/**
 * Tracks device connectivity via NetInfo. `isOffline` is true only when the
 * device is explicitly disconnected (`isConnected === false`); the
 * indeterminate initial `null` is treated as online so the banner never flashes
 * on a cold start before the first connectivity event resolves.
 */
export function useConnectivity(): { isOffline: boolean } {
  const { isConnected } = useNetInfo();
  return { isOffline: isConnected === false };
}
