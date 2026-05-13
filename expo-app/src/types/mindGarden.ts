/**
 * 「마음 정원」서버 권위 상태 (백엔드 `GET/PUT` 예정 스키마 스텁)
 *
 * @author MindGarden
 * @since 2026-05-13
 */

export interface MindGardenServerState {
  /** 낙관적 동기화·충돌 감지용 단조 증가 리비전 */
  readonly revision: number;
  /** 서버가 계산한 단계 (클라이언트 표시용 보조, 최종 병합 시 서버 우선) */
  readonly stageIndex: number;
  /** 누적 성장점 */
  readonly totalPoints: number;
  /** 서버 집계 주간 누적 (주 키는 서버 정책에 따름) */
  readonly weeklyPointsCredited: number;
  readonly weekKey: string;
  /** 수집·해금 요소 ID 목록 */
  readonly unlockedElementIds: readonly string[];
  readonly lastSyncedAt: string | null;
}
