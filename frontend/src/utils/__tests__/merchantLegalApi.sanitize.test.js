/**
 * sanitizeMerchantLegalGuideText — [분] 전용 치환, 가격·상품 대괄호 보존
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import {
  extractMerchantLegalFromTenantPayload,
  sanitizeMerchantLegalGuideText
} from '../merchantLegalApi';

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

  test('단독 [분] 만 치환하고 다른 대괄호 토큰은 보존', () => {
    const out = sanitizeMerchantLegalGuideText('기본 [분] / 패키지 [회수] 안내');
    expect(out).toContain('회기당 시간(분 단위)');
    expect(out).toContain('[회수]');
    expect(out).not.toMatch(/\[분\]/);
  });

  test('[50,000원]·[기본상담]·[10회 패키지] 는 보존', () => {
    const input = '[기본상담] [50,000원] [10회 패키지]';
    expect(sanitizeMerchantLegalGuideText(input)).toBe(input);
  });

  test('null/undefined → 빈 문자열, 정상 한국어 문구는 유지', () => {
    expect(sanitizeMerchantLegalGuideText(null)).toBe('');
    expect(sanitizeMerchantLegalGuideText(undefined)).toBe('');
    expect(sanitizeMerchantLegalGuideText('환불은 7일 이내 가능합니다.')).toBe(
      '환불은 7일 이내 가능합니다.'
    );
  });

  test('extractMerchantLegalFromTenantPayload 도 [분]만 정리하고 가격 대괄호 보존', () => {
    const legal = extractMerchantLegalFromTenantPayload({
      merchantLegal: {
        refundPolicyText: '시간: [분] 분',
        productPriceGuideText: '[기본상담] [50,000원] [10회 패키지]'
      }
    });
    expect(legal.refundPolicyText).toBe('시간: 회기당 시간(분 단위)');
    expect(legal.productPriceGuideText).toBe('[기본상담] [50,000원] [10회 패키지]');
  });
});
