/**
 * provider-agnostic OAuth 휴대폰 매칭(OTP) — BE API 클라이언트 (Expo).
 *
 * <p>4 종 OAuth provider (Apple / Google / Kakao / Naver) 가 동일 스키마로 호출한다.
 * 기존 Apple 전용 클라이언트({@link ./appleAuth}) 와 별개로 신규 파일을 추가하여
 * Apple 회피 라인 무수정·점진 이관 전략(D-1=(c)) 을 따른다.</p>
 *
 * 백엔드 라우트 (Phase 3A — {@code OAuthPhoneController}):
 *  - POST {@link AUTH_API.OAUTH_PHONE_SEND}    — OTP 발송
 *  - POST {@link AUTH_API.OAUTH_PHONE_VERIFY}  — OTP 검증 + 매칭/로그인
 *
 * BE 응답은 {@code ApiResponse<T>} 래퍼로 감싸여 오며, {@link unwrapApiResponse}
 * 로 {@code data} 본문을 추출한다.
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import { apiPost } from '../client';
import { AUTH_API } from '../endpoints';
import { unwrapApiResponse } from '../unwrapApiResponse';

/** OAuth provider 식별자 — BE {@code OAuthProvider} enum 의 {@code name()} 과 1:1. */
export type OAuthPhoneProvider = 'APPLE' | 'GOOGLE' | 'KAKAO' | 'NAVER';

/** OAuth 휴대폰 OTP 발송 요청 — BE {@code OAuthPhoneSendRequest} 와 1:1. */
export interface OAuthPhoneSendRequest {
  oauthProvider: OAuthPhoneProvider;
  /** OAuth 콜백 응답으로 받은 단기 JWT (provider sub + tenantId 포함, 10분 만료). */
  phoneVerificationToken: string;
  /** 한국 휴대폰 번호 — 정규화 전 raw 도 허용 (BE 에서 정규화·검증). */
  phone: string;
}

/** OAuth 휴대폰 OTP 발송 응답 — BE {@code OAuthPhoneSendResponse} 와 1:1. */
export interface OAuthPhoneSendResponse {
  success: boolean;
  message?: string;
  /** 실패 코드 (OTP_INVALID / OTP_EXPIRED / DAILY_LIMIT_EXCEEDED / RESEND_COOLDOWN / TOKEN_EXPIRED 등). */
  code?: string;
  /** verify 호출 시 함께 보내야 하는 challenge 토큰. 실패 시 null. */
  challengeToken?: string;
  /** OTP 만료 시간(초) — 클라이언트 카운트다운 표시용. */
  expiresInSeconds?: number;
  /** 재발송 가능까지 남은 시간(초) — 쿨다운 발생 시 채움. */
  retryAfterSeconds?: number;
  /** 권장 재발송 쿨다운(초) — 정상 발송 시 BE 가 함께 알려줌. */
  resendCooldownSeconds?: number;
  /** 사용자 노출용 마스킹 휴대폰 (예: `010-****-5678`). PII 보호. */
  maskedPhone?: string;
}

/** OAuth 휴대폰 OTP 검증 요청 — BE {@code OAuthPhoneVerifyRequest} 와 1:1. */
export interface OAuthPhoneVerifyRequest {
  oauthProvider: OAuthPhoneProvider;
  phoneVerificationToken: string;
  /** send 응답으로 받은 challenge 토큰. */
  challengeToken: string;
  /** 사용자가 입력한 6자리 OTP. */
  otpCode: string;
}

/** OTP 검증 후 매칭된 계정 요약 — BE {@code OAuthPhoneVerifyResponse.MatchedAccount}. */
export interface OAuthPhoneMatchedAccount {
  userId: number;
  tenantId?: string;
  /** UserRole.name() (CLIENT / CONSULTANT / ADMIN ...). */
  role?: string;
}

/** OAuth 휴대폰 OTP 검증 응답 — BE {@code OAuthPhoneVerifyResponse} 와 1:1. */
export interface OAuthPhoneVerifyResponse {
  success: boolean;
  message?: string;
  code?: string;
  /** 휴대폰 인증 성공 후 후보 2명+(역할 혼재) 일 때 true. */
  requiresPhoneAccountSelection?: boolean;
  /** `requiresPhoneAccountSelection=true` 일 때 함께 발급되는 기존 OAuth 계정 선택 토큰. */
  phoneAccountSelectionToken?: string;
  /** OTP 검증 후 후속 로그인/매칭 단계 호출용 단기 토큰. */
  phoneVerificationToken?: string;
  /** {@link #phoneVerificationToken} 만료(초). */
  expiresInSeconds?: number;
  /** JWT access token (단일 매칭 로그인 완료 시). */
  accessToken?: string;
  refreshToken?: string;
  /** 매칭된 계정 요약. */
  matchedAccount?: OAuthPhoneMatchedAccount;
}

/**
 * BE 가 {@code ApiResponse<T>} 래퍼로 응답하거나 평탄화된 본문을 직접 반환하는 양쪽 모두
 * 호환되도록 unwrap 한다 (Apple `appleAuth.ts` 와 동일 패턴).
 */
function unwrapOAuthResponse<T>(raw: unknown): T {
  const unwrapped = unwrapApiResponse<T>(raw);
  if (unwrapped != null) {
    return unwrapped;
  }
  return raw as T;
}

/**
 * OAuth 휴대폰 매칭 — OTP 발송.
 *
 * @param payload `oauthProvider + phoneVerificationToken + phone`
 * @returns OTP 발송 결과 + verify 시 함께 보낼 `challengeToken`
 */
export async function postOAuthSendPhoneOtp(
  payload: OAuthPhoneSendRequest,
): Promise<OAuthPhoneSendResponse> {
  if (!payload.oauthProvider) {
    throw new Error('oauthProvider 가 없습니다.');
  }
  if (!payload.phoneVerificationToken) {
    throw new Error('phoneVerificationToken 이 없습니다.');
  }
  if (!payload.phone) {
    throw new Error('phone 이 없습니다.');
  }
  const raw = await apiPost<unknown>(AUTH_API.OAUTH_PHONE_SEND, payload);
  return unwrapOAuthResponse<OAuthPhoneSendResponse>(raw);
}

/**
 * OAuth 휴대폰 매칭 — OTP 검증 + 매칭/로그인.
 *
 * @param payload `oauthProvider + phoneVerificationToken + challengeToken + otpCode(6자리)`
 * @returns BE {@code OAuthPhoneVerifyResponse}
 */
export async function postOAuthVerifyPhoneOtp(
  payload: OAuthPhoneVerifyRequest,
): Promise<OAuthPhoneVerifyResponse> {
  if (!payload.oauthProvider) {
    throw new Error('oauthProvider 가 없습니다.');
  }
  if (!payload.phoneVerificationToken) {
    throw new Error('phoneVerificationToken 이 없습니다.');
  }
  if (!payload.challengeToken) {
    throw new Error('challengeToken 이 없습니다.');
  }
  if (!payload.otpCode) {
    throw new Error('otpCode 가 없습니다.');
  }
  const raw = await apiPost<unknown>(AUTH_API.OAUTH_PHONE_VERIFY, payload);
  return unwrapOAuthResponse<OAuthPhoneVerifyResponse>(raw);
}
