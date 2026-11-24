/**
 * clientCheckoutRefundNotice — 웹 헬퍼 패리티 단위 테스트
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import {
  CLIENT_CHECKOUT_REFUND_COPY,
  CLIENT_REFUND_NOTICE,
} from '@/constants/clientCheckoutRefundCopy';
import {
  buildCheckoutRefundDeductionLines,
  firstRefundSentences,
  resolveSingleSessionRegularPriceMinor,
} from '@/utils/clientCheckoutRefundNotice';

describe('clientCheckoutRefundNotice (expo parity)', () => {
  test('firstRefundSentences keeps first two 다./요. sentences', () => {
    expect(
      firstRefundSentences('첫째 문장입니다. 둘째 문장이에요. 셋째는 버려요.', 2),
    ).toBe('첫째 문장입니다. 둘째 문장이에요.');
  });

  test('(a) refundPolicyText → 앞문장 bullets', () => {
    const result = buildCheckoutRefundDeductionLines({
      refundPolicyText: '센터 환불은 7일 이내입니다. 사용 회기는 정상가로 차감해요. 나머지는 생략.',
    });
    expect(result.usedFallback).toBe(false);
    expect(result.lines).toEqual([
      '센터 환불은 7일 이내입니다.',
      '사용 회기는 정상가로 차감해요.',
    ]);
  });

  test('(b) 가격 있으면 포맷 포함 · 90000 리터럴 없음', () => {
    const price = 50_000;
    const result = buildCheckoutRefundDeductionLines({
      regularPriceMinor: price,
      formatWon: (n) => `${n.toLocaleString('ko-KR')}원`,
    });
    expect(result.usedFallback).toBe(false);
    expect(result.lines[0]).toContain('50,000원');
    expect(result.lines[1]).toBe(CLIENT_CHECKOUT_REFUND_COPY.DEDUCTION_CAP);
    const source = JSON.stringify(result);
    expect(source).not.toMatch(/90000/);
    expect(source).not.toMatch(/90,000/);
  });

  test('(c) 가격 없으면 정상가 기준', () => {
    const result = buildCheckoutRefundDeductionLines({
      regularPriceMinor: null,
      formatWon: (n) => `${n}원`,
    });
    expect(result.usedFallback).toBe(false);
    expect(result.lines[0]).toContain(CLIENT_CHECKOUT_REFUND_COPY.PRICE_LABEL_FALLBACK);
  });

  test('(d) 값 없으면 CLIENT_REFUND_NOTICE fallback', () => {
    const result = buildCheckoutRefundDeductionLines({});
    expect(result.usedFallback).toBe(true);
    expect(result.lines).toEqual([CLIENT_REFUND_NOTICE]);
  });

  test('resolveSingleSessionRegularPriceMinor prefers consultation package', () => {
    const price = resolveSingleSessionRegularPriceMinor({
      consultationPackages: [{ name: '단회기', sessions: 1, price: 55_000 }],
      catalogSkus: [{ title: '단회기', sessionCount: 1, unitPriceMinor: 40_000 }],
    });
    expect(price).toBe(55_000);
  });
});
