/**
 * 세션 인증 정책 — shell chrome soft-fail URL, justLoggedIn TTL 창.
 * 어드민 대시보드 병렬 XHR 레이스로 /login 킥을 막기 위한 FE 전용 정책.
 *
 * @author Core Solution
 * @since 2026-03-24
 */

import {
  JUST_LOGGED_IN_AT_KEY,
  JUST_LOGGED_IN_KEY,
  JUST_LOGGED_IN_TTL_MS,
  SESSION_KEYS,
  SESSION_SOFT_FAIL_URL_PATHS
} from '../constants/session';

/**
 * URL 경로에서 query 를 제거한 pathname 유사 문자열.
 * @param {string} url
 * @returns {string}
 */
function normalizeUrlPath(url) {
  if (url == null || typeof url !== 'string') {
    return '';
  }
  const withoutQuery = url.split('?')[0];
  try {
    if (withoutQuery.startsWith('http://') || withoutQuery.startsWith('https://')) {
      return new URL(withoutQuery).pathname || withoutQuery;
    }
  } catch (_e) {
    // fall through
  }
  return withoutQuery;
}

/**
 * shell chrome(브랜딩·LNB·공통코드 등) URL 이면 401/403 시 /login 리다이렉트하지 않음.
 * path substring 매칭, query string 무시.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isSessionSoftFailUrl(url) {
  const path = normalizeUrlPath(url);
  if (!path) {
    return false;
  }
  return SESSION_SOFT_FAIL_URL_PATHS.some((softPath) => path.includes(softPath));
}

/**
 * 로그인 직후 플래그 + 타임스탬프 설정 (TTL 창 시작).
 * 기존 justLoggedIn=true 호출부를 이 헬퍼로 교체.
 */
export function markJustLoggedIn() {
  try {
    sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
    sessionStorage.setItem(JUST_LOGGED_IN_AT_KEY, String(Date.now()));
  } catch (_e) {
    // sessionStorage 불가 환경 — 무시
  }
}

/**
 * justLoggedIn 플래그 제거 (TTL 만료 또는 current-user 200 후 선택적 클리어).
 */
export function clearJustLoggedIn() {
  try {
    sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
    sessionStorage.removeItem(JUST_LOGGED_IN_AT_KEY);
  } catch (_e) {
    // ignore
  }
}

/**
 * 로그인 직후 TTL 창 안이면 true.
 * - justLoggedIn=true 이고 justLoggedInAt 없으면 첫 체크 시 At 를 기록(레거시 호환).
 * - 만료 시에만 양쪽 remove. 첫 401 스킵 시 removeItem 하지 않음.
 *
 * @param {number} [nowMs=Date.now()]
 * @returns {boolean}
 */
export function isWithinJustLoggedInWindow(nowMs = Date.now()) {
  try {
    const flag = sessionStorage.getItem(JUST_LOGGED_IN_KEY);
    if (flag !== 'true') {
      return false;
    }

    let atRaw = sessionStorage.getItem(JUST_LOGGED_IN_AT_KEY);
    if (atRaw == null || atRaw === '') {
      // 레거시: justLoggedIn 만 있고 At 없음 → 첫 확인 시 창 시작
      atRaw = String(nowMs);
      sessionStorage.setItem(JUST_LOGGED_IN_AT_KEY, atRaw);
    }

    const atMs = Number(atRaw);
    if (!Number.isFinite(atMs)) {
      clearJustLoggedIn();
      return false;
    }

    if (nowMs - atMs < JUST_LOGGED_IN_TTL_MS) {
      return true;
    }

    clearJustLoggedIn();
    return false;
  } catch (_e) {
    return false;
  }
}

/**
 * localStorage 에 accessToken 이 있는지.
 * @returns {boolean}
 */
export function hasStoredAccessToken() {
  try {
    const token = localStorage.getItem(SESSION_KEYS.ACCESS_TOKEN);
    return token != null && String(token).trim() !== '';
  } catch (_e) {
    return false;
  }
}
