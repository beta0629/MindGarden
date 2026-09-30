/**
 * clientPaymentHistoryFormat — 결제 내역 포맷·환불 문맥·상품명·필터·합계 단위 테스트
 * 스펙: docs/design/clinic-os-client-payments.md §4·§5·§6
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import {
  buildClientPaymentCaption,
  buildClientPaymentRows,
  filterClientPaymentRows,
  formatClientPaymentSummary,
  formatPaymentDate,
  formatSessions,
  formatWon,
  normalizePage,
  normalizePeriod,
  normalizeStatusFilter,
  paginateClientPaymentRows,
  resolveClientPaymentBadge,
  resolvePaymentMethodDisplay,
  resolveProductName,
  resolveRefundContext,
  summarizeClientPaymentRows
} from '../clientPaymentHistoryFormat';
import {
  CLIENT_PAYMENT_BADGE,
  CLIENT_PAYMENT_ROW_KIND
} from '../../constants/clientPaymentHistoryConstants';

const TEXT_FIELDS = ['productName', 'sessionsText', 'amountText', 'amountSubText', 'methodText', 'channelText'];

const expectNoMinus = (row) => {
  TEXT_FIELDS.forEach((field) => {
    if (row[field] != null) {
      expect(row[field]).not.toMatch(/[-−₩]/);
    }
  });
};

/** 리더 스샷 9/30 행: 신용카드 · 수동/센터 · 환불완료 · 상품칸 「-1」 */
const REFUND_ROW_MINUS_ONE = {
  id: 930,
  packageName: '-1',
  productTitle: null,
  paymentAmount: 90000,
  paymentStatus: 'REFUNDED',
  effectivePaymentStatus: 'REFUNDED',
  paymentMethod: 'CREDIT_CARD',
  paymentSource: 'MANUAL',
  paymentProvider: null,
  totalSessions: 10,
  paymentDate: '2026-09-30T10:00:00'
};

describe('formatWon', () => {
  test('「N원」 천 단위 콤마', () => {
    expect(formatWon(90000)).toEqual({ text: '90,000원', isNegative: false });
  });

  test('음수는 절댓값 · 부호 플래그만', () => {
    expect(formatWon(-1)).toEqual({ text: '1원', isNegative: true });
    expect(formatWon('-30000')).toEqual({ text: '30,000원', isNegative: true });
  });

  test('null·NaN → 「—」 · ₩ 없음', () => {
    expect(formatWon(null).text).toBe('—');
    expect(formatWon('abc').text).toBe('—');
    expect(formatWon(1500.6).text).toBe('1,501원');
    expect(formatWon(1000).text).not.toMatch(/₩/);
  });
});

describe('formatSessions', () => {
  test('양수 「N회기」', () => {
    expect(formatSessions(10)).toBe('10회기');
  });

  test('음수·환불 문맥 「N회기 환불」 · 부호 없음', () => {
    expect(formatSessions(-10)).toBe('10회기 환불');
    expect(formatSessions(-1)).toBe('1회기 환불');
    expect(formatSessions(3, { refund: true })).toBe('3회기 환불');
  });

  test('0·null → null (줄 생략)', () => {
    expect(formatSessions(0)).toBeNull();
    expect(formatSessions(null)).toBeNull();
  });
});

describe('formatPaymentDate', () => {
  test('로컬 YYYY.MM.DD', () => {
    expect(formatPaymentDate('2026-09-30T10:00:00')).toBe('2026.09.30');
    expect(formatPaymentDate(new Date(2026, 0, 5))).toBe('2026.01.05');
  });

  test('null·잘못된 값 → 「—」', () => {
    expect(formatPaymentDate(null)).toBe('—');
    expect(formatPaymentDate('not-a-date')).toBe('—');
  });
});

