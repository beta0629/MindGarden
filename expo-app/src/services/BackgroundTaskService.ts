/**
 * BackgroundTaskService — 백그라운드 작업 관리
 * expo-background-fetch + expo-task-manager 기반
 *
 * - FCM 토큰 주기적 갱신 (24시간)
 * - 오프라인 큐 처리 (네트워크 복구 시)
 * - 오래된 캐시 정리
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import NetInfo from '@react-native-community/netinfo';
import { NotificationService } from './NotificationService';
import { OfflineQueueService } from './OfflineQueueService';

const BACKGROUND_TASK_NAME = 'MINDGARDEN_BACKGROUND_SYNC';
const TOKEN_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const TOKEN_LAST_REFRESH_KEY = 'bg_last_token_refresh';

let lastTokenRefreshMs = 0;

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected ?? false;

    if (isConnected) {
      await processOfflineQueue();
      await refreshTokenIfNeeded();
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function refreshTokenIfNeeded(): Promise<void> {
  const now = Date.now();
  if (now - lastTokenRefreshMs < TOKEN_REFRESH_INTERVAL_MS) return;

  const success = await NotificationService.registerToken();
  if (success) {
    lastTokenRefreshMs = now;
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
   * 백그라운드 태스크 등록
   * 앱 시작 시 한 번 호출
   */
  async register(): Promise<void> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      if (
        status === BackgroundFetch.BackgroundFetchStatus.Denied ||
        status === BackgroundFetch.BackgroundFetchStatus.Restricted
      ) {
        return;
      }

      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_TASK_NAME,
      );

      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    } catch {
      // 시뮬레이터 등 지원 불가 환경에서 무시
    }
  },

  /**
   * 백그라운드 태스크 해제
   * 로그아웃 시 호출
   */
  async unregister(): Promise<void> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        BACKGROUND_TASK_NAME,
      );
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
    if (!netState.isConnected) return;

    await processOfflineQueue();
    await refreshTokenIfNeeded();
  },
};
