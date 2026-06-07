/**
 * Sign in with Apple (SIWA) — 웹 JS SDK 통합.
 *
 * Apple App Store 4.8 (Login Services) 대응 — T1 트랙. 디자이너 핸드오프
 * docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md §6.4 참조.
 *
 * 책임:
 * 1. Apple JS SDK (`https://appleid.cdn-apple.com/...`) 동적 로드 (1회)
 * 2. `AppleID.auth.init(...)` 설정 (clientId, redirectURI, scope, usePopup, state, nonce)
 * 3. `AppleID.auth.signIn()` 호출 → `{ authorization: { id_token, code, state }, user? }` 반환
 *
 * 보안:
 * - `state`/`nonce` 는 호출마다 새로 생성 (CSRF · replay 방지)
 * - 응답 검증·사용자 매칭은 백엔드 `appleAuthApi.signInWithApple()` 에 위임
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import { APPLE_OAUTH2_CONFIG } from '../../constants/oauth2';

const APPLE_SDK_LOAD_TIMEOUT_MS = 8000;

let appleSdkLoadingPromise = null;

const generateRandomToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Apple JS SDK script 를 lazy 로드한다. 이미 로드되어 있으면 즉시 resolve.
 * @returns {Promise<void>}
 */
export const ensureAppleSdkLoaded = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Apple SDK 는 브라우저 환경에서만 사용할 수 있습니다.'));
  }
  if (window.AppleID && window.AppleID.auth) {
    return Promise.resolve();
  }
  if (appleSdkLoadingPromise) {
    return appleSdkLoadingPromise;
  }
  appleSdkLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${APPLE_OAUTH2_CONFIG.sdkUrl}"]`);
    const onLoaded = () => {
      if (window.AppleID && window.AppleID.auth) {
        resolve();
      } else {
        reject(new Error('Apple SDK 가 로드되었지만 AppleID.auth 가 노출되지 않았습니다.'));
      }
    };
    if (existing) {
      existing.addEventListener('load', onLoaded, { once: true });
      existing.addEventListener('error', () => reject(new Error('Apple SDK 로드 실패')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = APPLE_OAUTH2_CONFIG.sdkUrl;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onLoaded, { once: true });
    script.addEventListener('error', () => reject(new Error('Apple SDK 로드 실패')), { once: true });
    const timeoutId = setTimeout(() => {
      reject(new Error('Apple SDK 로드 시간 초과'));
    }, APPLE_SDK_LOAD_TIMEOUT_MS);
    script.addEventListener('load', () => clearTimeout(timeoutId), { once: true });
    document.head.appendChild(script);
  });
  appleSdkLoadingPromise = appleSdkLoadingPromise.catch((err) => {
    appleSdkLoadingPromise = null;
    throw err;
  });
  return appleSdkLoadingPromise;
};

/**
 * AppleID.auth.init 을 1회 호출한다 (이미 호출되어 있으면 멱등 안전).
 * @param {{ nonce: string, state: string }} options
 */
const initializeAppleAuth = ({ nonce, state }) => {
  const auth = window.AppleID && window.AppleID.auth;
  if (!auth) {
    throw new Error('Apple SDK 가 초기화되지 않았습니다.');
  }
  auth.init({
    clientId: APPLE_OAUTH2_CONFIG.clientId,
    scope: APPLE_OAUTH2_CONFIG.scope,
    redirectURI: APPLE_OAUTH2_CONFIG.redirectUri,
    state,
    nonce,
    usePopup: APPLE_OAUTH2_CONFIG.usePopup,
    responseType: APPLE_OAUTH2_CONFIG.responseType,
    responseMode: APPLE_OAUTH2_CONFIG.responseMode
  });
};

/**
 * Apple 로그인 시트를 띄우고 identityToken 을 받는다.
 *
 * @returns {Promise<{
 *   identityToken: string,
 *   authorizationCode: string,
 *   state: string,
 *   nonce: string,
 *   givenName: string,
 *   familyName: string,
 *   email: string
 * }>} 백엔드로 전달할 raw payload
 */
export const requestAppleSignIn = async () => {
  await ensureAppleSdkLoaded();
  const nonce = generateRandomToken(64);
  const state = generateRandomToken(32);
  initializeAppleAuth({ nonce, state });

  const data = await window.AppleID.auth.signIn();
  const authorization = (data && data.authorization) || {};
  const user = data && data.user;
  const nameRaw = user && user.name ? user.name : {};
  return {
    identityToken: authorization.id_token || '',
    authorizationCode: authorization.code || '',
    state: authorization.state || state,
    nonce,
    givenName: nameRaw.firstName || '',
    familyName: nameRaw.lastName || '',
    email: (user && user.email) || ''
  };
};

export default {
  ensureAppleSdkLoaded,
  requestAppleSignIn
};
