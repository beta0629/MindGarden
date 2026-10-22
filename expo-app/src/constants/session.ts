/**
 * Expo 세션/유휴(idle) 상수 — 웹 `frontend/src/constants/session.js`·
 * BE `SessionConstants` / `SessionTimeoutProperties` 역할별 TTL과 정합.
 *
 * @author MindGarden
 * @since 2026-08-05
 */

/**
 * HTTP 세션 비활성 만료(초) — ADMIN/컨테이너 폴백 4h.
 * SSOT: env `HTTP_SESSION_MAX_INACTIVE` / `server.servlet.session.timeout` 기본 4h = 14400s.
 */
export const HTTP_SESSION_MAX_INACTIVE_SECONDS = 4 * 60 * 60; // 14400

/**
 * 역할별 HTTP 세션 유휴 TTL(초) — BE SessionConstants 와 동일.
 */
export const SESSION_TIMEOUT_SECONDS_BY_ROLE = Object.freeze({
  CLIENT: 1 * 60 * 60, // 3600
  CONSULTANT: 2 * 60 * 60, // 7200
  ADMIN: 4 * 60 * 60, // 14400
  STAFF: 4 * 60 * 60 // 14400
});

/**
 * 클라이언트 유휴 만료(밀리초). 웹 `SESSION_DURATION`(ADMIN 폴백)과 동일(14400000ms).
 */
export const SESSION_IDLE_MAX_MS = HTTP_SESSION_MAX_INACTIVE_SECONDS * 1000;

/**
 * 역할별 유휴 만료(밀리초).
 */
export const SESSION_IDLE_MAX_MS_BY_ROLE = Object.freeze({
  CLIENT: SESSION_TIMEOUT_SECONDS_BY_ROLE.CLIENT * 1000,
  CONSULTANT: SESSION_TIMEOUT_SECONDS_BY_ROLE.CONSULTANT * 1000,
  ADMIN: SESSION_TIMEOUT_SECONDS_BY_ROLE.ADMIN * 1000,
  STAFF: SESSION_TIMEOUT_SECONDS_BY_ROLE.STAFF * 1000
});

/**
 * 역할별 세션 유휴 폴백(ms). 빈/알 수 없는 역할은 ADMIN 폴백.
 *
 * @param role 역할 문자열
 * @returns 밀리초
 */
export function getSessionIdleMaxMsForRole(role?: string | null): number {
  if (role == null || role === '') {
    return SESSION_IDLE_MAX_MS;
  }
  const normalized = String(role).trim().toUpperCase().replace(/^ROLE_/, '');
  const mapped = SESSION_IDLE_MAX_MS_BY_ROLE[
    normalized as keyof typeof SESSION_IDLE_MAX_MS_BY_ROLE
  ];
  return mapped ?? SESSION_IDLE_MAX_MS;
}

/**
 * 유휴 만료 폴링 간격(밀리초).
 * 긴 setTimeout 지연·백그라운드 복귀 시 즉시 판정과 병행.
 */
export const SESSION_IDLE_CHECK_INTERVAL_MS = 60 * 1000;

/**
 * 중복 로그인 피해자 강제 로그아웃 폴링 간격(밀리초).
 * 웹 `duplicateLoginManager` checkIntervalMs(60s) 와 정합.
 */
export const DUPLICATE_LOGIN_VICTIM_POLL_MS = 60 * 1000;

/**
 * 터치 등 활동 기록 스로틀(밀리초). 매 프레임 터치로 lastActivity 갱신 폭주 방지.
 */
export const SESSION_IDLE_ACTIVITY_THROTTLE_MS = 1000;
