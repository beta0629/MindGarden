/**
 * useOffline — NetInfo + TanStack Query onlineManager + 재연결 동기화
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useSyncExternalStore } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { queryClient } from '../api/queryClient';
import { isOfflinePersistedQueryKey } from '../api/offlinePersistPolicy';
import { BackgroundTaskService } from '../services/BackgroundTaskService';
import { OfflineQueueService } from '../services/OfflineQueueService';

/** Wi‑Fi 연결만 있고 실제 인터넷 없음 등 — `isInternetReachable === false`면 오프라인 취급 */
function isOfflineFromNetState(state: NetInfoState): boolean {
  const connected = state.isConnected ?? false;
  if (!connected) {
    return true;
  }
  if (state.isInternetReachable === false) {
    return true;
  }
  return false;
}

let netInfoSubscription: (() => void) | null = null;
let currentState: NetInfoState | null = null;
/** 직전 이벤트까지 오프라인이었는지(복구 감지용) */
let lastIsOffline = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((cb) => cb());
}

async function onNetworkRestored(): Promise<void> {
  try {
    await OfflineQueueService.processQueue();
    await BackgroundTaskService.runManualSync();
    await queryClient.invalidateQueries({
      predicate: (q) => isOfflinePersistedQueryKey(q.queryKey),
    });
  } catch {
    // 다음 복구 시 재시도
  }
}

function attachNetInfoListener(): void {
  if (netInfoSubscription != null) {
    return;
  }
  netInfoSubscription = NetInfo.addEventListener((state) => {
    const offline = isOfflineFromNetState(state);
    const isOnline = !offline;

    onlineManager.setOnline(isOnline);

    if (lastIsOffline && !offline) {
      void onNetworkRestored();
    }
    lastIsOffline = offline;
    currentState = state;

    emit();
  });

  void NetInfo.fetch().then((state) => {
    currentState = state;
    const offline = isOfflineFromNetState(state);
    lastIsOffline = offline;
    onlineManager.setOnline(!offline);
    emit();
  });
}

function subscribe(callback: () => void): () => void {
  attachNetInfoListener();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): boolean {
  if (currentState === null) return false;
  return isOfflineFromNetState(currentState);
}

function getServerSnapshot(): boolean {
  return false;
}

export interface OfflineState {
  isOffline: boolean;
  isOnline: boolean;
}

/**
 * 오프라인 여부 (UI 배너 등)
 */
export function useOffline(): OfflineState {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    isOffline,
    isOnline: !isOffline,
  };
}

/**
 * 루트에서 1회 호출: NetInfo 구독 + onlineManager + 재연결 시 큐/쿼리 갱신
 */
export function setupOfflineNetworking(): () => void {
  attachNetInfoListener();
  return () => {
    // 앱 종료까지 유지(이중 구독 방지). 필요 시 netInfoSubscription?.() 확장 가능.
  };
}
