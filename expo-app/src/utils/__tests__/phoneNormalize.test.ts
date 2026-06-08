/**
 * 휴대폰 번호 정규화·마스킹 유틸 테스트
 *
 * 네이버 검수 응답(분기 A)에서 마이페이지 휴대폰 표시 시
 * PII 마스킹 정확성을 보장한다.
 *
 * @author MindGarden
 * @since 2026-06-08
 */
import {
  maskKoreanMobileForDisplay,
  normalizeKoreanMobileDigits,
} from '../phoneNormalize';

describe('normalizeKoreanMobileDigits', () => {
  it('11자리 010 형식을 그대로 반환', () => {
    expect(normalizeKoreanMobileDigits('01012345678')).toBe('01012345678');
  });

  it('하이픈 포함 010-1234-5678 형식을 정규화', () => {
    expect(normalizeKoreanMobileDigits('010-1234-5678')).toBe('01012345678');
  });

  it('+82 국제 표기를 국내 11자리로 정규화', () => {
    expect(normalizeKoreanMobileDigits('+82 10-1234-5678')).toBe('01012345678');
  });

  it('빈 문자열·null·undefined는 undefined', () => {
    expect(normalizeKoreanMobileDigits('')).toBeUndefined();
    expect(normalizeKoreanMobileDigits(null)).toBeUndefined();
    expect(normalizeKoreanMobileDigits(undefined)).toBeUndefined();
  });

  it('휴대폰이 아닌 형식(02-xxx-xxxx)은 undefined', () => {
    expect(normalizeKoreanMobileDigits('02-123-4567')).toBeUndefined();
  });
});

describe('maskKoreanMobileForDisplay', () => {
  it('정규 11자리 휴대폰을 010-****-1234 형태로 마스킹', () => {
    expect(maskKoreanMobileForDisplay('01012345678')).toBe('010-****-5678');
  });

  it('하이픈 포함 입력도 동일하게 마스킹', () => {
    expect(maskKoreanMobileForDisplay('010-1234-5678')).toBe('010-****-5678');
  });

  it('+82 국제 표기도 국내 11자리 기준 마스킹', () => {
    expect(maskKoreanMobileForDisplay('+82 10-9876-5432')).toBe('010-****-5432');
  });

  it('011/016/017/018/019 등 다른 한국 휴대폰 prefix도 마스킹', () => {
    expect(maskKoreanMobileForDisplay('01112345678')).toBe('011-****-5678');
  });

  it('숫자 8자리 이상의 비표준 입력은 best-effort 마스킹', () => {
    expect(maskKoreanMobileForDisplay('1234-5678')).toBe('123-****-5678');
  });

  it('빈 문자열·null·undefined는 undefined', () => {
    expect(maskKoreanMobileForDisplay('')).toBeUndefined();
    expect(maskKoreanMobileForDisplay(null)).toBeUndefined();
    expect(maskKoreanMobileForDisplay(undefined)).toBeUndefined();
  });

  it('숫자가 8자리 미만이면 undefined (마스킹 의미 없음)', () => {
    expect(maskKoreanMobileForDisplay('123')).toBeUndefined();
  });

  it('절대 원본 가운데 자리를 그대로 노출하지 않는다', () => {
    const masked = maskKoreanMobileForDisplay('010-9876-5432');
    expect(masked).not.toContain('9876');
    expect(masked).toContain('****');
  });
});
