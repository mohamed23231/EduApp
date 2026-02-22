import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

export function getItem<T>(key: string): T | null {
  const value = storage.getString(key);
  if (!value)
    return null;

  try {
    return JSON.parse(value) as T;
  }
  catch (error) {
    // Corrupted persisted values must never break app startup hydration.
    console.warn(`[storage] Failed to parse key "${key}", clearing it.`, error);
    storage.remove(key);
    return null;
  }
}

export async function setItem<T>(key: string, value: T) {
  storage.set(key, JSON.stringify(value));
}

export async function removeItem(key: string) {
  storage.remove(key);
}
