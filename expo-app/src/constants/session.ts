/**
 * Expo 세션/유휴(idle) 상수 — 웹 `frontend/src/constants/session.js`·
 * 서버 `HTTP_SESSION_MAX_INACTIVE`(기본 4h)와 정합.
 *
 * @author MindGarden
 * @since 2026-08-05
 */

/**
 * HTTP 세션 비활성 만료(초).
 * SSOT: env `HTTP_SESSION_MAX_INACTIVE` / `server.servlet.session.timeout` 기본 4h = 14400s.
 */
export const HTTP_SESSION_MAX_INACTIVE_SECONDS = 4 * 60 * 60; // 14400

/**
 * 클라이언트 유휴 만료(밀리초). 웹 `SESSION_DURATION` 과 동일(14400000ms).
 */
export const SESSION_IDLE_MAX_MS = HTTP_SESSION_MAX_INACTIVE_SECONDS * 1000;

/**
 * 유휴 만료 폴링 간격(밀리초).
 * 긴 setTimeout 지연·백그라운드 복귀 시 즉시 판정과 병행.
 */
export const SESSION_IDLE_CHECK_INTERVAL_MS = 60 * 1000;

/**
 * 터치 등 활동 기록 스로틀(밀리초). 매 프레임 터치로 lastActivity 갱신 폭주 방지.
 */
export const SESSION_IDLE_ACTIVITY_THROTTLE_MS = 1000;
