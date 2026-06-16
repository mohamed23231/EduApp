import { useMMKVBoolean } from 'react-native-mmkv';

import { storage } from '../storage';

const IS_FIRST_TIME = 'IS_FIRST_TIME';

export function useIsFirstTime() {
  const [isFirstTime, setIsFirstTime] = useMMKVBoolean(IS_FIRST_TIME, storage);
  // Deliberate: when the key is absent (undefined), default to `true` WITHOUT
  // writing to MMKV. The first-time flag is only persisted once the caller
  // explicitly flips it (e.g. after onboarding), so an interrupted first launch
  // is still treated as first-time on the next start.
  if (isFirstTime === undefined) {
    return [true, setIsFirstTime] as const;
  }
  return [isFirstTime, setIsFirstTime] as const;
}
