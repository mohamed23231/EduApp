import { NavigationContext } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { useUniwind } from 'uniwind';

type Props = { hidden?: boolean };
export function FocusAwareStatusBar({ hidden = false }: Props) {
  const navigation = React.use(NavigationContext);
  const isFocused = React.useSyncExternalStore(
    React.useCallback((onStoreChange) => {
      if (!navigation)
        return () => {};

      const unsubscribeFocus = navigation.addListener('focus', onStoreChange);
      const unsubscribeBlur = navigation.addListener('blur', onStoreChange);

      return () => {
        unsubscribeFocus();
        unsubscribeBlur();
      };
    }, [navigation]),
    React.useCallback(() => navigation?.isFocused() ?? true, [navigation]),
    () => true,
  );
  const { theme } = useUniwind();

  if (Platform.OS === 'web')
    return null;

  return isFocused
    ? (
        <SystemBars
          style={theme === 'light' ? 'dark' : 'light'}
          hidden={hidden}
        />
      )
    : null;
}
