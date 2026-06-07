/**
 * Sign in with Apple — BE 로그인 API 클라이언트 (Expo).
 *
 * Apple App Store Guideline 4.8 (T1) 대응. iOS 네이티브 `signInAsync()` 가 반환한
 * identityToken 을 백엔드로 보내 검증·세션 발급한다.
 *
 * 백엔드 라우트:
 *  - POST {@link AUTH_API.APPLE_LOGIN}     — `identityToken` 위주
 *  - POST {@link AUTH_API.APPLE_CALLBACK}  — `authorizationCode` 교환(웹 콜백 호환)
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import { apiPost } from '../client';
import { AUTH_API } from '../endpoints';

/** Apple 로그인 요청 페이로드 — 백엔드 `AppleSignInRequest` 와 1:1. */
export interface AppleAuthLoginRequest {
  identityToken: string;
  authorizationCode?: string;
  nonce?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
}

/**
 * 백엔드 Apple 로그인 응답.
 *
 * Native + 웹 콜백 공통:
 *  - `success`: 처리 자체가 성공했는지 여부
 *  - `requiresSignup`: 신규 사용자(휴대폰·필수 정보 부족) — 클라이언트는 `socialUserInfo` 로 가입 폼을 채워야 한다
 *  - `accessToken`/`refreshToken`/`user`: 기존 사용자 즉시 로그인
 */
export interface AppleAuthLoginResponse {
  success: boolean;
  requiresSignup?: boolean;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  /** 백엔드 `AppleUserSummary` */
  user?: {
    id: number;
    email: string;
    name?: string;
    nickname?: string;
    role: string;
    profileImageUrl?: string;
    tenantId?: string;
  };
  /** 신규 사용자 가입 폼 prefill */
  socialUserInfo?: {
    provider: 'APPLE';
    providerUserId: string;
    email?: string | null;
    name?: string | null;
    nickname?: string | null;
    profileImageUrl?: string | null;
    isPrivateRelay?: boolean;
    tenantId?: string | null;
  };
  sessionId?: string;
}

/**
 * Apple identityToken 으로 백엔드 로그인/가입 요청을 전송한다.
 * @param payload `AppleAuthentication.signInAsync()` 결과를 정규화한 페이로드
 * @returns 백엔드 `AppleSignInResponse`
 */
export async function postAppleLogin(
  payload: AppleAuthLoginRequest,
): Promise<AppleAuthLoginResponse> {
  if (!payload.identityToken) {
    throw new Error('Apple identityToken 이 없습니다.');
  }
  return apiPost<AppleAuthLoginResponse>(AUTH_API.APPLE_LOGIN, payload);
}
