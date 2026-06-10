/**
 * Google Identity Services (GIS) 웹 통합 — `@react-oauth/google` `useGoogleLogin` 결과를
 * 백엔드 `/api/v1/auth/social-login` 으로 전달하여 매칭/JWT 발급을 받는 서비스 헬퍼.
 *
 * <p>동일 BE 엔드포인트를 expo-app 의 `AuthService.loginWithGoogle` 도 사용한다 —
 * BE 가 GOOGLE provider 에 한해 accessToken 우선·idToken 폴백을 동시 수용한다
 * ({@code GoogleOAuth2ServiceImpl#getUserInfoFromIdToken} P0 2026-06-10).</p>
 *
 * <p>응답 분기(`mapGoogleSocialLoginResponse`):
 * <ul>
 *   <li>{@code authenticated} — 즉시 로그인 성공 + JWT 저장 + 라우팅</li>
 *   <li>{@code requiresOAuthPhoneVerification} — 휴대폰 매칭 OTP 단계 진입</li>
 *   <li>{@code requiresPhoneAccountSelection} — 동일 전화 다계정 선택 필요</li>
 *   <li>{@code requiresSignup} — 미등록 사용자 → SocialSignupModal</li>
 *   <li>{@code error} — 그 외 실패</li>
 * </ul></p>
 *
 * <p>본 서비스는 React 의존성이 없으며 호출자 컴포넌트(`GoogleLoginButton` 또는
 * `UnifiedLogin` 의 핸들러)가 outcome 별로 UI 를 결정한다. tenantId 는
 * BE `TenantContextFilter` 가 서브도메인/세션/헤더에서 추출하므로 별도 인자로 받지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import StandardizedApi from '../../utils/standardizedApi';
import { AUTH_API } from '../../constants/api';

/** BE `/social-login` 응답에서 회원가입 필요 분기 매핑 결과. */
const buildRequiresSignupOutcome = (envelope, accessToken, idToken) => {
  const info = (envelope && envelope.socialUserInfo) || {};
  return {
    kind: 'requiresSignup',
    socialUserInfo: {
      provider: 'GOOGLE',
      providerUserId: info.socialId || info.providerUserId || null,
      email: info.email || null,
      name: info.name || null,
      nickname: info.nickname || null,
      profileImageUrl: info.profileImageUrl || null
    },
    rawAccessToken: accessToken || null,
    rawIdToken: idToken || null,
    message: envelope && envelope.message ? envelope.message : null
  };
};

/**
 * BE `/api/v1/auth/social-login` 응답을 클라이언트 outcome 으로 매핑한다.
 *
 * @param {object|null|undefined} envelope BE 응답(JSON, ApiResponse 미적용 평면 형태)
 * @param {string|undefined} accessToken 호출 시 BE 로 보낸 Google access token
 * @param {string|undefined} idToken 호출 시 BE 로 보낸 Google id token
 * @returns {object} outcome
 */
export const mapGoogleSocialLoginResponse = (envelope, accessToken, idToken) => {
  if (!envelope || typeof envelope !== 'object') {
    return { kind: 'error', message: '서버 응답이 없습니다.' };
  }

  // provider-agnostic OAuth 휴대폰 매칭(OTP) 분기.
  if (envelope.requiresOAuthPhoneVerification && envelope.phoneVerificationToken) {
    const info = envelope.socialUserInfo || {};
    return {
      kind: 'requiresOAuthPhoneVerification',
      provider: 'GOOGLE',
      phoneVerificationToken: envelope.phoneVerificationToken,
      tenantId: envelope.tenantId || null,
      socialUserInfo: {
        provider: 'GOOGLE',
        providerUserId: info.socialId || info.providerUserId || null,
        email: info.email || null,
        name: info.name || null,
        nickname: info.nickname || null
      },
      message: envelope.message || null
    };
  }

  // 동일 전화 복수 계정 — 선택 토큰으로 후속 미리보기 호출.
  if (envelope.requiresPhoneAccountSelection && envelope.selectionToken) {
    return {
      kind: 'requiresPhoneAccountSelection',
      provider: 'GOOGLE',
      selectionToken: envelope.selectionToken,
      tenantId: envelope.tenantId || null,
      message: envelope.message || null
    };
  }

  // 신규 사용자 → 가입 분기. socialUserInfo.socialId 가 핵심.
  if (envelope.requiresSignup) {
    return buildRequiresSignupOutcome(envelope, accessToken, idToken);
  }

  // 정상 로그인.
  if (envelope.success === true && envelope.user && envelope.accessToken) {
    return {
      kind: 'authenticated',
      user: envelope.user,
      accessToken: envelope.accessToken,
      refreshToken: envelope.refreshToken || null,
      sessionId: envelope.sessionId || null
    };
  }

  return {
    kind: 'error',
    message: envelope.message || '로그인에 실패했습니다.'
  };
};

/**
 * Google access_token / id_token 으로 BE 에 매칭/로그인을 요청한다.
 *
 * <p>본 함수는 두 토큰 중 최소 하나를 받아야 한다. 둘 다 비어 있으면 사용자 친화 에러를 즉시
 * 반환하여 BE 호출을 생략한다(트래픽 절감 + UX). BE 계약은
 * `OAuth2Controller#socialLoginWithAccessToken` 의 GOOGLE 분기를 따른다.</p>
 *
 * @param {{ accessToken?: string|null, idToken?: string|null }} tokens
 * @returns {Promise<object>} {@link mapGoogleSocialLoginResponse} 결과
 */
export const requestGoogleSocialLogin = async({ accessToken, idToken }) => {
  const trimmedAccessToken = typeof accessToken === 'string' ? accessToken.trim() : '';
  const trimmedIdToken = typeof idToken === 'string' ? idToken.trim() : '';

  if (!trimmedAccessToken && !trimmedIdToken) {
    return {
      kind: 'error',
      message: 'Google 로그인 응답에서 토큰을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.'
    };
  }

  // ApiResponse 래퍼는 사용하지 않는다 — `socialLoginWithAccessToken` 은 평면 Map 응답.
  // unwrapApiEnvelope=false 로 success/data 등 모든 키를 그대로 받는다.
  const requestBody = { provider: 'GOOGLE' };
  if (trimmedAccessToken) {
    requestBody.accessToken = trimmedAccessToken;
  }
  if (trimmedIdToken) {
    requestBody.idToken = trimmedIdToken;
  }

  try {
    const envelope = await StandardizedApi.post(
      AUTH_API.SOCIAL_LOGIN,
      requestBody,
      { unwrapApiEnvelope: false }
    );
    return mapGoogleSocialLoginResponse(envelope, trimmedAccessToken, trimmedIdToken);
  } catch (error) {
    const message =
      (error && (error.message || (error.data && error.data.message)))
      || 'Google 로그인 요청 중 오류가 발생했습니다.';
    return { kind: 'error', message };
  }
};

export default {
  mapGoogleSocialLoginResponse,
  requestGoogleSocialLogin
};
