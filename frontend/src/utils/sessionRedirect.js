/**
 * 인증 실패 시 로그인으로 이동 — 모듈 단일 플래그로 중복 리다이렉트 방지.
 */

import { LOGIN_RETURN_URL_PARAM } from '../constants/consultationLogAutosaveConstants';

let redirectScheduled = false;

/**
 * 돌아올 경로를 로그인 URL 쿼리로 만든다. 외부 도메인·프로토콜 주입을 막기 위해
 * 같은 오리진의 절대 경로(`/`로 시작, `//` 제외)만 허용한다.
 *
 * @param {string} returnUrl
 * @returns {string} 검증 통과 시 `?redirect=...`, 아니면 빈 문자열
 */
export const buildLoginReturnSearch = (returnUrl) => {
  if (typeof returnUrl !== 'string') return '';
  const trimmed = returnUrl.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '';
  return `?${LOGIN_RETURN_URL_PARAM}=${encodeURIComponent(trimmed)}`;
};

/**
 * 로그인 페이지로 한 번만 이동합니다.
 *
 * @param {object} [options]
 * @param {string} [options.search] — 예: "?reason=duplicate-login" (선행 ? 포함)
 * @param {string} [options.returnUrl] — 재로그인 후 돌아올 같은 오리진 경로.
 *   {@code search} 가 없을 때만 사용되며, 로그인 성공 시 기존 {@code redirect} 파라미터
 *   흐름(UnifiedLogin)이 이 경로로 복귀시킨다.
 * @returns {boolean} 이동을 예약했으면 true, 이미 예약됨이면 false
 */
export const redirectToLoginPageOnce = (options = {}) => {
  if (redirectScheduled) {
    return false;
  }
  redirectScheduled = true;
  try {
    // 만료·401 soft 경로에서도 토큰·유저 힌트 잔존 방지 (강제 연장 없음)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sessionInfo');
  } catch {
    /* private mode 등 */
  }
  const explicitSearch = typeof options.search === 'string' ? options.search : '';
  const search = explicitSearch || buildLoginReturnSearch(options.returnUrl);
  window.location.href = `${window.location.origin}/login${search}`;
  return true;
};
