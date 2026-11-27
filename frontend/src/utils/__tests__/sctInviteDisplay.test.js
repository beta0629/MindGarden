/**
 * SCT 초대 표시 유틸 단위 테스트
 *
 * @author MindGarden
 * @since 2026-11-27
 */

import {
  formatSctExpiryUntil,
  formatSctKoreanDateTime,
  maskKoreanName,
  resolveSctInviteQrUrl,
  toSctTelHref
} from '../sctInviteDisplay';

describe('maskKoreanName', () => {
  test('2자 → 김*', () => {
    expect(maskKoreanName('김수')).toBe('김*');
  });

  test('3자 → 예*자', () => {
    expect(maskKoreanName('예인자')).toBe('예*자');
  });

  test('4자 이상 → 첫·끝 유지', () => {
    expect(maskKoreanName('남궁민서')).toBe('남**서');
    expect(maskKoreanName('남궁민서윤아림정한솔예린')).toBe(`남${'*'.repeat(10)}린`);
  });

  test('빈 값', () => {
    expect(maskKoreanName('')).toBe('');
    expect(maskKoreanName(null)).toBe('');
  });
});

describe('formatSctKoreanDateTime', () => {
  test('요일 없이 월·일·시·분', () => {
    const label = formatSctKoreanDateTime('2026-12-09T23:59:00');
    expect(label).toBe('12월 9일 23:59');
    expect(label).not.toMatch(/요일|월요|화요|수요|목요|금요|토요|일요|\(수\)/);
  });

  test('expiry until suffix', () => {
    expect(formatSctExpiryUntil('2026-12-09T23:59:00')).toBe('12월 9일 23:59까지');
  });
});

describe('resolveSctInviteQrUrl', () => {
  test('absoluteShortUrl 우선', () => {
    expect(resolveSctInviteQrUrl({
      absoluteShortUrl: 'https://example.com/s/abc',
      absoluteUrl: 'https://example.com/public/sct/tok',
      publicUrl: '/public/sct/tok'
    })).toBe('https://example.com/s/abc');
  });

  test('short 없으면 absoluteUrl', () => {
    expect(resolveSctInviteQrUrl({
      absoluteUrl: 'https://example.com/public/sct/tok',
      publicUrl: '/public/sct/tok'
    })).toBe('https://example.com/public/sct/tok');
  });

  test('상대 경로 + origin', () => {
    expect(resolveSctInviteQrUrl(
      { shortUrl: '/s/abc' },
      'https://mindgarden.example'
    )).toBe('https://mindgarden.example/s/abc');
  });
});

describe('toSctTelHref', () => {
  test('하이픈 제거', () => {
    expect(toSctTelHref('02-0000-1111')).toBe('tel:0200001111');
  });

  test('빈 값', () => {
    expect(toSctTelHref('')).toBe('');
  });
});
