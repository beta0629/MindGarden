/**
 * provider-agnostic OAuth 휴대폰 OTP 유틸 단위 테스트.
 * expo-app `oauthPhoneOtp.ts` 와 동일 SSOT — 값/카피 회귀 zero 목표.
 *
 * @author MindGarden
 * @since 2026-06-09
 */

import {
  OAUTH_OTP_DEFAULT_EXPIRES_SECONDS,
  OAUTH_OTP_RESEND_COOLDOWN_SECONDS,
  OAUTH_OTP_CODE_LENGTH,
  resolveOAuthProviderDisplayName,
  parseOAuthPhoneProvider,
  formatOAuthOtpCountdown,
  tickOAuthOtpCountdown,
  canResendOAuthOtp,
  applyOAuthServerRetryAfter,
  applyOAuthServerExpiresIn,
  applyOAuthServerResendCooldown,
  validateKoreanMobileInputForOAuth,
  resolveOAuthOtpErrorCopy,
  resolveMaskedPhoneForDisplay
} from '../oauthPhoneOtp';

describe('oauthPhoneOtp', () => {
  describe('상수 SSOT (expo 와 동일 값)', () => {
    test('기본 만료 = 180s, 재발송 쿨다운 = 60s, OTP 길이 = 6', () => {
      expect(OAUTH_OTP_DEFAULT_EXPIRES_SECONDS).toBe(180);
      expect(OAUTH_OTP_RESEND_COOLDOWN_SECONDS).toBe(60);
      expect(OAUTH_OTP_CODE_LENGTH).toBe(6);
    });
  });

  describe('resolveOAuthProviderDisplayName', () => {
    test.each([
      ['APPLE', 'Apple'],
      ['GOOGLE', 'Google'],
      ['KAKAO', '카카오'],
      ['NAVER', '네이버'],
      ['apple', 'Apple'],
      [' naver ', '네이버']
    ])('%s → %s', (input, expected) => {
      expect(resolveOAuthProviderDisplayName(input)).toBe(expected);
    });

    test('알 수 없는 입력은 trim 반환 (fallback)', () => {
      expect(resolveOAuthProviderDisplayName('FOO ')).toBe('FOO');
      expect(resolveOAuthProviderDisplayName('')).toBe('');
      expect(resolveOAuthProviderDisplayName(null)).toBe('');
      expect(resolveOAuthProviderDisplayName(undefined)).toBe('');
    });
  });

  describe('parseOAuthPhoneProvider', () => {
    test('지원되는 4종 (대소문자/공백 무시)', () => {
      expect(parseOAuthPhoneProvider('APPLE')).toBe('APPLE');
      expect(parseOAuthPhoneProvider('google')).toBe('GOOGLE');
      expect(parseOAuthPhoneProvider(' kakao ')).toBe('KAKAO');
      expect(parseOAuthPhoneProvider('NaVeR')).toBe('NAVER');
    });

    test('지원되지 않는 입력은 null', () => {
      expect(parseOAuthPhoneProvider('FACEBOOK')).toBeNull();
      expect(parseOAuthPhoneProvider('')).toBeNull();
      expect(parseOAuthPhoneProvider(null)).toBeNull();
    });
  });

  describe('formatOAuthOtpCountdown', () => {
    test.each([
      [120, '2:00'],
      [9, '0:09'],
      [60, '1:00'],
      [0, '0:00'],
      [-5, '0:00'],
      [125, '2:05']
    ])('%d → %s', (input, expected) => {
      expect(formatOAuthOtpCountdown(input)).toBe(expected);
    });

    test('NaN / null 는 0:00', () => {
      expect(formatOAuthOtpCountdown(NaN)).toBe('0:00');
      expect(formatOAuthOtpCountdown(null)).toBe('0:00');
    });
  });

  describe('tickOAuthOtpCountdown', () => {
    test('1초 감소, expired=false', () => {
      expect(tickOAuthOtpCountdown(10)).toEqual({ next: 9, expired: false });
    });

    test('마지막 틱 시 expired=true', () => {
      expect(tickOAuthOtpCountdown(1)).toEqual({ next: 0, expired: true });
    });

    test('이미 0 이면 0 유지 + expired=true', () => {
      expect(tickOAuthOtpCountdown(0)).toEqual({ next: 0, expired: true });
    });
  });

  describe('canResendOAuthOtp', () => {
    test('busy=false + cooldown<=0 일 때만 true', () => {
      expect(canResendOAuthOtp(0, false)).toBe(true);
      expect(canResendOAuthOtp(-1, false)).toBe(true);
      expect(canResendOAuthOtp(5, false)).toBe(false);
      expect(canResendOAuthOtp(0, true)).toBe(false);
      expect(canResendOAuthOtp(5, true)).toBe(false);
    });
  });

  describe('apply*Server* (BE 응답 적용)', () => {
    test('applyOAuthServerRetryAfter: 양수면 floor, 아니면 fallback', () => {
      expect(applyOAuthServerRetryAfter(30)).toBe(30);
      expect(applyOAuthServerRetryAfter(30.7)).toBe(30);
      expect(applyOAuthServerRetryAfter(0)).toBe(60);
      expect(applyOAuthServerRetryAfter(undefined)).toBe(60);
      expect(applyOAuthServerRetryAfter(null)).toBe(60);
    });

    test('applyOAuthServerExpiresIn: 양수면 floor, 아니면 180s', () => {
      expect(applyOAuthServerExpiresIn(300)).toBe(300);
      expect(applyOAuthServerExpiresIn(0)).toBe(180);
      expect(applyOAuthServerExpiresIn(undefined)).toBe(180);
    });

    test('applyOAuthServerResendCooldown: 양수면 floor, 아니면 60s', () => {
      expect(applyOAuthServerResendCooldown(90)).toBe(90);
      expect(applyOAuthServerResendCooldown(undefined)).toBe(60);
    });

    test('커스텀 fallback 적용', () => {
      expect(applyOAuthServerExpiresIn(undefined, 240)).toBe(240);
      expect(applyOAuthServerRetryAfter(undefined, 30)).toBe(30);
    });
  });

  describe('validateKoreanMobileInputForOAuth', () => {
    test('빈 입력 → 친화 메시지', () => {
      expect(validateKoreanMobileInputForOAuth('')).toBe('휴대폰 번호를 입력해 주세요.');
      expect(validateKoreanMobileInputForOAuth(null)).toBe('휴대폰 번호를 입력해 주세요.');
    });

    test('11자리 미달/초과 → 길이 오류', () => {
      expect(validateKoreanMobileInputForOAuth('010')).toBe(
        '휴대폰 번호 11자리를 입력해 주세요.'
      );
      expect(validateKoreanMobileInputForOAuth('010123456789')).toBe(
        '휴대폰 번호 11자리를 입력해 주세요.'
      );
    });

    test('01x 패턴 위반 → 패턴 오류', () => {
      expect(validateKoreanMobileInputForOAuth('02012345678')).toBe(
        '01로 시작하는 휴대폰 번호를 입력해 주세요.'
      );
      expect(validateKoreanMobileInputForOAuth('12345678901')).toBe(
        '01로 시작하는 휴대폰 번호를 입력해 주세요.'
      );
    });

    test('정상 휴대폰 (010 / 016 / 011)', () => {
      expect(validateKoreanMobileInputForOAuth('01012345678')).toBeNull();
      expect(validateKoreanMobileInputForOAuth('010-1234-5678')).toBeNull();
      expect(validateKoreanMobileInputForOAuth('016-1234-5678')).toBeNull();
    });
  });

  describe('resolveOAuthOtpErrorCopy', () => {
    test('BE message 가 있으면 우선 사용', () => {
      expect(resolveOAuthOtpErrorCopy('OTP_INVALID', '직접 정의한 메시지')).toBe(
        '직접 정의한 메시지'
      );
    });

    test.each([
      ['OTP_INVALID', '인증번호가 일치하지 않습니다. 다시 확인해 주세요.'],
      ['OTP_EXPIRED', '인증번호가 만료되었습니다. 인증번호를 다시 받아 주세요.'],
      [
        'DAILY_LIMIT_EXCEEDED',
        '오늘 인증 시도 횟수를 초과했습니다. 내일 다시 시도하거나 다른 로그인 수단을 이용해 주세요.'
      ],
      ['TOKEN_EXPIRED', '인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.'],
      ['RESEND_COOLDOWN', '잠시 후 다시 시도해 주세요.'],
      ['PROVIDER_MISMATCH', '요청 정보가 올바르지 않습니다. 다시 시도해 주세요.'],
      ['INVALID_REQUEST', '요청 정보가 올바르지 않습니다. 다시 시도해 주세요.'],
      ['SEND_FAILED', '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.']
    ])('%s 코드 fallback 카피', (code, expected) => {
      expect(resolveOAuthOtpErrorCopy(code, undefined)).toBe(expected);
    });

    test('알 수 없는 코드 + 메시지 없음 → 기본 카피', () => {
      expect(resolveOAuthOtpErrorCopy('UNKNOWN', null)).toBe(
        '인증 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.'
      );
    });
  });

  describe('resolveMaskedPhoneForDisplay (PII)', () => {
    test('BE maskedPhone 우선', () => {
      expect(resolveMaskedPhoneForDisplay('010-****-5678', '01099991234')).toBe(
        '010-****-5678'
      );
    });

    test('BE 없으면 raw 에서 마스킹 생성', () => {
      expect(resolveMaskedPhoneForDisplay(null, '01012345678')).toBe('010-****-5678');
      expect(resolveMaskedPhoneForDisplay(undefined, '010-1234-5678')).toBe(
        '010-****-5678'
      );
    });

    test('raw 가 너무 짧으면 빈 문자열 (PII 노출 방지)', () => {
      expect(resolveMaskedPhoneForDisplay(null, '123')).toBe('');
      expect(resolveMaskedPhoneForDisplay(null, '')).toBe('');
      expect(resolveMaskedPhoneForDisplay(null, null)).toBe('');
    });
  });
});
