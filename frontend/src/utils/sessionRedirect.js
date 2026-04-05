/**
 * 인증 실패 시 로그인으로 이동 — 모듈 단일 플래그로 중복 리다이렉트 방지.
 */

let redirectScheduled = false;

/**
 * 로그인 페이지로 한 번만 이동합니다.
 * @param {object} [options]
 * @param {string} [options.search] — 예: "?reason=duplicate-login" (선행 ? 포함)
 * @returns {boolean} 이동을 예약했으면 true, 이미 예약됨이면 false
 */
export const redirectToLoginPageOnce = (options = {}) => {
  if (redirectScheduled) {
    return false;
  }
  redirectScheduled = true;
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch {
    /* private mode 등 */
  }
  const search = typeof options.search === 'string' ? options.search : '';
  window.location.href = `${window.location.origin}/login${search}`;
  return true;
};
