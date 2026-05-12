/**
 * useOffline — 네트워크 상태 감지 훅
 * @react-native-community/netinfo + TanStack Query onlineManager 연동
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useSyncExternalStore } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { BackgroundTaskService } from '../services/BackgroundTaskService';
import { OfflineQueueService } from '../services/OfflineQueueService';

let currentState: NetInfoState | null = null;
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);

  if (listeners.size === 1) {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = currentState !== null && !currentState.isConnected;
      currentState = state;
      const isOnline = state.isConnected ?? false;

      onlineManager.setOnline(isOnline);

      if (wasOffline && isOnline) {
        handleReconnect();
      }

      listeners.forEach((cb) => cb());
    });

    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        unsubscribe();
      }
    };
  }

  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  if (currentState === null) return true;
  return !(currentState.isConnected ?? true);
}

function getServerSnapshot(): boolean {
  return false;
}

async function handleReconnect(): Promise<void> {
  try {
    await OfflineQueueService.processQueue();
    await BackgroundTaskService.runManualSync();
  } catch {
    // 에러 시 다음 reconnect에서 재시도
  }
}

export interface OfflineState {
  isOffline: boolean;
  isOnline: boolean;
}

/**
 * 네트워크 오프라인 상태를 감지하고 TanStack Query onlineManager와 동기화
 */
export function useOffline(): OfflineState {
  const isOffline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return {
    isOffline,
    isOnline: !isOffline,
  };
}

/**
 * onlineManager 이벤트 리스너 설정 (루트 레이아웃에서 한 번 호출)
 */
export function setupOnlineManager(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected ?? true;
    onlineManager.setOnline(isOnline);
  });

  return unsubscribe;
}
