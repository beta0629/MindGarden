/**
 * provider-agnostic OAuth 휴대폰 인증 — Web 전용 OTP 카운트다운·재발송 쿨다운·provider 표시 헬퍼.
 *
 * 동작 의도는 expo-app `src/utils/oauthPhoneOtp.ts` 와 동일 SSOT 를 유지한다.
 * (시각·인터랙션 회귀 zero 목표 — 디폴트 값·메시지 카피 동일)
 *
 * BE 응답 매핑은 `frontend/src/api/oauthPhoneVerification.js` 가 담당하고,
 * 본 모듈은 순수 함수만 노출한다 (DOM·React 의존 없음 — 테스트 용이).
 *
 * @author MindGarden
 * @since 2026-06-09
 */

/** 기본 OTP 만료 시간(초) — BE 응답에 `expiresInSeconds` 가 없을 때 fallback. */
export const OAUTH_OTP_DEFAULT_EXPIRES_SECONDS = 180;

/** 재발송 쿨다운(초) — 발송 후 다시 보낼 수 있을 때까지. */
export const OAUTH_OTP_RESEND_COOLDOWN_SECONDS = 60;

/** OTP 입력 길이(고정). */
export const OAUTH_OTP_CODE_LENGTH = 6;

/**
 * provider 식별자 → 사용자 노출 표시명 (디자이너 산출 §4).
 *
 * 한국어 표기: 카카오/네이버, 영문 그대로: Apple/Google.
 * 알 수 없는 입력은 trim 후 그대로 반환 (fallback).
 *
 * @param {string|null|undefined} provider
 * @returns {string}
 */
export function resolveOAuthProviderDisplayName(provider) {
  const normalized = String(provider ?? '').trim().toUpperCase();
  switch (normalized) {
    case 'APPLE':
      return 'Apple';
    case 'GOOGLE':
      return 'Google';
    case 'KAKAO':
      return '카카오';
    case 'NAVER':
      return '네이버';
    default:
      return String(provider ?? '').trim();
  }
}

/**
 * 입력값이 지원되는 OAuth provider 인지 안전 변환 (UI 진입 가드).
 *
 * @param {string|null|undefined} raw
 * @returns {('APPLE'|'GOOGLE'|'KAKAO'|'NAVER'|null)}
 */
export function parseOAuthPhoneProvider(raw) {
  const normalized = String(raw ?? '').trim().toUpperCase();
  if (
    normalized === 'APPLE' ||
    normalized === 'GOOGLE' ||
    normalized === 'KAKAO' ||
    normalized === 'NAVER'
  ) {
    return normalized;
  }
  return null;
}

/**
 * 남은 초를 `M:SS` 형식으로 표시. (`120` → `2:00`, `9` → `0:09`, `<=0` → `0:00`)
 *
 * @param {number} remainingSeconds
 * @returns {string}
 */
