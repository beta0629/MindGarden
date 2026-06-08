/**
 * Sign in with Apple — BE 로그인 + 휴대폰 매칭 API 클라이언트 (Expo).
 *
 * Apple App Store Guideline 4.8 (T1) 대응. iOS 네이티브 `signInAsync()` 가 반환한
 * identityToken 을 백엔드로 보내 검증·세션 발급한다.
 *
 * BE 응답이 `requiresPhoneVerification=true` 인 경우, 후속 휴대폰 매칭 흐름
 * (`/phone/send`, `/phone/verify`)을 이어서 호출하여 매칭/로그인을 완료한다.
 *
 * 백엔드 라우트:
 *  - POST {@link AUTH_API.APPLE_LOGIN}         — `identityToken` 위주
 *  - POST {@link AUTH_API.APPLE_CALLBACK}      — `authorizationCode` 교환(웹 콜백 호환)
 *  - POST {@link AUTH_API.APPLE_PHONE_SEND}    — OTP 발송
 *  - POST {@link AUTH_API.APPLE_PHONE_VERIFY}  — OTP 검증 + 매칭/로그인
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import { apiPost } from '../client';
import { AUTH_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';

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
 * Native + 웹 콜백 + phone/verify 공통:
 *  - `success`: 처리 자체가 성공했는지 여부
 *  - `requiresSignup` (deprecated 2026-06-08): 휴대폰 매칭 흐름으로 통일됨에 따라 BE 는 더 이상 채우지 않는다. 구버전 클라이언트 호환용
 *  - `requiresPhoneVerification`: apple_sub 매칭 사용자가 없어 휴대폰 인증이 필요 — 클라이언트는 phone 입력 화면으로 이동
 *  - `phoneVerificationToken`: `requiresPhoneVerification=true` 일 때 함께 발급되는 단기 JWT (10분 만료)
 *  - `requiresPhoneAccountSelection`: 휴대폰 인증 후 매칭 후보 2명+(역할 혼재) — `oauth-account-selection` 화면으로 라우팅
 *  - `phoneAccountSelectionToken`: `requiresPhoneAccountSelection=true` 일 때 함께 발급되는 기존 OAuth 계정 선택 토큰
 *  - `accessToken`/`refreshToken`/`user`: 즉시 로그인 (apple_sub 매칭 또는 phone 매칭 단수)
 */
export interface AppleAuthLoginResponse {
  success: boolean;
  /** @deprecated 2026-06-08 — Apple SIWA 휴대폰 매칭 흐름으로 통일됨. 신규 클라이언트는 `requiresPhoneVerification` 참고 */
  requiresSignup?: boolean;
  /** Apple SIWA 휴대폰 매칭 1단계 신호. apple_sub 매칭 사용자가 없을 때 true. */
  requiresPhoneVerification?: boolean;
  /** `requiresPhoneVerification=true` 일 때 함께 발급되는 단기 JWT(10분 만료). phone/send, phone/verify 호출 시 함께 보낸다. */
  phoneVerificationToken?: string;
  /** 휴대폰 인증 후 매칭 후보 2명+(역할 혼재)일 때 true. */
  requiresPhoneAccountSelection?: boolean;
  /** `requiresPhoneAccountSelection=true` 일 때 함께 발급되는 기존 OAuth 계정 선택 토큰. */
  phoneAccountSelectionToken?: string;
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
  /** 휴대폰 입력 화면 prefill 용 social user 정보 (이메일/이름/relay 여부 등) */
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

/** OTP 발송 요청 페이로드. */
export interface ApplePhoneSendRequest {
  phoneVerificationToken: string;
  /** 한국 휴대폰 11자리(정규화 전 raw 도 허용 — BE 에서 정규화) */
  phoneNumber: string;
}

/** OTP 발송 응답 — 백엔드 `ApplePhoneSendResponse`. */
export interface ApplePhoneSendResponse {
  success: boolean;
  message?: string;
  /** verify 호출 시 함께 보내야 하는 challenge 토큰(3분 만료). 실패 시 null. */
  otpChallengeToken?: string;
  /** OTP 만료 시간(초) — 클라이언트 카운트다운 표시용. */
  expiresInSeconds?: number;
  /** 재발송 가능까지 남은 시간(초) — 쿨다운 발생 시 채움. */
  retryAfterSeconds?: number;
}

/** OTP 검증 요청 페이로드. */
export interface ApplePhoneVerifyRequest {
  phoneVerificationToken: string;
  otpChallengeToken: string;
  /** 사용자가 입력한 6자리 OTP */
  code: string;
}

/**
 * BE 가 `ApiResponse<T>` 래퍼로 응답하거나 평탄화된 본문을 직접 반환하는 양쪽 모두 호환되도록
 * unwrap 한다. 래퍼면 `data` 필드를, 평탄화면 raw 를 그대로 반환.
 */
function unwrapAppleResponse<T>(raw: unknown): T {
  const unwrapped = unwrapApiResponse<T>(raw);
  if (unwrapped != null) {
    return unwrapped;
  }
  return raw as T;
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
  const raw = await apiPost<unknown>(AUTH_API.APPLE_LOGIN, payload);
  return unwrapAppleResponse<AppleAuthLoginResponse>(raw);
}

/**
 * Apple SIWA 휴대폰 매칭 — OTP 발송.
 *
 * @param payload `phoneVerificationToken` (login 응답에서 받은 단기 JWT) + 사용자 입력 휴대폰 번호
 * @returns OTP 발송 결과 + verify 시 함께 보낼 `otpChallengeToken`
 */
export async function postAppleSendPhoneOtp(
  payload: ApplePhoneSendRequest,
): Promise<ApplePhoneSendResponse> {
  if (!payload.phoneVerificationToken) {
    throw new Error('phoneVerificationToken 이 없습니다.');
  }
  if (!payload.phoneNumber) {
    throw new Error('phoneNumber 가 없습니다.');
  }
  const raw = await apiPost<unknown>(AUTH_API.APPLE_PHONE_SEND, payload);
  return unwrapAppleResponse<ApplePhoneSendResponse>(raw);
}

/**
 * Apple SIWA 휴대폰 매칭 — OTP 검증 + 매칭/로그인.
 *
 * @param payload `phoneVerificationToken` + `otpChallengeToken` + 사용자 입력 6자리 코드
 * @returns 백엔드 `AppleSignInResponse` (정상 로그인 / phoneAccountSelection / 실패)
 */
export async function postAppleVerifyPhoneOtp(
  payload: ApplePhoneVerifyRequest,
): Promise<AppleAuthLoginResponse> {
  if (!payload.phoneVerificationToken) {
    throw new Error('phoneVerificationToken 이 없습니다.');
  }
  if (!payload.otpChallengeToken) {
    throw new Error('otpChallengeToken 이 없습니다.');
  }
  if (!payload.code) {
    throw new Error('code 가 없습니다.');
  }
  const raw = await apiPost<unknown>(AUTH_API.APPLE_PHONE_VERIFY, payload);
  return unwrapAppleResponse<AppleAuthLoginResponse>(raw);
}
