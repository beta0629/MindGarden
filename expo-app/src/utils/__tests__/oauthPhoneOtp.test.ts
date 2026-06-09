/**
 * provider-agnostic OAuth 휴대폰 인증 — 화면 유틸 단위 테스트.
 *
 * <p>화면(`/(auth)/oauth-phone-link.tsx`) 의 핵심 로직 일부를 순수 함수로 추출하여
 * 단위 테스트한다. Apple 베이스(`applePhoneOtp.test.ts`) 와 동일한 패턴.</p>
 *
 * 검증 범위:
 *  - 휴대폰 입력 검증 (한국 11자리)
 *  - 카운트다운 포맷·tick·재발송 가능 판정
 *  - BE 서버 응답(expiresInSeconds / retryAfterSeconds / resendCooldownSeconds) 적용
 *  - provider 식별 helper (display name / parse)
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import {
  OAUTH_OTP_DEFAULT_EXPIRES_SECONDS,
  OAUTH_OTP_RESEND_COOLDOWN_SECONDS,
  applyOAuthServerExpiresIn,
  applyOAuthServerResendCooldown,
  applyOAuthServerRetryAfter,
  canResendOAuthOtp,
  formatOAuthOtpCountdown,
  parseOAuthPhoneProvider,
  resolveOAuthProviderDisplayName,
  tickOAuthOtpCountdown,
  validateKoreanMobileInputForOAuth,
} from '@/utils/oauthPhoneOtp';

describe('validateKoreanMobileInputForOAuth — 휴대폰 입력 1차 검증', () => {
  test('빈 입력 → 안내 메시지', () => {
    expect(validateKoreanMobileInputForOAuth('')).toMatch(/입력해 주세요/);
    expect(validateKoreanMobileInputForOAuth('   ')).toMatch(/입력해 주세요/);
  });

  test('11자리가 아니면 길이 안내', () => {
    expect(validateKoreanMobileInputForOAuth('010')).toMatch(/11자리/);
    expect(validateKoreanMobileInputForOAuth('0101234567')).toMatch(/11자리/);
    expect(validateKoreanMobileInputForOAuth('010123456789')).toMatch(/11자리/);
  });

  test('11자리지만 01x 형식이 아니면 안내', () => {
    expect(validateKoreanMobileInputForOAuth('02012345678')).toMatch(/01로 시작/);
    expect(validateKoreanMobileInputForOAuth('01512345678')).toMatch(/01로 시작/);
  });

  test('정상 휴대폰 (010/011/016/017/018/019) — null 반환', () => {
    expect(validateKoreanMobileInputForOAuth('01012345678')).toBeNull();
    expect(validateKoreanMobileInputForOAuth('01112345678')).toBeNull();
    expect(validateKoreanMobileInputForOAuth('01612345678')).toBeNull();
    expect(validateKoreanMobileInputForOAuth('01912345678')).toBeNull();
  });

  test('하이픈·공백 포함도 정상 처리 (digit 추출)', () => {
    expect(validateKoreanMobileInputForOAuth('010-1234-5678')).toBeNull();
    expect(validateKoreanMobileInputForOAuth(' 010 1234 5678 ')).toBeNull();
  });
});

describe('formatOAuthOtpCountdown / tickOAuthOtpCountdown / canResendOAuthOtp', () => {
  test('formatOAuthOtpCountdown: M:SS 형식 + 음수 안전 처리', () => {
    expect(formatOAuthOtpCountdown(180)).toBe('3:00');
    expect(formatOAuthOtpCountdown(125)).toBe('2:05');
    expect(formatOAuthOtpCountdown(9)).toBe('0:09');
    expect(formatOAuthOtpCountdown(0)).toBe('0:00');
    expect(formatOAuthOtpCountdown(-5)).toBe('0:00');
    expect(formatOAuthOtpCountdown(60)).toBe('1:00');
  });

  test('tickOAuthOtpCountdown: 1초 감소 + 만료 도래 시 expired=true', () => {
    expect(tickOAuthOtpCountdown(180)).toEqual({ next: 179, expired: false });
    expect(tickOAuthOtpCountdown(2)).toEqual({ next: 1, expired: false });
    expect(tickOAuthOtpCountdown(1)).toEqual({ next: 0, expired: true });
    expect(tickOAuthOtpCountdown(0)).toEqual({ next: 0, expired: true });
    expect(tickOAuthOtpCountdown(-3)).toEqual({ next: 0, expired: true });
  });

  test('canResendOAuthOtp: 쿨다운 0 + busy false 일 때만 true', () => {
    expect(canResendOAuthOtp(0, false)).toBe(true);
    expect(canResendOAuthOtp(0, true)).toBe(false);
    expect(canResendOAuthOtp(5, false)).toBe(false);
    expect(canResendOAuthOtp(5, true)).toBe(false);
    expect(canResendOAuthOtp(-1, false)).toBe(true);
  });
});

describe('applyOAuthServer* helpers — BE 응답 적용', () => {
  test('applyOAuthServerRetryAfter: 양수면 그대로, 없거나 0이면 기본 60s', () => {
    expect(applyOAuthServerRetryAfter(45)).toBe(45);
    expect(applyOAuthServerRetryAfter(undefined)).toBe(OAUTH_OTP_RESEND_COOLDOWN_SECONDS);
    expect(applyOAuthServerRetryAfter(0)).toBe(OAUTH_OTP_RESEND_COOLDOWN_SECONDS);
    expect(applyOAuthServerRetryAfter(-5)).toBe(OAUTH_OTP_RESEND_COOLDOWN_SECONDS);
  });

  test('applyOAuthServerExpiresIn: 양수면 그대로, 없거나 0이면 기본 180s', () => {
    expect(applyOAuthServerExpiresIn(150)).toBe(150);
    expect(applyOAuthServerExpiresIn(undefined)).toBe(OAUTH_OTP_DEFAULT_EXPIRES_SECONDS);
    expect(applyOAuthServerExpiresIn(0)).toBe(OAUTH_OTP_DEFAULT_EXPIRES_SECONDS);
  });

  test('applyOAuthServerResendCooldown: BE 권장값 우선, 없으면 기본 60s', () => {
    expect(applyOAuthServerResendCooldown(120)).toBe(120);
    expect(applyOAuthServerResendCooldown(undefined)).toBe(OAUTH_OTP_RESEND_COOLDOWN_SECONDS);
    expect(applyOAuthServerResendCooldown(0)).toBe(OAUTH_OTP_RESEND_COOLDOWN_SECONDS);
  });

  test('타이머 시뮬레이션: 60초 카운트다운 후 재발송 가능', () => {
    let cooldown = OAUTH_OTP_RESEND_COOLDOWN_SECONDS;
    expect(canResendOAuthOtp(cooldown, false)).toBe(false);
    for (let i = 0; i < OAUTH_OTP_RESEND_COOLDOWN_SECONDS; i += 1) {
      cooldown = tickOAuthOtpCountdown(cooldown).next;
    }
    expect(cooldown).toBe(0);
    expect(canResendOAuthOtp(cooldown, false)).toBe(true);
  });
});

describe('resolveOAuthProviderDisplayName — provider 표시명 매핑 (디자이너 §4)', () => {
  test('APPLE → "Apple", GOOGLE → "Google" (영문 그대로)', () => {
    expect(resolveOAuthProviderDisplayName('APPLE')).toBe('Apple');
    expect(resolveOAuthProviderDisplayName('GOOGLE')).toBe('Google');
  });

  test('KAKAO → "카카오", NAVER → "네이버" (한국어 표기)', () => {
    expect(resolveOAuthProviderDisplayName('KAKAO')).toBe('카카오');
    expect(resolveOAuthProviderDisplayName('NAVER')).toBe('네이버');
  });

  test('소문자·공백 입력도 정규화하여 매핑', () => {
    expect(resolveOAuthProviderDisplayName(' kakao ')).toBe('카카오');
    expect(resolveOAuthProviderDisplayName('Apple')).toBe('Apple');
  });

  test('알 수 없는 값 → trim 후 그대로 (fallback)', () => {
    expect(resolveOAuthProviderDisplayName(' UNKNOWN ')).toBe('UNKNOWN');
    expect(resolveOAuthProviderDisplayName('')).toBe('');
  });
});

describe('parseOAuthPhoneProvider — provider 안전 변환', () => {
  test('지원 provider → 대문자 enum 반환', () => {
    expect(parseOAuthPhoneProvider('apple')).toBe('APPLE');
    expect(parseOAuthPhoneProvider(' Naver ')).toBe('NAVER');
    expect(parseOAuthPhoneProvider('KAKAO')).toBe('KAKAO');
    expect(parseOAuthPhoneProvider('Google')).toBe('GOOGLE');
  });

  test('null·빈·미지원 → null', () => {
    expect(parseOAuthPhoneProvider(null)).toBeNull();
    expect(parseOAuthPhoneProvider(undefined)).toBeNull();
    expect(parseOAuthPhoneProvider('')).toBeNull();
    expect(parseOAuthPhoneProvider('   ')).toBeNull();
    expect(parseOAuthPhoneProvider('FACEBOOK')).toBeNull();
  });
});
