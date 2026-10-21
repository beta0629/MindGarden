/**
 * 인증 실패 시 로그인으로 이동 — 모듈 단일 플래그로 중복 리다이렉트 방지.
 *
 * <p>401·세션 만료로 로그인에 보내는 모든 경로는 {@link redirectToLoginPageOnce} 를 지난다.
 * 이동 직전 등록된 보관 백업({@link registerLoginRedirectRescue})을 먼저 실행해 작성 중 입력을 남긴다.
 * 화면이 직접 {@code /login} 으로 보내면 이 처리를 건너뛰므로 CI(check-login-redirect-bypass)가 막는다.</p>
 */

import {
  LOGIN_REDIRECT_RESCUE_TIMEOUT_MS,
  LOGIN_RETURN_URL_PARAM
} from '../constants/consultationLogAutosaveConstants';
import { rememberLoginReturnPath, sanitizeLoginReturnPath } from './loginReturnPath';
import { sanitizeSameOriginReturnPath } from './sameOriginReturnPath';

let redirectScheduled = false;

export { sanitizeSameOriginReturnPath };

/**
 * 돌아올 경로를 로그인 URL 쿼리로 만든다. {@link sanitizeSameOriginReturnPath} 를 통과한 경로만 붙인다.
 *
 * @param {string} returnUrl
 * @returns {string} 검증 통과 시 `?redirect=...`, 아니면 빈 문자열
 */
export const buildLoginReturnSearch = (returnUrl) => {
  // 복귀 주소 검증은 sanitizeLoginReturnPath 한 곳(외부·스킴·인코딩 우회·로그인 경로 차단, 토큰·개인정보 쿼리 제거)
  const safePath = sanitizeLoginReturnPath(returnUrl);
  if (!safePath) return '';
  return `?${LOGIN_RETURN_URL_PARAM}=${encodeURIComponent(safePath)}`;
};

/**
 * 지금 보고 있는 화면 주소(경로+쿼리). 401·세션 만료로 로그인에 보낼 때 따로 받은 복귀 주소가 없으면 이 값을 쓴다.
 *
 * @returns {string}
 */
export const getCurrentLocationReturnUrl = () => {
  try {
    return `${window.location.pathname || ''}${window.location.search || ''}`;
  } catch {
    return '';
  }
};

/** 다음 로그인 이동에 붙일 복귀 경로 — 다른 경로(세션 재확인 등)가 먼저 이동해도 returnUrl 을 잃지 않게 한다. */
let pendingReturnPath = '';

/**
 * 이후 {@link redirectToLoginPageOnce} 가 search·returnUrl 없이 불려도 이 경로로 돌아오게 예약한다.
 * (예: 401 보관 백업을 쓴 화면이 세션 재확인을 부르는 동안 그 재확인이 먼저 /login 으로 보내는 경우)
 *
 * @param {string} returnUrl 같은 오리진 상대 경로. 검증 실패 시 예약하지 않는다.
 */
export const setPendingLoginReturnUrl = (returnUrl) => {
  pendingReturnPath = sanitizeSameOriginReturnPath(returnUrl);
};

/** 예약한 복귀 경로를 지운다(세션이 살아 있어 이동하지 않게 된 경우). */
export const clearPendingLoginReturnUrl = () => {
  pendingReturnPath = '';
};

/** 로그인 이동 직전 실행할 보관 백업 — 화면 공통 훅이 등록한다. */
const loginRedirectRescues = new Set();

/**
 * 로그인 이동 직전 보관 백업을 등록한다.
 *
 * <p>rescue 는 <strong>호출되는 순간 동기로</strong> 현재 입력을 캡처하고 저장 Promise 를 돌려줘야 한다
 * (이동·언마운트가 뒤따르므로 이후 상태를 읽으면 늦다).</p>
 *
 * @param {() => ({ persisted: boolean, returnUrl?: string }|Promise<{ persisted: boolean, returnUrl?: string }>)} rescue
 * @returns {() => void} 등록 해제
 */
export const registerLoginRedirectRescue = (rescue) => {
  if (typeof rescue !== 'function') return () => {};
  loginRedirectRescues.add(rescue);
  return () => {
    loginRedirectRescues.delete(rescue);
  };
};

const startLoginRedirectRescues = () => {
  const pending = [];
  loginRedirectRescues.forEach((rescue) => {
    try {
      pending.push(Promise.resolve(rescue()));
    } catch {
      // 한 화면의 백업 실패가 다른 화면 백업·로그인 이동을 막지 않게 한다
    }
  });
  return pending;
};

const pickRescueReturnPath = (results) => {
  const kept = results.find((r) => r.status === 'fulfilled' && r.value && r.value.persisted === true
    && sanitizeSameOriginReturnPath(r.value.returnUrl));
  return kept ? kept.value.returnUrl : '';
};

/**
 * 로그인 페이지로 한 번만 이동합니다.
 *
 * @param {object} [options]
 * @param {string} [options.search] — 예: "?reason=duplicate-login" (선행 ? 포함)
 * @param {string} [options.returnUrl] — 재로그인 후 돌아올 같은 오리진 경로.
 *   {@code search} 가 없을 때만 로그인 URL 쿼리에 실리며, 그 경우 같은 값을
 *   {@code mg.loginReturnPath} 에도 맡긴다(로그인 화면이 쿼리를 지워도 복귀).
 *   로그인 성공 시 기존 {@code redirect} 파라미터 흐름(UnifiedLogin)이 이 경로로 복귀시킨다.
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
  const navigate = (rescueReturnPath) => {
    const candidate = options.returnUrl || rescueReturnPath || pendingReturnPath
      || getCurrentLocationReturnUrl();
    // 명시 search(중복 로그인 등)는 복귀 쿼리를 대체한다. 그 외에는 안전한 경로만 쿼리와 저장소에 싣는다.
    const safePath = explicitSearch ? '' : sanitizeLoginReturnPath(candidate);
    if (safePath) {
      rememberLoginReturnPath(safePath);
    }
    const search = explicitSearch || buildLoginReturnSearch(candidate);
    window.location.href = `${window.location.origin}/login${search}`;
  };
  const pending = startLoginRedirectRescues();
  if (pending.length === 0) {
    navigate('');
    return true;
  }
  let navigated = false;
  const navigateOnce = (rescueReturnPath) => {
    if (navigated) return;
    navigated = true;
    navigate(rescueReturnPath);
  };
  const timer = setTimeout(() => navigateOnce(''), LOGIN_REDIRECT_RESCUE_TIMEOUT_MS);
  void Promise.allSettled(pending).then((results) => {
    clearTimeout(timer);
    navigateOnce(pickRescueReturnPath(results));
  });
  return true;
};
