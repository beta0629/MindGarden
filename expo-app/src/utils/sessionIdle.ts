/**
 * 클라이언트 유휴(idle) 만료 판정 — 웹 HTTP 세션 4h 정책과 동일 숫자.
 * JWT/쿠키 원문은 다루지 않는다.
 *
 * @author MindGarden
 * @since 2026-08-05
 */
import {
  SESSION_IDLE_ACTIVITY_THROTTLE_MS,
  SESSION_IDLE_MAX_MS,
} from '@/constants/session';

/**
 * 마지막 활동 시각 기준 유휴 만료 여부.
 *
 * @param lastActivityAtMs 마지막 사용자 활동 epoch ms
 * @param nowMs 현재 epoch ms
 * @param idleMaxMs 유휴 허용 최대(기본 SESSION_IDLE_MAX_MS = 4h)
 */
export function isSessionIdleExpired(
  lastActivityAtMs: number,
  nowMs: number,
  idleMaxMs: number = SESSION_IDLE_MAX_MS,
): boolean {
  if (!Number.isFinite(lastActivityAtMs) || lastActivityAtMs <= 0) {
    return false;
  }
  if (!Number.isFinite(nowMs) || !Number.isFinite(idleMaxMs) || idleMaxMs <= 0) {
    return false;
  }
  return nowMs - lastActivityAtMs >= idleMaxMs;
}

/**
 * 활동 기록 스로틀 — true 이면 lastActivity 갱신해도 된다.
 *
 * @param lastRecordedAtMs 직 기록된 활동 epoch ms
 * @param nowMs 현재 epoch ms
 * @param throttleMs 스로틀 간격
 */
export function shouldRecordIdleActivity(
  lastRecordedAtMs: number,
  nowMs: number,
  throttleMs: number = SESSION_IDLE_ACTIVITY_THROTTLE_MS,
): boolean {
  if (!Number.isFinite(nowMs)) {
    return false;
  }
  if (!Number.isFinite(lastRecordedAtMs) || lastRecordedAtMs <= 0) {
    return true;
  }
  return nowMs - lastRecordedAtMs >= throttleMs;
}

export type SessionIdleSignOutDecision = 'sign_out' | 'continue';

/**
 * 로그인 상태에서 유휴 초과 시 sign_out 결정(훅/타이머 공통).
 *
 * @param params.isAuthenticated 인증 여부
 * @param params.lastActivityAtMs 마지막 활동
 * @param params.nowMs 현재 시각
 * @param params.idleMaxMs 유휴 최대(기본 4h)
 */
export function evaluateSessionIdleSignOut(params: {
  isAuthenticated: boolean;
  lastActivityAtMs: number;
  nowMs: number;
  idleMaxMs?: number;
}): SessionIdleSignOutDecision {
  if (!params.isAuthenticated) {
    return 'continue';
  }
  if (
    isSessionIdleExpired(
      params.lastActivityAtMs,
      params.nowMs,
      params.idleMaxMs ?? SESSION_IDLE_MAX_MS,
    )
  ) {
    return 'sign_out';
  }
  return 'continue';
}
