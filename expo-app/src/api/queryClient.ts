/**
 * TanStack Query 클라이언트 + MMKV 캐시 영속화
 * 앱 재시작 시 캐시 복원, gcTime 7일, staleTime 5분
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createMMKV } from 'react-native-mmkv';

const CACHE_GC_TIME = 1000 * 60 * 60 * 24 * 7;
const CACHE_STALE_TIME = 1000 * 60 * 5;

const mmkv = createMMKV({ id: 'query-cache' });

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: CACHE_STALE_TIME,
      gcTime: CACHE_GC_TIME,
    },
    mutations: {
      retry: 1,
    },
  },
});

export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => {
      const value = mmkv.getString(key);
      return value ?? null;
    },
    setItem: (key: string, value: string) => {
      mmkv.set(key, value);
    },
    removeItem: (key: string) => {
      mmkv.remove(key);
    },
  },
  key: 'mg-query-cache',
  throttleTime: 2000,
});
