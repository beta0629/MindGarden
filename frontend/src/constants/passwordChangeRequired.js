/** 변경 전 토큰이 다른 API를 호출했을 때 서버가 주는 코드. */
export const PASSWORD_CHANGE_REQUIRED_CODE = 'PASSWORD_CHANGE_REQUIRED';

/** 화면이 비밀번호 변경 모달을 다시 열 때 쓰는 브라우저 이벤트. */
export const PASSWORD_CHANGE_REQUIRED_EVENT = 'mindgarden:password-change-required';

/**
 * @param {unknown} body 응답 JSON
 * @returns {boolean} 자격 증명 변경이 필요한 403이면 true
 */
export function bodyRequiresCredentialChange(body) {
  return Boolean(body && typeof body === 'object' && body.errorCode === PASSWORD_CHANGE_REQUIRED_CODE);
}

/** 로그인 이후 제한 API 403에서 변경 모달을 연다. */
export function dispatchPasswordChangeRequired() {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new CustomEvent(PASSWORD_CHANGE_REQUIRED_EVENT));
}
