/**
 * clientCheckoutRefundNotice — 결제 전 환불 차감 요약 헬퍼
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import {
  CLIENT_CHECKOUT_REFUND_COPY,
  CLIENT_REFUND_NOTICE
} from '../../constants/clientMallConstants';
import {
  buildCheckoutRefundDeductionLines,
  firstRefundSentences,
  resolveSingleSessionRegularPriceMinor
} from '../clientCheckoutRefundNotice';
import fs from 'fs';
import path from 'path';

describe('clientCheckoutRefundNotice', () => {
  test('firstRefundSentences mirrors BE 다./요. split (limit 2)', () => {
    expect(
      firstRefundSentences('첫째 문장입니다. 둘째 문장이에요. 셋째는 버려요.', 2)
    ).toBe('첫째 문장입니다. 둘째 문장이에요.');
    expect(firstRefundSentences('   ', 2)).toBe('');
    expect(firstRefundSentences(null, 2)).toBe('');
  });

  test('(a) refundPolicyText 있으면 앞문장을 bullet 로 사용', () => {
    const result = buildCheckoutRefundDeductionLines({
      refundPolicyText: '센터 환불은 7일 이내입니다. 사용 회기는 정상가로 차감해요. 나머지는 생략.'
    });
    expect(result.usedFallback).toBe(false);
    expect(result.lines).toEqual([
      '센터 환불은 7일 이내입니다.',
      '사용 회기는 정상가로 차감해요.'
    ]);
  });

  test('(b) 가격 있으면 포맷 포함 · 소스에 90000 리터럴 없음', () => {
    const priceFromData = 50_000;
    const result = buildCheckoutRefundDeductionLines({
      regularPriceMinor: priceFromData,
      formatWon: (n) => `${Number(n).toLocaleString('ko-KR')}원`
    });
    expect(result.usedFallback).toBe(false);
    expect(result.lines[0]).toContain('정상가(50,000원)');
    expect(result.lines[0]).toMatch(/할인가가 아니라 정상가\(50,000원\)로/);
    expect(result.lines[0]).not.toMatch(/원로/);
    expect(result.lines[1]).toBe(CLIENT_CHECKOUT_REFUND_COPY.DEDUCTION_CAP);

    const utilSrc = fs.readFileSync(
      path.join(__dirname, '../clientCheckoutRefundNotice.js'),
      'utf8'
    );
    const constSrc = fs.readFileSync(
      path.join(__dirname, '../../constants/clientMallConstants.js'),
      'utf8'
    );
    expect(utilSrc).not.toMatch(/90000/);
    expect(utilSrc).not.toMatch(/90,000/);
    expect(constSrc).not.toMatch(/90000/);
    expect(constSrc).not.toMatch(/90,000/);
  });

  test('(c) 가격 없으면 「정상가 기준」', () => {
    const result = buildCheckoutRefundDeductionLines({
      regularPriceMinor: null,
      formatWon: (n) => `${n}원`
    });
    expect(result.usedFallback).toBe(false);
    expect(result.lines[0]).toContain(CLIENT_CHECKOUT_REFUND_COPY.PRICE_LABEL_FALLBACK);
    expect(result.lines[1]).toBe(CLIENT_CHECKOUT_REFUND_COPY.DEDUCTION_CAP);
  });

  test('(d) 값 없으면 fallback CLIENT_REFUND_NOTICE', () => {
    const result = buildCheckoutRefundDeductionLines({});
    expect(result.usedFallback).toBe(true);
    expect(result.lines).toEqual([CLIENT_REFUND_NOTICE]);
  });

  test('resolveSingleSessionRegularPriceMinor — packages sessions===1', () => {
    expect(resolveSingleSessionRegularPriceMinor({
      consultationPackages: [
        { name: '10회기', sessions: 10, price: 800000 },
        { name: '단회기', sessions: 1, price: 55000 }
      ],
      catalogSkus: []
    })).toBe(55000);
  });

  test('resolveSingleSessionRegularPriceMinor — name 단회 + catalog fallback', () => {
    expect(resolveSingleSessionRegularPriceMinor({
      consultationPackages: [{ name: '단회 상담', price: 44000 }],
      catalogSkus: []
    })).toBe(44000);

    expect(resolveSingleSessionRegularPriceMinor({
      consultationPackages: [],
      catalogSkus: [
        { title: '10회', sessionCount: 10, unitPriceMinor: 800000 },
        { title: '단회기', sessionCount: 1, unitPriceMinor: 33000 }
      ]
    })).toBe(33000);

    expect(resolveSingleSessionRegularPriceMinor({
      consultationPackages: [],
      catalogSkus: []
    })).toBeNull();
  });
});
