import { formatPhoneNumber } from '../common';
import {
  formatKoreanMobileForDisplay,
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits
} from '../koreanMobilePhone';

/**
 * Wave 5: SocialSignupModal / TabletRegister(등록)와 동일 SSOT.
 * 검증·정규화는 `normalizeKoreanMobileDigits` → `isValidKoreanMobileDigits` 조합을 사용한다.
 */
describe('koreanMobilePhone', () => {
  describe('isValidKoreanMobileDigits', () => {
    test('빈 문자열은 false', () => {
      expect(isValidKoreanMobileDigits('')).toBe(false);
    });

    test('너무 짧은 숫자열(01012)은 false', () => {
      expect(isValidKoreanMobileDigits('01012')).toBe(false);
    });

    test('01로 시작하지 않으면 false (12345678901)', () => {
      expect(isValidKoreanMobileDigits('12345678901')).toBe(false);
    });

    test('정상 11자리 010은 true', () => {
      expect(isValidKoreanMobileDigits('01012345678')).toBe(true);
    });
  });

  describe('normalizeKoreanMobileDigits 후 isValidKoreanMobileDigits (등록·소셜 SSOT)', () => {
    test('하이픈 입력 010-1234-5678 → 정규화 후 유효', () => {
      const normalized = normalizeKoreanMobileDigits('010-1234-5678');
      expect(normalized).toBe('01012345678');
      expect(isValidKoreanMobileDigits(normalized)).toBe(true);
    });

    test('+821012345678 스타일 → 010 접두로 정규화 후 유효', () => {
      const normalized = normalizeKoreanMobileDigits('+821012345678');
      expect(normalized).toBe('01012345678');
      expect(isValidKoreanMobileDigits(normalized)).toBe(true);
    });

    test('무효: 12345 (길이·패턴 불일치)', () => {
      const normalized = normalizeKoreanMobileDigits('12345');
      expect(normalized).toBe('12345');
      expect(isValidKoreanMobileDigits(normalized)).toBe(false);
    });

    test('무효: 0212345678 (지역번호 02, 휴대폰 패턴 아님)', () => {
      const normalized = normalizeKoreanMobileDigits('0212345678');
      expect(normalized).toBe('0212345678');
      expect(isValidKoreanMobileDigits(normalized)).toBe(false);
    });
  });

  describe('normalizeKoreanMobileDigits', () => {
    test('+82 및 공백·하이픈 제거 후 0 접두', () => {
      expect(normalizeKoreanMobileDigits('010-1234-5678')).toBe('01012345678');
      expect(normalizeKoreanMobileDigits('010 1234 5678')).toBe('01012345678');
      expect(normalizeKoreanMobileDigits('+82 10-1234-5678')).toBe('01012345678');
      expect(normalizeKoreanMobileDigits('+82 10 1234 5678')).toBe('01012345678');
    });
  });

  describe('formatKoreanMobileForDisplay', () => {
    test('11자리 휴대폰: 숫자만·하이픈 혼재 모두 010-XXXX-XXXX', () => {
      expect(formatKoreanMobileForDisplay('01012345678')).toBe('010-1234-5678');
      expect(formatKoreanMobileForDisplay('010-1234-5678')).toBe('010-1234-5678');
      expect(formatKoreanMobileForDisplay(' 01012345678 ')).toBe('010-1234-5678');
    });

    test('+82 표기', () => {
      expect(formatKoreanMobileForDisplay('+82 10-1234-5678')).toBe('010-1234-5678');
    });

    test('10자리 휴대폰(016 등): 3-3-4', () => {
      const digits = '0161234567';
      expect(isValidKoreanMobileDigits(digits)).toBe(true);
      expect(formatKoreanMobileForDisplay('016-123-4567')).toBe('016-123-4567');
      expect(formatKoreanMobileForDisplay('0161234567')).toBe('016-123-4567');
    });

    test('비휴대폰·지역번호는 trim 원문 유지', () => {
      expect(formatKoreanMobileForDisplay('02-1234-5678')).toBe('02-1234-5678');
    });

    test('null/빈 문자열', () => {
      expect(formatKoreanMobileForDisplay(null)).toBe('');
      expect(formatKoreanMobileForDisplay(undefined)).toBe('');
      expect(formatKoreanMobileForDisplay('')).toBe('');
    });
  });

  describe('formatPhoneNumber (common 위임)', () => {
    test('SSOT와 동일 결과', () => {
      expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
      expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
    });
  });
});