export function formatOAuthOtpCountdown(remainingSeconds) {
  const safe = Math.max(0, Math.floor(Number(remainingSeconds) || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 카운트다운 1초 감소(0 미만 방지). 만료 도래 여부 동시 반환.
 *
 * @param {number} remainingSeconds
 * @returns {{next: number, expired: boolean}}
 */
export function tickOAuthOtpCountdown(remainingSeconds) {
  const current = Number(remainingSeconds) || 0;
  const next = Math.max(0, current - 1);
  return { next, expired: next === 0 };
}

/**
 * 재발송 가능 여부 판정.
 *
 * @param {number} resendCooldownSeconds 남은 쿨다운(초). 0 이하면 재발송 가능
 * @param {boolean} busy 발송/검증 중 여부 — 진행 중이면 불가
 * @returns {boolean}
 */
export function canResendOAuthOtp(resendCooldownSeconds, busy) {
  return !busy && (Number(resendCooldownSeconds) || 0) <= 0;
}

/**
 * BE `retryAfterSeconds` 응답을 다음 쿨다운으로 적용. BE 가 더 길게 줄 수 있음.
 *
 * @param {number|undefined} serverRetryAfterSeconds
 * @param {number} [fallback=OAUTH_OTP_RESEND_COOLDOWN_SECONDS]
 * @returns {number}
 */
export function applyOAuthServerRetryAfter(
  serverRetryAfterSeconds,
  fallback = OAUTH_OTP_RESEND_COOLDOWN_SECONDS
) {
  if (typeof serverRetryAfterSeconds === 'number' && serverRetryAfterSeconds > 0) {
    return Math.floor(serverRetryAfterSeconds);
  }
  return fallback;
}

/**
 * BE `expiresInSeconds` 응답을 다음 만료 타이머로 적용.
 *
 * @param {number|undefined} serverExpiresInSeconds
 * @param {number} [fallback=OAUTH_OTP_DEFAULT_EXPIRES_SECONDS]
 * @returns {number}
 */
export function applyOAuthServerExpiresIn(
  serverExpiresInSeconds,
  fallback = OAUTH_OTP_DEFAULT_EXPIRES_SECONDS
) {
  if (typeof serverExpiresInSeconds === 'number' && serverExpiresInSeconds > 0) {
    return Math.floor(serverExpiresInSeconds);
  }
  return fallback;
}

/**
 * BE `resendCooldownSeconds` 응답을 다음 재발송 쿨다운으로 적용.
 *
 * @param {number|undefined} serverResendCooldownSeconds
 * @param {number} [fallback=OAUTH_OTP_RESEND_COOLDOWN_SECONDS]
 * @returns {number}
 */
export function applyOAuthServerResendCooldown(
  serverResendCooldownSeconds,
  fallback = OAUTH_OTP_RESEND_COOLDOWN_SECONDS
) {
  if (typeof serverResendCooldownSeconds === 'number' && serverResendCooldownSeconds > 0) {
    return Math.floor(serverResendCooldownSeconds);
  }
  return fallback;
}

/**
 * 휴대폰 번호 입력 검증 — 11자리 한국 휴대폰 1차 클라이언트 검증.
 * BE 도 재검증하므로 실패 시 사용자 친화 메시지만 반환.
 *
 * @param {string} rawInput
 * @returns {string|null} null = OK, string = 에러 메시지
 */
export function validateKoreanMobileInputForOAuth(rawInput) {
  const trimmed = String(rawInput ?? '').trim();
  if (!trimmed) {
    return '휴대폰 번호를 입력해 주세요.';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length !== 11) {
    return '휴대폰 번호 11자리를 입력해 주세요.';
  }
  if (!/^01[016789]\d{8}$/.test(digits)) {
    return '01로 시작하는 휴대폰 번호를 입력해 주세요.';
  }
  return null;
}

/**
 * BE 에러 코드 → 사용자 노출 카피 매핑. (디자이너 산출 §6)
 *
 * BE 가 친화적인 `message` 를 주면 그것을 우선 사용하고, 없으면 코드 기반 fallback 반환.
 *
 * @param {string|null|undefined} code
 * @param {string|null|undefined} message BE 가 함께 내려준 메시지(우선)
 * @returns {string}
 */
export function resolveOAuthOtpErrorCopy(code, message) {
  const trimmedMessage = String(message ?? '').trim();
  if (trimmedMessage) {
    return trimmedMessage;
  }
  const normalizedCode = String(code ?? '').trim().toUpperCase();
  switch (normalizedCode) {
    case 'OTP_INVALID':
      return '인증번호가 일치하지 않습니다. 다시 확인해 주세요.';
    case 'OTP_EXPIRED':
      return '인증번호가 만료되었습니다. 인증번호를 다시 받아 주세요.';
    case 'DAILY_LIMIT_EXCEEDED':
      return '오늘 인증 시도 횟수를 초과했습니다. 내일 다시 시도하거나 다른 로그인 수단을 이용해 주세요.';
    case 'TOKEN_EXPIRED':
      return '인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.';
    case 'RESEND_COOLDOWN':
      return '잠시 후 다시 시도해 주세요.';
    case 'PROVIDER_MISMATCH':
    case 'INVALID_REQUEST':
      return '요청 정보가 올바르지 않습니다. 다시 시도해 주세요.';
    case 'SEND_FAILED':
      return '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '인증 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

/**
 * 운영 PII 노출 방지용 OTP 단계 안내 마스킹 번호.
 * BE 가 `maskedPhone` 을 내려주면 그것을 우선 사용한다 (010-****-5678 포맷).
 *
 * @param {string|null|undefined} maskedPhoneFromServer
 * @param {string|null|undefined} fallbackRawPhone 마스킹 대상 raw 번호 (BE 미응답 시)
 * @returns {string}
 */
export function resolveMaskedPhoneForDisplay(maskedPhoneFromServer, fallbackRawPhone) {
  const fromServer = String(maskedPhoneFromServer ?? '').trim();
  if (fromServer) {
    return fromServer;
  }
  const raw = String(fallbackRawPhone ?? '').trim();
  if (!raw) {
    return '';
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }
  return '';
}
