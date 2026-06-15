import * as React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/components/ui/colors';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { Z_INDEX } from '@/components/ui/theme';
import { useConnectivity } from '@/lib/hooks';

/**
 * Root-mounted connectivity indicator. Subscribes to NetInfo via
 * useConnectivity() and overlays the OfflineBanner at the very top of the app —
 * extended under the notch via the top safe-area inset — whenever the device is
 * offline. Mounted once in app/_layout.tsx alongside the root ToastHost.
 */
export function ConnectivityBanner() {
  const { isOffline } = useConnectivity();
  const insets = useSafeAreaInsets();

  if (!isOffline)
    return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        start: 0,
        end: 0,
        paddingTop: insets.top,
        backgroundColor: colors.semantic.excused,
        zIndex: Z_INDEX.offlineBanner,
      }}
    >
      <OfflineBanner visible />
    </View>
  );
}
