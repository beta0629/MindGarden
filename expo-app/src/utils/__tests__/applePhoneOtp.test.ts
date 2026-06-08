/**
 * Apple SIWA 휴대폰 매칭 화면 — 휴대폰 입력 검증·OTP 입력 정규화·타이머/쿨다운 단위 테스트.
 *
 * <p>화면 컴포넌트 테스트 인프라(@testing-library/react-native) 부재로, 화면
 * (`/(auth)/apple-phone-link.tsx`) 의 핵심 로직만 순수 함수로 추출하여 단위 테스트한다.
 * AS9 (휴대폰 입력 → 발송 검증), AS10 (OTP 6자리 입력), AS11 (타이머/재발송 쿨다운).</p>
 *
 * @author MindGarden
 * @since 2026-06-08
 */
import {
  APPLE_OTP_DEFAULT_EXPIRES_SECONDS,
  APPLE_OTP_RESEND_COOLDOWN_SECONDS,
  applyServerExpiresIn,
  applyServerRetryAfter,
  canResendOtp,
  formatOtpCountdown,
  tickOtpCountdown,
  validateKoreanMobileInput,
} from '@/utils/applePhoneOtp';
import {
  OTP_CODE_LENGTH,
  isOtpComplete,
  sanitizeOtpInput,
} from '@/components/molecules/otpCodeInputUtils';

describe('validateKoreanMobileInput — AS9 휴대폰 입력 1차 검증', () => {
  test('빈 입력 → 안내 메시지', () => {
    expect(validateKoreanMobileInput('')).toMatch(/입력해 주세요/);
    expect(validateKoreanMobileInput('   ')).toMatch(/입력해 주세요/);
  });

  test('11자리가 아니면 길이 안내', () => {
    expect(validateKoreanMobileInput('010')).toMatch(/11자리/);
    expect(validateKoreanMobileInput('0101234567')).toMatch(/11자리/);
    expect(validateKoreanMobileInput('010123456789')).toMatch(/11자리/);
  });

  test('11자리지만 01x 형식이 아니면 안내', () => {
    expect(validateKoreanMobileInput('02012345678')).toMatch(/01로 시작/);
    expect(validateKoreanMobileInput('01512345678')).toMatch(/01로 시작/);
  });

  test('정상 휴대폰 (010/011/016/017/018/019) — null 반환', () => {
    expect(validateKoreanMobileInput('01012345678')).toBeNull();
    expect(validateKoreanMobileInput('01112345678')).toBeNull();
    expect(validateKoreanMobileInput('01612345678')).toBeNull();
    expect(validateKoreanMobileInput('01912345678')).toBeNull();
  });

  test('하이픈·공백 포함도 정상 처리 (digit 추출)', () => {
    expect(validateKoreanMobileInput('010-1234-5678')).toBeNull();
    expect(validateKoreanMobileInput(' 010 1234 5678 ')).toBeNull();
  });
});

describe('OtpCodeInput sanitization — AS10 OTP 입력 정규화', () => {
  test('숫자만 통과, 최대 6자리', () => {
    expect(sanitizeOtpInput('a1b2c3d4e5f6g7h8')).toBe('123456');
    expect(sanitizeOtpInput('123')).toBe('123');
    expect(sanitizeOtpInput('1234567890')).toBe('123456');
  });

  test('비/특수문자 제거 후 빈 문자열 가능', () => {
    expect(sanitizeOtpInput('abcdef')).toBe('');
    expect(sanitizeOtpInput('!@#$%^')).toBe('');
  });

  test('isOtpComplete: 6자리 숫자만 true', () => {
    expect(isOtpComplete('123456')).toBe(true);
    expect(isOtpComplete('12345')).toBe(false);
    expect(isOtpComplete('1234567')).toBe(false);
    expect(isOtpComplete('12345a')).toBe(false);
    expect(isOtpComplete('')).toBe(false);
  });

  test('OTP_CODE_LENGTH 상수 = 6', () => {
    expect(OTP_CODE_LENGTH).toBe(6);
  });
});

describe('OTP 카운트다운 / 재발송 쿨다운 — AS11', () => {
  test('formatOtpCountdown: M:SS 형식 + 음수 안전 처리', () => {
    expect(formatOtpCountdown(180)).toBe('3:00');
    expect(formatOtpCountdown(125)).toBe('2:05');
    expect(formatOtpCountdown(9)).toBe('0:09');
    expect(formatOtpCountdown(0)).toBe('0:00');
    expect(formatOtpCountdown(-5)).toBe('0:00');
    expect(formatOtpCountdown(60)).toBe('1:00');
  });

  test('tickOtpCountdown: 1초 감소 + 만료 도래 시 expired=true', () => {
    expect(tickOtpCountdown(180)).toEqual({ next: 179, expired: false });
    expect(tickOtpCountdown(2)).toEqual({ next: 1, expired: false });
    expect(tickOtpCountdown(1)).toEqual({ next: 0, expired: true });
    expect(tickOtpCountdown(0)).toEqual({ next: 0, expired: true });
    expect(tickOtpCountdown(-3)).toEqual({ next: 0, expired: true });
  });

  test('canResendOtp: 쿨다운 0 + busy false 일 때만 true', () => {
    expect(canResendOtp(0, false)).toBe(true);
    expect(canResendOtp(0, true)).toBe(false);
    expect(canResendOtp(5, false)).toBe(false);
    expect(canResendOtp(5, true)).toBe(false);
    expect(canResendOtp(-1, false)).toBe(true);
  });

  test('applyServerRetryAfter: 양수면 그대로, 없거나 0이면 기본 60s', () => {
    expect(applyServerRetryAfter(45)).toBe(45);
    expect(applyServerRetryAfter(undefined)).toBe(APPLE_OTP_RESEND_COOLDOWN_SECONDS);
    expect(applyServerRetryAfter(0)).toBe(APPLE_OTP_RESEND_COOLDOWN_SECONDS);
    expect(applyServerRetryAfter(-5)).toBe(APPLE_OTP_RESEND_COOLDOWN_SECONDS);
  });

  test('applyServerExpiresIn: 양수면 그대로, 없거나 0이면 기본 180s', () => {
    expect(applyServerExpiresIn(150)).toBe(150);
    expect(applyServerExpiresIn(undefined)).toBe(APPLE_OTP_DEFAULT_EXPIRES_SECONDS);
    expect(applyServerExpiresIn(0)).toBe(APPLE_OTP_DEFAULT_EXPIRES_SECONDS);
  });

  test('타이머 시뮬레이션: 3틱 후 남은시간 = expires - 3', () => {
    let remain = applyServerExpiresIn(180);
    for (let i = 0; i < 3; i += 1) {
      remain = tickOtpCountdown(remain).next;
    }
    expect(remain).toBe(177);
  });

  test('재발송 쿨다운 시뮬레이션: 60초 카운트다운 후 재발송 가능', () => {
    let cooldown = APPLE_OTP_RESEND_COOLDOWN_SECONDS;
    expect(canResendOtp(cooldown, false)).toBe(false);
    for (let i = 0; i < APPLE_OTP_RESEND_COOLDOWN_SECONDS; i += 1) {
      cooldown = tickOtpCountdown(cooldown).next;
    }
    expect(cooldown).toBe(0);
    expect(canResendOtp(cooldown, false)).toBe(true);
  });
});