describe('resolveProductName (§6-1)', () => {
  test('숫자만(「-1」)은 상품명 아님 → 「상품 정보 없음」', () => {
    expect(resolveProductName({ packageName: '-1' })).toEqual({ name: '상품 정보 없음', isFallback: true });
    expect(resolveProductName({ packageName: '1' }).isFallback).toBe(true);
    expect(resolveProductName({ packageName: '+2.5' }).isFallback).toBe(true);
  });

  test('빈 값 건너뜀 → 다음 순서', () => {
    expect(resolveProductName({ productTitle: '  ', packageName: '기본 10회기' }).name).toBe('기본 10회기');
    expect(resolveProductName({ productTitle: '-1', packageName: '기본 10회기' }).name).toBe('기본 10회기');
  });

  test('원주문 상품명이 우선', () => {
    expect(resolveProductName({ packageName: '-1' }, { productTitle: '개인상담 10회기' }).name)
      .toBe('개인상담 10회기');
  });

  test('숫자로 시작하는 정상 이름은 유지', () => {
    expect(resolveProductName({ packageName: '10회기 패키지' }).name).toBe('10회기 패키지');
  });

  test('모두 없으면 폴백 (「쇼핑 주문」 아님)', () => {
    expect(resolveProductName({}, null).name).toBe('상품 정보 없음');
  });
});

describe('resolveRefundContext (§6-3)', () => {
  test('환불 문맥 없음', () => {
    expect(resolveRefundContext({ status: 'CONFIRMED', amount: 1000 }).refund).toBe(false);
  });

  test('A: 상태만 REFUNDED → 전액 환불', () => {
    expect(resolveRefundContext({ status: 'REFUNDED', amount: 90000 })).toEqual({
      refund: true,
      partial: false,
      separateRow: false,
      paidAmount: 90000,
      refundAmount: 90000
    });
  });

  test('B: 환불액 < 결제액 → 부분환불', () => {
    const ctx = resolveRefundContext({ status: 'REFUNDED', amount: 100000, refundAmount: 30000 });
    expect(ctx.partial).toBe(true);
    expect(ctx.refundAmount).toBe(30000);
  });

  test('C/D: 음수 금액 또는 음수 회기 = 별도 환불 행', () => {
    expect(resolveRefundContext({ amount: -90000 })).toMatchObject({ refund: true, separateRow: true, partial: false });
    expect(resolveRefundContext({ amount: 0, sessions: -1 })).toMatchObject({ refund: true, separateRow: true });
    expect(resolveRefundContext({ amount: -30000, originalAmount: 100000 }))
      .toMatchObject({ partial: true, refundAmount: 30000, paidAmount: 100000 });
  });

  test('orderStatus REFUNDED 도 환불 문맥', () => {
    expect(resolveRefundContext({ status: 'CONFIRMED', orderStatus: 'REFUNDED', amount: 5000 }).refund).toBe(true);
  });
});

describe('resolveClientPaymentBadge (§4)', () => {
  const none = { refund: false, partial: false };
  const mapping = CLIENT_PAYMENT_ROW_KIND.MAPPING;

  test.each([
    ['CONFIRMED', CLIENT_PAYMENT_BADGE.COMPLETED],
    ['PAY', CLIENT_PAYMENT_BADGE.COMPLETED],
    ['DEP', CLIENT_PAYMENT_BADGE.COMPLETED],
    ['APPROVED', CLIENT_PAYMENT_BADGE.COMPLETED],
    ['PENDING', CLIENT_PAYMENT_BADGE.PENDING],
    ['REJECTED', CLIENT_PAYMENT_BADGE.FAILED],
    ['CANCELLED', CLIENT_PAYMENT_BADGE.CANCELLED]
  ])('센터 %s → %s', (status, badge) => {
    expect(resolveClientPaymentBadge(mapping, status, null, none)).toBe(badge);
  });

  test('orderStatus CANCELLED → 취소', () => {
    expect(resolveClientPaymentBadge(mapping, 'CONFIRMED', 'CANCELLED', none)).toBe(CLIENT_PAYMENT_BADGE.CANCELLED);
  });

  test('환불 문맥 우선 (부분환불 먼저)', () => {
    expect(resolveClientPaymentBadge(mapping, 'CONFIRMED', null, { refund: true, partial: true }))
      .toBe(CLIENT_PAYMENT_BADGE.PARTIAL_REFUND);
    expect(resolveClientPaymentBadge(mapping, 'REFUNDED', null, { refund: true, partial: false }))
      .toBe(CLIENT_PAYMENT_BADGE.REFUNDED);
  });

  test('온라인 PAID·REFUNDED · 모르는 값 → null', () => {
    const shop = CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER;
    expect(resolveClientPaymentBadge(shop, 'PAID', 'PAID', none)).toBe(CLIENT_PAYMENT_BADGE.COMPLETED);
    expect(resolveClientPaymentBadge(mapping, 'SOMETHING', null, none)).toBeNull();
    expect(resolveClientPaymentBadge(mapping, null, null, none)).toBeNull();
  });
});

