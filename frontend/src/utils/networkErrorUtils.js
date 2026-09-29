import { API_ERROR_MESSAGES, API_STATUS } from '../constants/api';

/**
 * fetch 실패 등 일시적 네트워크 오류 여부 (HTTP 401 응답과 구분).
 * @param {unknown} err
 * @returns {boolean}
 */
export const isTransientNetworkError = (err) => {
  if (!err || typeof err !== 'object') {
    return false;
  }
  const status = err.status;
  if (typeof status === 'number' && status >= API_STATUS.INTERNAL_SERVER_ERROR) {
    return false;
  }
  const name = err.name || '';
  const msg = String(err.message || '');
  // AbortSignal.timeout() 은 AbortError 가 아닌 TimeoutError 로 reject 한다 (세션 확인 타임아웃)
  if (name === 'AbortError' || name === 'TimeoutError') {
    return true;
  }
  if (name === 'TypeError' && (
    msg.includes('Failed to fetch') ||
    msg.includes('Load failed') ||
    msg.includes('NetworkError')
  )) {
    return true;
  }
  return false;
};

/**
 * notification.js의 CustomEvent 구독과 동일 채널 (ajax ↔ notification 순환 의존 방지).
 */
export const notifyTransientNetworkIssue = () => {
  if (typeof globalThis.window === 'undefined') {
    return;
  }
  try {
    globalThis.window.dispatchEvent(new CustomEvent('showNotification', {
      detail: {
        message: API_ERROR_MESSAGES.SESSION_VERIFY_NETWORK_TRANSIENT,
        type: 'warning',
        duration: 5000
      }
    }));
  } catch {
    /* private mode 등 */
  }
};
