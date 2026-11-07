/**
 * expo-secure-store 웹 폴백.
 * Expo web 에서 native ExpoSecureStore 모듈이 비면 getValueWithKeyAsync 가 깨지므로
 * web 은 localStorage(또는 메모리)로 동일 API 를 제공한다.
 *
 * @author MindGarden
 * @since 2026-11-07
 */
import { Platform } from 'react-native';
import * as ExpoSecureStore from 'expo-secure-store';

const memory = new Map<string, string>();

function webGet(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(`mg_ss:${key}`);
    }
  } catch {
    /* private mode */
  }
  return memory.has(key) ? memory.get(key)! : null;
}

function webSet(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`mg_ss:${key}`, value);
      return;
    }
  } catch {
    /* private mode */
  }
  memory.set(key, value);
}

function webDelete(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`mg_ss:${key}`);
    }
  } catch {
    /* ignore */
  }
  memory.delete(key);
}

function canUseNativeSecureStore(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }
  const mod = ExpoSecureStore as unknown as {
    getItemAsync?: unknown;
    default?: { getValueWithKeyAsync?: unknown };
  };
  return typeof mod.getItemAsync === 'function';
}

export async function secureGetItem(key: string): Promise<string | null> {
  if (!canUseNativeSecureStore()) {
    return webGet(key);
  }
  return ExpoSecureStore.getItemAsync(key);
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  if (!canUseNativeSecureStore()) {
    webSet(key, value);
    return;
  }
  await ExpoSecureStore.setItemAsync(key, value);
}

export async function secureDeleteItem(key: string): Promise<void> {
  if (!canUseNativeSecureStore()) {
    webDelete(key);
    return;
  }
  await ExpoSecureStore.deleteItemAsync(key);
}