describe('resolvePaymentMethodDisplay (§5)', () => {
  test('카드 계열 → 「카드」 (할부 정보 없음 → 「일시불」 없음)', () => {
    expect(resolvePaymentMethodDisplay('CREDIT_CARD', 'MANUAL')).toEqual({ methodText: '카드', channelText: '센터 결제' });
    expect(resolvePaymentMethodDisplay('CARD_TERMINAL', 'MANUAL').methodText).toBe('카드');
  });

  test('온라인 채널 · 대행사 이름 없음', () => {
    const shown = resolvePaymentMethodDisplay('CARD', 'ONLINE');
    expect(shown).toEqual({ methodText: '카드', channelText: '온라인' });
    expect(JSON.stringify(shown)).not.toMatch(/PortOne|일시불|아임포트|이니시스/);
  });

  test('null → 수단 없음 · UNKNOWN 채널 없음', () => {
    expect(resolvePaymentMethodDisplay(null, 'UNKNOWN')).toEqual({ methodText: null, channelText: null });
  });
});

describe('buildClientPaymentRows', () => {
  test('9/30 환불 행 「-1」 → 상품 폴백 · 절댓값 · 환불 배지 · 음수 없음', () => {
    const [row] = buildClientPaymentRows({ mappings: [REFUND_ROW_MINUS_ONE] });
    expect(row.productName).toBe('상품 정보 없음');
    expect(row.productIsFallback).toBe(true);
    expect(row.badge).toBe(CLIENT_PAYMENT_BADGE.REFUNDED);
    expect(row.badgeLabel).toBe('환불');
    expect(row.amountText).toBe('90,000원');
    expect(row.amountSubText).toBe('전액 환불');
    expect(row.methodText).toBe('카드');
    expect(row.channelText).toBe('센터 결제');
    expect(row.sessionsText).toBe('10회기');
    expect(row.dateText).toBe('2026.09.30');
    expectNoMinus(row);
  });

  test('9/30 환불 행: productTitle 이 있으면 원 상품명', () => {
    const [row] = buildClientPaymentRows({
      mappings: [{ ...REFUND_ROW_MINUS_ONE, productTitle: '개인상담 10회기' }]
    });
    expect(row.productName).toBe('개인상담 10회기');
  });

  test('별도 환불 행(-1회기 · 음수 금액) → 원결제 상품명 · 「1회기 환불」 · 부분환불 · 합계 중복 없음', () => {
    const original = {
      id: 1,
      paymentReference: 'ORD-1',
      packageName: '상담 10회기',
      paymentAmount: 100000,
      paymentStatus: 'CONFIRMED',
      paymentMethod: 'CARD',
      paymentSource: 'MANUAL',
      totalSessions: 10,
      paymentDate: '2026-09-01T09:00:00'
    };
    const refund = {
      id: 2,
      paymentReference: 'ORD-1',
      packageName: '-1',
      paymentAmount: -30000,
      paymentStatus: 'CONFIRMED',
      paymentMethod: 'CARD',
      paymentSource: 'MANUAL',
      totalSessions: -1,
      paymentDate: '2026-09-30T09:00:00'
    };
    const rows = buildClientPaymentRows({ mappings: [original, refund] });
    const refundRow = rows.find((r) => r.key === 'mapping-2');
    expect(refundRow.productName).toBe('상담 10회기');
    expect(refundRow.amountText).toBe('30,000원');
    expect(refundRow.sessionsText).toBe('1회기 환불');
    expect(refundRow.badge).toBe(CLIENT_PAYMENT_BADGE.PARTIAL_REFUND);
    expect(refundRow.amountSubText).toBe('결제 100,000원 중');
    expectNoMinus(refundRow);

    const summary = summarizeClientPaymentRows(rows);
    expect(summary).toEqual({ count: 2, paidSum: 100000, refundSum: 30000 });
  });

  test('별도 전액 환불 행 → 「{날짜} 결제분」', () => {
    const rows = buildClientPaymentRows({
      mappings: [
        { id: 1, paymentReference: 'R', packageName: 'A', paymentAmount: 50000, paymentStatus: 'CONFIRMED', paymentDate: '2026-09-01T09:00:00' },
        { id: 2, paymentReference: 'R', paymentAmount: -50000, paymentStatus: 'CONFIRMED', paymentDate: '2026-09-02T09:00:00' }
      ]
    });
    const refundRow = rows.find((r) => r.key === 'mapping-2');
    expect(refundRow.badge).toBe(CLIENT_PAYMENT_BADGE.REFUNDED);
    expect(refundRow.amountSubText).toBe('2026.09.01 결제분');
  });

  test('같은 paymentReference 양수 매핑끼리는 이름을 빌리지 않음', () => {
    const rows = buildClientPaymentRows({
      mappings: [
        { id: 1, paymentReference: 'R', packageName: 'A', paymentAmount: 1000, paymentStatus: 'CONFIRMED' },
        { id: 2, paymentReference: 'R', packageName: '', paymentAmount: 1000, paymentStatus: 'CONFIRMED' }
      ]
    });
    expect(rows.find((r) => r.key === 'mapping-2').productName).toBe('상품 정보 없음');
  });

  test('온라인 주문: PAID·REFUNDED + cashDue>0 만 · 「카드」만 · 원주문 매핑 상품명', () => {
    const rows = buildClientPaymentRows({
      mappings: [{ id: 5, paymentReference: 'pub-1', productTitle: '온라인 5회기', paymentAmount: 50000, paymentStatus: 'CONFIRMED', paymentSource: 'ONLINE', paymentMethod: 'CREDIT_CARD', totalSessions: 5 }],
      shopOrders: [
        { orderPublicId: 'pub-1', status: 'PAID', cashDueMinor: 50000, createdAt: '2026-09-20T10:00:00' },
        { orderPublicId: 'pub-2', status: 'REFUNDED', cashDueMinor: 20000, createdAt: '2026-09-21T10:00:00' },
        { orderPublicId: 'pub-3', status: 'EXPIRED', cashDueMinor: 20000, createdAt: '2026-09-22T10:00:00' },
        { orderPublicId: 'pub-4', status: 'PAID', cashDueMinor: 0, createdAt: '2026-09-23T10:00:00' }
      ]
    });
    const shopRows = rows.filter((r) => r.kind === CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER);
    expect(shopRows.map((r) => r.orderPublicId)).toEqual(['pub-2', 'pub-1']);
    const paid = shopRows.find((r) => r.orderPublicId === 'pub-1');
    expect(paid.productName).toBe('온라인 5회기');
    expect(paid.sessionsText).toBe('5회기');
    expect(paid.methodText).toBe('카드');
    expect(paid.channelText).toBe('온라인');
    expect(paid.badge).toBe(CLIENT_PAYMENT_BADGE.COMPLETED);
    const refunded = shopRows.find((r) => r.orderPublicId === 'pub-2');
    expect(refunded.productName).toBe('상품 정보 없음');
    expect(refunded.badge).toBe(CLIENT_PAYMENT_BADGE.REFUNDED);
    expect(refunded.amountSubText).toBe('전액 환불');
  });

  test('온라인 주문 상세 라인으로 상품명 복원', () => {
    const [row] = buildClientPaymentRows({
      shopOrders: [{ orderPublicId: 'pub-9', status: 'PAID', cashDueMinor: 10000, createdAt: '2026-09-20T10:00:00' }],
      shopOrderDetails: { 'pub-9': { productTitle: '검사 패키지', sessions: null } }
    });
    expect(row.productName).toBe('검사 패키지');
    expect(row.sessionsText).toBeNull();
  });

  test('취소·실패 금액은 muted · 합계 제외', () => {
    const rows = buildClientPaymentRows({
      mappings: [
        { id: 1, packageName: 'X', paymentAmount: 1000, paymentStatus: 'REJECTED' },
        { id: 2, packageName: 'Y', paymentAmount: 2000, paymentStatus: 'PENDING' }
      ]
    });
    expect(rows.find((r) => r.key === 'mapping-1').amountMuted).toBe(true);
    expect(summarizeClientPaymentRows(rows).paidSum).toBe(0);
  });
});

