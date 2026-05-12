/**
 * OfflineQueueService — 오프라인 뮤테이션 큐
 * MMKV에 실패한 mutation을 저장하고 네트워크 복구 시 순차 실행
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { createMMKV } from 'react-native-mmkv';
import { apiPost, apiPut, apiDelete } from '../api/client';

const mmkv = createMMKV({ id: 'offline-queue' });
const QUEUE_KEY = 'pending_mutations';
const MAX_RETRIES = 3;

export type HttpMethod = 'POST' | 'PUT' | 'DELETE';

export interface QueuedMutation {
  id: string;
  method: HttpMethod;
  endpoint: string;
  data?: unknown;
  retryCount: number;
  createdAt: string;
}

interface QueueState {
  isSyncing: boolean;
  pendingCount: number;
}

let queueState: QueueState = { isSyncing: false, pendingCount: 0 };
const listeners = new Set<(state: QueueState) => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb({ ...queueState }));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readQueue(): QueuedMutation[] {
  const raw = mmkv.getString(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedMutation[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedMutation[]): void {
  mmkv.set(QUEUE_KEY, JSON.stringify(queue));
  queueState = { ...queueState, pendingCount: queue.length };
  notifyListeners();
}

async function executeMutation(mutation: QueuedMutation): Promise<boolean> {
  try {
    switch (mutation.method) {
      case 'POST':
        await apiPost(mutation.endpoint, mutation.data);
        break;
      case 'PUT':
        await apiPut(mutation.endpoint, mutation.data);
        break;
      case 'DELETE':
        await apiDelete(mutation.endpoint);
        break;
    }
    return true;
  } catch {
    return false;
  }
}

export const OfflineQueueService = {
  /**
   * 뮤테이션을 큐에 추가
   */
  enqueue(method: HttpMethod, endpoint: string, data?: unknown): string {
    const id = generateId();
    const mutation: QueuedMutation = {
      id,
      method,
      endpoint,
      data,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
    const queue = readQueue();
    queue.push(mutation);
    writeQueue(queue);
    return id;
  },

  /**
   * 큐의 모든 뮤테이션 순차 실행
   * 네트워크 복구 시 호출
   */
  async processQueue(): Promise<{ succeeded: number; failed: number }> {
    if (queueState.isSyncing) return { succeeded: 0, failed: 0 };

    queueState = { ...queueState, isSyncing: true };
    notifyListeners();

    const queue = readQueue();
    if (queue.length === 0) {
      queueState = { isSyncing: false, pendingCount: 0 };
      notifyListeners();
      return { succeeded: 0, failed: 0 };
    }

    let succeeded = 0;
    let failed = 0;
    const remaining: QueuedMutation[] = [];

    for (const mutation of queue) {
      const ok = await executeMutation(mutation);
      if (ok) {
        succeeded++;
      } else {
        const nextRetry = mutation.retryCount + 1;
        if (nextRetry < MAX_RETRIES) {
          remaining.push({ ...mutation, retryCount: nextRetry });
        } else {
          failed++;
        }
      }
    }

    writeQueue(remaining);
    queueState = { isSyncing: false, pendingCount: remaining.length };
    notifyListeners();

    return { succeeded, failed };
  },

  /**
   * 큐 상태 구독
   */
  subscribe(callback: (state: QueueState) => void): () => void {
    listeners.add(callback);
    callback({ ...queueState });
    return () => {
      listeners.delete(callback);
    };
  },

  /**
   * 현재 큐 상태 조회
   */
  getState(): QueueState {
    return { ...queueState };
  },

  /**
   * 대기 중인 뮤테이션 개수
   */
  getPendingCount(): number {
    return readQueue().length;
  },

  /**
   * 큐 초기화
   */
  clear(): void {
    writeQueue([]);
  },
};
