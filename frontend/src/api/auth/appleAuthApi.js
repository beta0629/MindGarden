/**
 * Sign in with Apple — 백엔드 API 클라이언트.
 *
 * 표준 정책:
 * - 모든 호출은 {@link StandardizedApi} 를 통해서만 수행한다 (`docs/standards/API_CALL_STANDARD.md`).
 * - 직접 `fetch` / `axios` 사용 금지.
 *
 * 백엔드 경로:
 * - POST /api/v1/auth/oauth/apple/login    (native iOS / 웹 JS SDK)
 * - POST /api/v1/auth/oauth/apple/callback (웹 서버 콜백 — authorization_code)
 *
 * Apple App Store 4.8 (T1) 대응 — 디자이너 핸드오프
 * docs/project-management/2026-06-04/APPLE_T1_SIWA_DESIGN_HANDOFF.md.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import StandardizedApi from '../../utils/standardizedApi';

const APPLE_LOGIN_ENDPOINT = '/api/v1/auth/oauth/apple/login';
const APPLE_CALLBACK_ENDPOINT = '/api/v1/auth/oauth/apple/callback';

const buildLoginPayload = (raw) => ({
  identityToken: raw.identityToken,
  authorizationCode: raw.authorizationCode || undefined,
  nonce: raw.nonce || undefined,
  givenName: raw.givenName || undefined,
  familyName: raw.familyName || undefined,
  email: raw.email || undefined
});

/**
 * Apple identityToken 으로 로그인/가입 호출.
 *
 * @param {{
 *   identityToken: string,
 *   authorizationCode?: string,
 *   nonce?: string,
 *   givenName?: string,
 *   familyName?: string,
 *   email?: string
 * }} payload Apple JS SDK 응답에서 추출한 raw 값
 * @returns {Promise<Object>} 백엔드 AppleSignInResponse (success, accessToken, refreshToken, user, …)
 */
export const signInWithApple = async (payload) => {
  if (!payload || !payload.identityToken) {
    throw new Error('Apple 로그인 요청에는 identityToken 이 필요합니다.');
  }
  return StandardizedApi.post(APPLE_LOGIN_ENDPOINT, buildLoginPayload(payload));
};

/**
 * Apple 웹 콜백(authorizationCode) 으로 로그인/가입 호출.
 *
 * @param {{ authorizationCode: string, nonce?: string }} payload
 * @returns {Promise<Object>}
 */
export const exchangeAppleAuthorizationCode = async (payload) => {
  if (!payload || !payload.authorizationCode) {
    throw new Error('Apple 콜백 요청에는 authorizationCode 가 필요합니다.');
  }
  return StandardizedApi.post(APPLE_CALLBACK_ENDPOINT, buildLoginPayload({
    identityToken: payload.identityToken || '',
    authorizationCode: payload.authorizationCode,
    nonce: payload.nonce
  }));
};

export default {
  signInWithApple,
  exchangeAppleAuthorizationCode
};