describe('filterClientPaymentRows', () => {
  const now = new Date(2026, 8, 30, 12, 0, 0);
  const rows = buildClientPaymentRows({
    mappings: [
      { id: 1, packageName: 'A', paymentAmount: 1000, paymentStatus: 'CONFIRMED', paymentDate: '2026-09-30T09:00:00' },
      { id: 2, packageName: 'B', paymentAmount: 2000, paymentStatus: 'REFUNDED', paymentDate: '2026-08-15T09:00:00' },
      { id: 3, packageName: 'C', paymentAmount: 3000, paymentStatus: 'PENDING', createdAt: '2026-03-01T09:00:00' },
      { id: 4, packageName: 'D', paymentAmount: -500, paymentStatus: 'CONFIRMED', paymentDate: '2026-09-29T09:00:00' },
      { id: 5, packageName: 'E', paymentAmount: 500, paymentStatus: 'CANCELLED', paymentDate: '2025-01-01T09:00:00' }
    ]
  });

  test('기간: 최근 1개월 (오늘 포함 · 결제일 없으면 생성일)', () => {
    expect(filterClientPaymentRows(rows, { period: '1m' }, now).map((r) => r.key).sort())
      .toEqual(['mapping-1', 'mapping-4']);
    expect(filterClientPaymentRows(rows, { period: '1y' }, now).map((r) => r.key)).toContain('mapping-3');
  });

  test('상태: 환불 = 환불 + 부분환불 · 완료에는 별도 환불 행 없음 · 취소는 전체에서만', () => {
    expect(filterClientPaymentRows(rows, { status: 'refunded' }, now).map((r) => r.key).sort())
      .toEqual(['mapping-2', 'mapping-4']);
    expect(filterClientPaymentRows(rows, { status: 'completed' }, now).map((r) => r.key)).toEqual(['mapping-1']);
    expect(filterClientPaymentRows(rows, { status: 'pending' }, now).map((r) => r.key)).toEqual(['mapping-3']);
    expect(filterClientPaymentRows(rows, {}, now)).toHaveLength(5);
  });
});

