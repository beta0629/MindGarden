/**
 * formatLedgerDateTime / resolveLedgerShopIdentifiers — 장부 일시·식별자 SSOT
 *
 * @author CoreSolution
 * @since 2026-09-19
 */

import {
  formatLedgerDateTime,
  parseShopOrderRemarks,
  resolveLedgerShopIdentifiers
} from '../erpFinanceDisplay';

describe('formatLedgerDateTime', () => {
  test('ISO createdAt → YYYY-MM-DD HH:mm', () => {
    expect(formatLedgerDateTime({
      transactionDate: '2026-09-19',
      createdAt: '2026-09-19T14:35:00'
    })).toBe('2026-09-19 14:35');
  });

  test('date-only transactionDate + createdAt → uses createdAt time', () => {
    expect(formatLedgerDateTime({
      transactionDate: '2026-09-19',
      createdAt: '2026-09-19T09:05:12.345'
    })).toBe('2026-09-19 09:05');
  });

  test('approvedAt used when createdAt missing', () => {
    expect(formatLedgerDateTime({
      transactionDate: '2026-09-18',
      approvedAt: '2026-09-18T16:40:00'
    })).toBe('2026-09-18 16:40');
  });

  test('date-only only → YYYY-MM-DD 00:00 (일시 컬럼)', () => {
    expect(formatLedgerDateTime({ transactionDate: '2026-09-19' })).toBe('2026-09-19 00:00');
    expect(formatLedgerDateTime('2026-09-19')).toBe('2026-09-19 00:00');
  });

  test('LocalDateTime array with time', () => {
    expect(formatLedgerDateTime({
      transactionDate: [2026, 9, 19],
      createdAt: [2026, 9, 19, 11, 7]
    })).toBe('2026-09-19 11:07');
  });

  test('space-separated datetime string', () => {
    expect(formatLedgerDateTime('2026-09-19 08:01:59')).toBe('2026-09-19 08:01');
  });

  test('null / empty → em dash', () => {
    expect(formatLedgerDateTime(null)).toBe('—');
    expect(formatLedgerDateTime({})).toBe('—');
  });
});

describe('resolveLedgerShopIdentifiers', () => {
  test('parses remarks orderPublicId / paymentId', () => {
    expect(parseShopOrderRemarks('orderPublicId=ord-1; paymentId=pay-9')).toEqual({
      orderPublicId: 'ord-1',
      paymentId: 'pay-9'
    });
  });

  test('prefers tx.orderPublicId / tx.paymentId over remarks', () => {
    expect(resolveLedgerShopIdentifiers({
      orderPublicId: 'ord-tx',
      paymentId: 'pay-tx',
      remarks: 'orderPublicId=ord-rm; paymentId=pay-rm'
    })).toEqual({
      orderPublicId: 'ord-tx',
      paymentId: 'pay-tx'
    });
  });

  test('falls back to orderId / relatedPaymentId / remarks', () => {
    expect(resolveLedgerShopIdentifiers({
      orderId: 'ord-fallback',
      relatedPaymentId: 'pay-rel',
      remarks: null
    })).toEqual({
      orderPublicId: 'ord-fallback',
      paymentId: 'pay-rel'
    });
  });

  test('merges tx field + remarks when one side missing', () => {
    expect(resolveLedgerShopIdentifiers({
      orderPublicId: 'ord-only',
      remarks: 'orderPublicId=-; paymentId=pay-from-remarks'
    })).toEqual({
      orderPublicId: 'ord-only',
      paymentId: 'pay-from-remarks'
    });
  });

  test('ignores dash placeholders', () => {
    expect(resolveLedgerShopIdentifiers({
      remarks: 'orderPublicId=-; paymentId=-'
    })).toEqual({
      orderPublicId: null,
      paymentId: null
    });
  });
});
