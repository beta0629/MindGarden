/**
 * Apple SIWA 휴대폰 인증 — 화면 타이머·재발송 쿨다운 로직.
 *
 * <p>화면(`/(auth)/apple-phone-link`) 의 핵심 로직 일부를 순수 함수로 추출하여 단위 테스트
 * 가능하게 한다. React Native 컴포넌트 테스트 인프라(@testing-library/react-native)를 추가
 * 도입하지 않고도 타이머·쿨다운·검증 동작을 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */

/** 기본 OTP 만료 시간(초) — BE 응답에 `expiresInSeconds` 가 없을 때 fallback */
export const APPLE_OTP_DEFAULT_EXPIRES_SECONDS = 180;
/** 재발송 쿨다운(초) — 발송 후 다시 보낼 수 있을 때까지 */
export const APPLE_OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * 남은 초를 `M:SS` 형식으로 표시.
 * `120` → `2:00`, `9` → `0:09`, `<=0` → `0:00`.
 */
export function formatOtpCountdown(remainingSeconds: number): string {
  const safe = Math.max(0, Math.floor(remainingSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 카운트다운 1초 감소(0 미만 방지). 만료 도래 여부 동시 반환.
 */
export function tickOtpCountdown(remainingSeconds: number): {
  next: number;
  expired: boolean;
} {
  const next = Math.max(0, remainingSeconds - 1);
  return { next, expired: next === 0 };
}

/**
 * 재발송 가능 여부 판정.
 * @param resendCooldownSeconds 남은 쿨다운(초). 0 이하면 재발송 가능.
 * @param busy 현재 발송/검증 중 여부 — 진행 중이면 불가
 */
export function canResendOtp(resendCooldownSeconds: number, busy: boolean): boolean {
  return !busy && resendCooldownSeconds <= 0;
}

/**
 * BE `retryAfterSeconds` 응답을 받아 다음 쿨다운으로 적용한다.
 * (BE 응답이 우선 — 우리 클라이언트의 기본 60s 보다 BE 가 길게 줄 수 있음)
 */
export function applyServerRetryAfter(
  serverRetryAfterSeconds: number | undefined,
  fallback = APPLE_OTP_RESEND_COOLDOWN_SECONDS,
): number {
  if (typeof serverRetryAfterSeconds === 'number' && serverRetryAfterSeconds > 0) {
    return Math.floor(serverRetryAfterSeconds);
  }
  return fallback;
}

/**
 * BE `expiresInSeconds` 응답을 받아 다음 만료 타이머로 적용한다.
 */
export function applyServerExpiresIn(
  serverExpiresInSeconds: number | undefined,
  fallback = APPLE_OTP_DEFAULT_EXPIRES_SECONDS,
): number {
  if (typeof serverExpiresInSeconds === 'number' && serverExpiresInSeconds > 0) {
    return Math.floor(serverExpiresInSeconds);
  }
  return fallback;
}

/**
 * 휴대폰 번호 입력 검증 — 11자리 한국 휴대폰 1차 클라이언트 검증.
 * BE 도 재검증하므로 실패 시 사용자 친화 메시지만 반환.
 *
 * @returns null = OK, string = 에러 메시지
 */
export function validateKoreanMobileInput(rawInput: string): string | null {
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