describe('summary · paging · query helpers', () => {
  test('요약 문구', () => {
    expect(formatClientPaymentSummary({ count: 3, paidSum: 190000, refundSum: 90000 }))
      .toBe('3건 · 결제 190,000원 · 환불 90,000원');
    expect(formatClientPaymentSummary({ count: 0, paidSum: 0, refundSum: 0 })).toBe('0건 · 결제 0원');
    expect(formatClientPaymentSummary({ count: 1, paidSum: 1000, refundSum: 0 }, { partial: true }))
      .toBe('1건 · 결제 1,000원 (일부)');
  });

  test('페이징 범위 보정', () => {
    const list = Array.from({ length: 23 }, (_, i) => ({ key: i }));
    expect(paginateClientPaymentRows(list, 3, 10)).toMatchObject({ page: 3, totalPages: 3 });
    expect(paginateClientPaymentRows(list, 3, 10).pageRows).toHaveLength(3);
    expect(paginateClientPaymentRows(list, 99, 10).page).toBe(3);
    expect(paginateClientPaymentRows([], 1, 10)).toMatchObject({ page: 1, totalPages: 1, pageRows: [] });
  });

  test('쿼리 값 정규화', () => {
    expect(normalizePeriod('3m')).toBe('3m');
    expect(normalizePeriod('7d')).toBe('all');
    expect(normalizeStatusFilter('refunded')).toBe('refunded');
    expect(normalizeStatusFilter('bogus')).toBe('all');
    expect(normalizePage('2')).toBe(2);
    expect(normalizePage('-1')).toBe(1);
  });

  test('caption', () => {
    expect(buildClientPaymentCaption('3m', 'refunded', 2)).toBe('결제 내역 · 3개월 · 환불 · 2건');
  });
});
