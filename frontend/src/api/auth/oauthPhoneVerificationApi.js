/**
 * provider-agnostic OAuth 휴대폰 매칭(OTP) — 백엔드 API 클라이언트 (web).
 *
 * 표준 정책:
 * - 모든 호출은 {@link StandardizedApi} 를 통해서만 수행한다 (`docs/standards/API_CALL_STANDARD.md`).
 * - 직접 `fetch` / `axios` 사용 금지.
 *
 * 백엔드 경로 (Phase 3A `OAuthPhoneController`):
 * - POST /api/v1/auth/oauth/phone/send    — OTP 발송
 * - POST /api/v1/auth/oauth/phone/verify  — OTP 검증 + 매칭/로그인
 *
 * BE 응답은 `ApiResponse<T>` 래퍼 또는 평탄화된 본문 양쪽으로 올 수 있어
 * {@link unwrapEnvelope} 로 일관 처리한다 (expo `oauthAuth.ts` 와 동일 패턴).
 *
 * Phase 3C 핸드오프: `docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md`
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import StandardizedApi from '../../utils/standardizedApi';
import { AUTH_API } from '../../constants/api';

/**
 * BE `ApiResponse<T>` 봉투 또는 평탄화된 응답 양쪽 호환 unwrap.
 *
 * @param {unknown} raw
 * @returns {Object}
 */
const unwrapEnvelope = (raw) => {
  if (raw && typeof raw === 'object' && 'success' in raw && 'data' in raw) {
    const inner = raw.data;
    if (inner && typeof inner === 'object') {
      return { ...inner, success: inner.success ?? raw.success ?? true };
    }
  }
  if (raw && typeof raw === 'object') {
    return raw;
  }
  return {};
};

/**
 * OAuth 휴대폰 매칭 — OTP 발송.
 *
 * @param {{
 *   oauthProvider: string,
 *   phoneVerificationToken: string,
 *   phone: string
 * }} payload
 * @returns {Promise<{
 *   success: boolean,
 *   message?: string,
 *   code?: string,
 *   challengeToken?: string,
 *   expiresInSeconds?: number,
 *   retryAfterSeconds?: number,
 *   resendCooldownSeconds?: number,
 *   maskedPhone?: string
 * }>}
 */
export const sendOAuthPhoneOtp = async (payload) => {
  if (!payload || !payload.oauthProvider) {
    throw new Error('oauthProvider 가 없습니다.');
  }
  if (!payload.phoneVerificationToken) {
    throw new Error('phoneVerificationToken 이 없습니다.');
  }
  if (!payload.phone) {
    throw new Error('phone 이 없습니다.');
  }
  const raw = await StandardizedApi.post(AUTH_API.OAUTH_PHONE_SEND, {
    oauthProvider: String(payload.oauthProvider).toUpperCase(),
    phoneVerificationToken: payload.phoneVerificationToken,
    phone: payload.phone
  });
  return unwrapEnvelope(raw);
};

/**
 * OAuth 휴대폰 매칭 — OTP 검증 + 매칭/로그인.
 *
 * @param {{
 *   oauthProvider: string,
 *   phoneVerificationToken: string,
 *   challengeToken: string,
 *   otpCode: string
 * }} payload
 * @returns {Promise<{
 *   success: boolean,
 *   message?: string,
 *   code?: string,
 *   requiresPhoneAccountSelection?: boolean,
 *   phoneAccountSelectionToken?: string,
 *   accessToken?: string,
 *   refreshToken?: string,
 *   matchedAccount?: { userId: number, tenantId?: string, role?: string }
 * }>}
 */
export const verifyOAuthPhoneOtp = async (payload) => {
  if (!payload || !payload.oauthProvider) {
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
  const raw = await StandardizedApi.post(AUTH_API.OAUTH_PHONE_VERIFY, {
    oauthProvider: String(payload.oauthProvider).toUpperCase(),
    phoneVerificationToken: payload.phoneVerificationToken,
    challengeToken: payload.challengeToken,
    otpCode: payload.otpCode
  });
  return unwrapEnvelope(raw);
};

/**
 * Send 응답을 화면 상태 머신용 단일 객체로 매핑.
 *
 * - kind='sent' : 정상 발송 (challengeToken 보유)
 * - kind='cooldown' : 재발송 쿨다운 (retryAfterSeconds 보유)
 * - kind='error' : 그 외 실패
 *
 * @param {Object} response sendOAuthPhoneOtp 응답
 * @returns {{
 *   kind: 'sent'|'cooldown'|'error',
 *   challengeToken?: string,
 *   expiresInSeconds?: number,
 *   resendCooldownSeconds?: number,
 *   retryAfterSeconds?: number,
 *   maskedPhone?: string,
 *   code?: string,
 *   message?: string
 * }}
 */
export const mapOAuthPhoneSendResponse = (response) => {
  const safe = response && typeof response === 'object' ? response : {};
  if (safe.success && safe.challengeToken) {
    return {
      kind: 'sent',
      challengeToken: safe.challengeToken,
      expiresInSeconds: safe.expiresInSeconds,
      resendCooldownSeconds: safe.resendCooldownSeconds,
      maskedPhone: safe.maskedPhone
    };
  }
  const isCooldownCode = String(safe.code ?? '').toUpperCase() === 'RESEND_COOLDOWN';
  if (isCooldownCode || (typeof safe.retryAfterSeconds === 'number' && safe.retryAfterSeconds > 0)) {
    return {
      kind: 'cooldown',
      retryAfterSeconds: safe.retryAfterSeconds,
      maskedPhone: safe.maskedPhone,
      code: safe.code,
      message: safe.message
    };
  }
  return {
    kind: 'error',
    code: safe.code,
    message: safe.message
  };
};

/**
 * Verify 응답을 화면 상태 머신용 단일 객체로 매핑.
 *
 * - kind='authenticated' : 단일 매칭 → accessToken/refreshToken/matchedAccount 보유
 * - kind='requiresPhoneAccountSelection' : 다중 매칭 → phoneAccountSelectionToken 보유
 * - kind='error' : 그 외 실패
 *
 * @param {Object} response verifyOAuthPhoneOtp 응답
 * @returns {{
 *   kind: 'authenticated'|'requiresPhoneAccountSelection'|'error',
 *   accessToken?: string,
 *   refreshToken?: string,
 *   matchedAccount?: { userId: number, tenantId?: string, role?: string },
 *   phoneAccountSelectionToken?: string,
 *   code?: string,
 *   message?: string
 * }}
 */
export const mapOAuthPhoneVerifyResponse = (response) => {
  const safe = response && typeof response === 'object' ? response : {};
  if (safe.success && safe.requiresPhoneAccountSelection && safe.phoneAccountSelectionToken) {
    return {
      kind: 'requiresPhoneAccountSelection',
      phoneAccountSelectionToken: safe.phoneAccountSelectionToken
    };
  }
  if (safe.success && safe.accessToken && safe.matchedAccount) {
    return {
      kind: 'authenticated',
      accessToken: safe.accessToken,
      refreshToken: safe.refreshToken,
      matchedAccount: safe.matchedAccount
    };
  }
  return {
    kind: 'error',
    code: safe.code,
    message: safe.message
  };
};

export default {
  sendOAuthPhoneOtp,
  verifyOAuthPhoneOtp,
  mapOAuthPhoneSendResponse,
  mapOAuthPhoneVerifyResponse
};
