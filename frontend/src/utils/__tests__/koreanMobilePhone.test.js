import { formatPhoneNumber } from '../common';
import {
  formatKoreanMobileForDisplay,
  isValidKoreanMobileDigits,
  normalizeKoreanMobileDigits
} from '../koreanMobilePhone';

describe('koreanMobilePhone', () => {
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
