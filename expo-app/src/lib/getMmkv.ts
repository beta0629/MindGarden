/**
 * Expo Go에서는 `react-native-mmkv`(Nitro)를 사용할 수 없다.
 * Dev Client / prebuild에서는 MMKV, Expo Go에서는 프로세스 메모리 폴백.
 *
 * @see https://docs.expo.dev/develop/development-builds/introduction/
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { createJSONStorage } from 'zustand/middleware';

/** Expo Go(스토어 클라이언트) — MMKV·Auth UI 등에서 공통 사용 */
export function isExpoGoApp(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

export type MmkvLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: boolean | string | number) => void;
  remove: (key: string) => void;
  getNumber: (key: string) => number | undefined;
};

class MemoryMmkv implements MmkvLike {
  private readonly map = new Map<string, boolean | string | number>();

  getString(key: string): string | undefined {
    const v = this.map.get(key);
    return typeof v === 'string' ? v : undefined;
  }

  getNumber(key: string): number | undefined {
    const v = this.map.get(key);
    return typeof v === 'number' ? v : undefined;
  }

  set(key: string, value: boolean | string | number): void {
    this.map.set(key, value);
  }

  remove(key: string): void {
    this.map.delete(key);
  }
}

const memoryById = new Map<string, MemoryMmkv>();

function getMemoryMmkv(id: string): MemoryMmkv {
  let m = memoryById.get(id);
  if (!m) {
    m = new MemoryMmkv();
    memoryById.set(id, m);
  }
  return m;
}

/** Nitro 없이 동작해야 할 때(Expo Go) 메모리 구현 */
export function getMmkv(id: string): MmkvLike {
  if (isExpoGoApp()) {
    return getMemoryMmkv(id);
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Expo Go에서 네이티브 모듈 로드 방지
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  return createMMKV({ id });
}

/** zustand `persist` + `createJSONStorage`용 */
export function createZustandMmkvPersistStorage(instanceId: string) {
  return createJSONStorage(() => {
    const mmkv = getMmkv(instanceId);
    return {
      getItem: (name: string) => mmkv.getString(name) ?? null,
      setItem: (name: string, value: string) => {
        mmkv.set(name, value);
      },
      removeItem: (name: string) => {
        mmkv.remove(name);
      },
    };
  });
}
