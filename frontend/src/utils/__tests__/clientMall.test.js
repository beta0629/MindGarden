/**
 * clientMall — 가격·이용기간·장바구니 요약·결제 게이트 순수 로직
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  MALL_PAY_BLOCK,
  addMonthsClamped,
  buildCartFromGuestLines,
  buildValidityExampleText,
  formatMallCountdown,
  formatMallDotDate,
  formatMallPhoneInput,
  formatMallWon,
  maskMallPhone,
  resolveMallPayBlock,
  resolveMallPayBlockMessage,
  resolvePerSessionMinor,
  resolveValidityMonths,
  summarizeMallCart
} from '../clientMall';
import { CLIENT_MALL_CHECKOUT_COPY } from '../../constants/clientMallConstants';

describe('clientMall price', () => {
  test('N원 표기 (₩ 없음)', () => {
    expect(formatMallWon(850000)).toBe('850,000원');
    expect(formatMallWon(null)).toBe('0원');
  });

  test('회당 단가는 2회기 이상일 때만', () => {
    expect(resolvePerSessionMinor(850000, 10)).toBe(85000);
    expect(resolvePerSessionMinor(90000, 1)).toBeNull();
  });
});

describe('clientMall validity', () => {
  test('validityMonths 는 양의 정수만', () => {
    expect(resolveValidityMonths({ validityMonths: 3 })).toBe(3);
    expect(resolveValidityMonths({ validityMonths: '12' })).toBe(12);
    expect(resolveValidityMonths({ validityMonths: 0 })).toBeNull();
    expect(resolveValidityMonths({})).toBeNull();
  });

  test('결제일 + N개월 (말일 보정)', () => {
    expect(formatMallDotDate(addMonthsClamped(new Date(2026, 8, 28), 3))).toBe('2026.12.28');
    expect(formatMallDotDate(addMonthsClamped(new Date(2026, 0, 31), 1))).toBe('2026.02.28');
  });

  test('예시 날짜 문장 — 해가 바뀌면 연도 표기', () => {
    expect(buildValidityExampleText(3, new Date(2026, 8, 28)))
      .toBe('예: 9월 28일 결제 시 12월 28일까지 사용 가능(당일 포함)');
    expect(buildValidityExampleText(12, new Date(2026, 8, 28)))
      .toBe('예: 9월 28일 결제 시 2027년 9월 28일까지 사용 가능(당일 포함)');
  });
});

describe('clientMall cart summary', () => {
  const catalog = [
    { skuCode: 'A', title: '10회기 패키지', unitPriceMinor: 850000, sessionCount: 10, validityMonths: 3 },
    { skuCode: 'B', title: '단회기', unitPriceMinor: 90000, sessionCount: 1, validityMonths: 3 },
    { skuCode: 'C', title: '20회기', unitPriceMinor: 1600000, sessionCount: 20, validityMonths: 12 }
  ];

  test('게스트 줄을 카탈로그로 채운다 (카탈로그에 없는 SKU 제외)', () => {
    const cart = buildCartFromGuestLines(
      [{ skuCode: 'A', quantity: 1 }, { skuCode: 'Z', quantity: 2 }],
      catalog
    );
    expect(cart.lines).toHaveLength(1);
    expect(cart.subtotalMinor).toBe(850000);
  });

  test('공통 이용기간 · 혼합 · 받는 회기', () => {
    const same = summarizeMallCart(
      { lines: [{ skuCode: 'A', quantity: 1, sessionCount: 10 }, { skuCode: 'B', quantity: 2, sessionCount: 1 }], subtotalMinor: 1030000 },
      catalog
    );
    expect(same).toMatchObject({ quantity: 3, totalSessions: 12, validityMonths: 3, mixedValidity: false });

    const mixed = summarizeMallCart(
      { lines: [{ skuCode: 'A', quantity: 1, sessionCount: 10 }, { skuCode: 'C', quantity: 1, sessionCount: 20 }] },
      catalog
    );
    expect(mixed.validityMonths).toBeNull();
    expect(mixed.mixedValidity).toBe(true);
    expect(summarizeMallCart({ lines: [] }).isEmpty).toBe(true);
  });
});

describe('clientMall pay gate (§5.8)', () => {
  test('인증 + 전체 동의 둘 다 있어야 활성', () => {
    expect(resolveMallPayBlock({ phoneVerified: false, allAgreed: false })).toBe(MALL_PAY_BLOCK.BOTH);
    expect(resolveMallPayBlock({ phoneVerified: false, allAgreed: true })).toBe(MALL_PAY_BLOCK.PHONE);
    expect(resolveMallPayBlock({ phoneVerified: true, allAgreed: false })).toBe(MALL_PAY_BLOCK.AGREEMENT);
    expect(resolveMallPayBlock({ phoneVerified: true, allAgreed: true })).toBe(MALL_PAY_BLOCK.NONE);
  });

  test('비활성 이유 문구', () => {
    expect(resolveMallPayBlockMessage(MALL_PAY_BLOCK.BOTH)).toBe(CLIENT_MALL_CHECKOUT_COPY.BLOCK_BOTH);
    expect(resolveMallPayBlockMessage(MALL_PAY_BLOCK.NONE)).toBe('');
  });
});

describe('clientMall phone display', () => {
  test('마스킹 · 입력 하이픈 · 카운트다운', () => {
    expect(maskMallPhone('01012341234')).toBe('010-****-1234');
    expect(formatMallPhoneInput('0101234')).toBe('010-1234');
    expect(formatMallPhoneInput('01012341234')).toBe('010-1234-1234');
    expect(formatMallCountdown(272)).toBe('4:32');
  });
});
