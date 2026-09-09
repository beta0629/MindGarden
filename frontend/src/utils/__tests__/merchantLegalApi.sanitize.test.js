/**
 * sanitizeMerchantLegalGuideText — 안내 문구 자리표시자 정리
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import { sanitizeMerchantLegalGuideText } from '../merchantLegalApi';

describe('sanitizeMerchantLegalGuideText', () => {
  test('1회기 시간: [분] 분 → 회기당 시간(분 단위)', () => {
    const input = '- 1회기 시간: [분] 분';
    const out = sanitizeMerchantLegalGuideText(input);
    expect(out).toBe('- 1회기 시간: 회기당 시간(분 단위)');
    expect(out).not.toMatch(/\[분\]/);
    expect(out).not.toMatch(/［분］/);
  });

  test('전각 ［분］ 도 동일 치환', () => {
    const out = sanitizeMerchantLegalGuideText('시간: ［분］ 분');
    expect(out).toBe('시간: 회기당 시간(분 단위)');
  });

  test('단독 [분] 및 기타 [토큰] 제거', () => {
    const out = sanitizeMerchantLegalGuideText('기본 [분] / 패키지 [회수] 안내');
    expect(out).not.toMatch(/\[/);
    expect(out).not.toMatch(/\]/);
    expect(out).toContain('회기당 시간(분 단위)');
    expect(out).toContain('기본');
    expect(out).toContain('패키지');
    expect(out).toContain('안내');
  });

  test('null/undefined → 빈 문자열, 정상 문구는 유지', () => {
    expect(sanitizeMerchantLegalGuideText(null)).toBe('');
    expect(sanitizeMerchantLegalGuideText(undefined)).toBe('');
    expect(sanitizeMerchantLegalGuideText('환불은 7일 이내 가능합니다.')).toBe(
      '환불은 7일 이내 가능합니다.'
    );
  });
});
