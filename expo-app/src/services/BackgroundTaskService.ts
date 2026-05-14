/**
 * BackgroundTaskService — 백그라운드 작업 관리
 *
 * **Expo SDK 54**: `expo-background-fetch` + `expo-task-manager`만 사용한다.
 * 기획서의 `expo-background-task`(SDK 53 시점 언급)와 이중 의존하지 않으며,
 * 동일 역할을 네이티브 두 벌로 유지할 이유가 없을 때까지 본 스택을 유지한다.
 *
 * **iOS**: Background Fetch 실행 시점·간격은 시스템이 정하며 앱이 지정한 최소 간격을 보장하지 않는다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import { getMmkv } from '@/lib/getMmkv';
import { pruneInactivePersistedQueries } from '../api/queryClient';
import { NotificationService } from './NotificationService';
import { OfflineQueueService } from './OfflineQueueService';

const BACKGROUND_TASK_NAME = 'MINDGARDEN_BACKGROUND_SYNC';
const TOKEN_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TOKEN_REFRESH_LOCK_MS = 2 * 60 * 1000;
const CACHE_PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

const mmkv = getMmkv('background-task');
const TOKEN_LAST_REFRESH_KEY = 'bg_last_token_refresh';
const TOKEN_LOCK_UNTIL_KEY = 'bg_token_refresh_lock_until';
const CACHE_LAST_PRUNE_KEY = 'bg_last_cache_prune';

let registerSingleton: Promise<void> | null = null;

function readLastTokenRefreshMs(): number {
  return mmkv.getNumber(TOKEN_LAST_REFRESH_KEY) ?? 0;
}

function writeLastTokenRefreshMs(ts: number): void {
  mmkv.set(TOKEN_LAST_REFRESH_KEY, ts);
}

function tryAcquireTokenRefreshLock(): boolean {
  const until = mmkv.getNumber(TOKEN_LOCK_UNTIL_KEY) ?? 0;
  const now = Date.now();
  if (now < until) {
    return false;
  }
  mmkv.set(TOKEN_LOCK_UNTIL_KEY, now + TOKEN_REFRESH_LOCK_MS);
  return true;
}

function releaseTokenRefreshLock(): void {
  mmkv.set(TOKEN_LOCK_UNTIL_KEY, 0);
}

function shouldRunCachePrune(): boolean {
  const last = mmkv.getNumber(CACHE_LAST_PRUNE_KEY) ?? 0;
  return Date.now() - last >= CACHE_PRUNE_INTERVAL_MS;
}

function markCachePruneDone(): void {
  mmkv.set(CACHE_LAST_PRUNE_KEY, Date.now());
}

/** `useOffline`과 동일 기준 — 캡티브 포털 등 `isInternetReachable === false`면 작업 스킵 */
function hasUsableInternet(state: Awaited<ReturnType<typeof NetInfo.fetch>>): boolean {
  const connected = state.isConnected ?? false;
  if (!connected) {
    return false;
  }
  if (state.isInternetReachable === false) {
    return false;
  }
  return true;
}

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const netState = await NetInfo.fetch();

    if (hasUsableInternet(netState)) {
      OfflineQueueService.pruneStaleEntries();
      await processOfflineQueue();
      await refreshTokenIfNeeded();
      if (shouldRunCachePrune()) {
        pruneInactivePersistedQueries();
        markCachePruneDone();
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.warn('[MindGarden][BackgroundSync] task error', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function refreshTokenIfNeeded(): Promise<void> {
  const now = Date.now();
  const lastMs = readLastTokenRefreshMs();
  if (lastMs > 0 && now - lastMs < TOKEN_REFRESH_INTERVAL_MS) {
    return;
  }

  if (!tryAcquireTokenRefreshLock()) {
    return;
  }

  try {
    const success = await NotificationService.registerToken();
    if (success) {
      writeLastTokenRefreshMs(now);
    }
  } finally {
    releaseTokenRefreshLock();
  }
}

async function processOfflineQueue(): Promise<void> {
  const pending = OfflineQueueService.getPendingCount();
  if (pending > 0) {
    await OfflineQueueService.processQueue();
  }
}

export const BackgroundTaskService = {
  /**
   * 백그라운드 태스크 OS 등록. `app/_layout.tsx`에서 fonts `loaded` 후 한 경로로만 호출.
   */
  async register(): Promise<void> {
    registerSingleton ??= (async () => {
      try {
        const status = await BackgroundFetch.getStatusAsync();
        if (
          status === BackgroundFetch.BackgroundFetchStatus.Denied ||
          status === BackgroundFetch.BackgroundFetchStatus.Restricted
        ) {
          return;
        }

        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);

        if (!isRegistered) {
          await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
            minimumInterval: 15 * 60,
            stopOnTerminate: false,
            startOnBoot: true,
          });
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[MindGarden][BackgroundSync] register skipped', err);
        }
      }
    })().finally(() => {
      registerSingleton = null;
    });

    await registerSingleton;
  },

  /**
   * 백그라운드 태스크 해제
   * 로그아웃 시 호출
   */
  async unregister(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      }
    } catch {
      // 무시
    }
  },

  /**
   * 수동 실행 (포그라운드에서 네트워크 복구 시)
   */
  async runManualSync(): Promise<void> {
    const netState = await NetInfo.fetch();
    if (!hasUsableInternet(netState)) return;

    OfflineQueueService.pruneStaleEntries();
    await processOfflineQueue();
    await refreshTokenIfNeeded();
    if (shouldRunCachePrune()) {
      pruneInactivePersistedQueries();
      markCachePruneDone();
    }
  },
};
