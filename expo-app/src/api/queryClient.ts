/**
 * TanStack Query 클라이언트 + MMKV 캐시 영속화(화이트리스트 dehydrate)
 * 앱 재시작 시 캐시 복원, gcTime 7일, staleTime 5분
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createMMKV } from 'react-native-mmkv';
import { isOfflinePersistedQueryKey, shouldDehydrateOfflinePersistedQuery } from './offlinePersistPolicy';

const CACHE_GC_TIME = 1000 * 60 * 60 * 24 * 7;
const CACHE_STALE_TIME = 1000 * 60 * 5;

/** 비활성 쿼리만 제거(옵저버 0). gcTime(7일)보다 길게 두어 과도한 삭제 방지 */
const PRUNE_INACTIVE_DATA_MIN_AGE_MS = 1000 * 60 * 60 * 24 * 10;

const mmkv = createMMKV({ id: 'query-cache' });

/** PersistQueryClient `maxAge` — gcTime과 동일 계열 */
export const QUERY_PERSIST_MAX_AGE_MS = CACHE_GC_TIME;

export const queryPersistDehydrateOptions = {
  shouldDehydrateQuery: shouldDehydrateOfflinePersistedQuery,
};

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

/**
 * 오래되고 현재 구독자 없는 쿼리 엔트리만 제거(메모리·다음 persist 부담 완화).
 * 활성 화면 쿼리는 건드리지 않음.
 *
 * @returns 제거된 쿼리 개수
 */
export function pruneInactivePersistedQueries(): number {
  const now = Date.now();
  let removed = 0;
  const queries = queryClient.getQueryCache().getAll();
  for (const q of queries) {
    if (q.getObserversCount() > 0) continue;
    if (!isOfflinePersistedQueryKey(q.queryKey)) continue;
    const updated = q.state.dataUpdatedAt;
    if (updated <= 0) continue;
    if (now - updated < PRUNE_INACTIVE_DATA_MIN_AGE_MS) continue;
    queryClient.removeQueries({ queryKey: q.queryKey, exact: true });
    removed++;
  }
  return removed;
}
