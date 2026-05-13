/**
 * 정원 성장 이벤트 로컬 큐 — 오프라인 재전송·서버 동기화는 별도 Task(`OfflineQueueService` 등)에서 연계.
 *
 * @author MindGarden
 * @since 2026-05-13
 */

import type { GardenGrowthEventType } from '@/constants/mindGardenGrowth';

export interface GardenGrowthQueuedEventPayload {
  readonly eventType: GardenGrowthEventType;
  readonly sourceId?: string;
  readonly occurredAt: string;
}

export interface GardenGrowthLocalEventQueue {
  /**
   * 서버 전송 대기 이벤트 적재 (미구현 시 noop)
   *
   * @param payload 이벤트 본문
   */
  enqueue(payload: GardenGrowthQueuedEventPayload): void;
}

/**
 * 현재는 적재만 인터페이스로 고정. 구현체는 푸시/오프라인 배치에서 `OfflineQueueService`와 합류 예정.
 */
export const gardenGrowthLocalEventQueueStub: GardenGrowthLocalEventQueue = {
  enqueue(_payload: GardenGrowthQueuedEventPayload): void {
    /* TODO: 푸시/오프라인 Task — MMKV 큐 저장 + 복구 시 `GARDEN_API` POST 순차 전송 */
  },
};
