/**
 * formatLedgerDateTime / resolveLedgerShopIdentifiers — 장부 일시·식별자 SSOT
 *
 * @author CoreSolution
 * @since 2026-09-19
 */

import {
  formatLedgerDateTime,
  parseShopOrderRemarks,
  resolveLedgerShopIdentifiers,
  groupTransactionsForLedger
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

describe('groupTransactionsForLedger', () => {
  test('returns empty array when txs is null or empty', () => {
    expect(groupTransactionsForLedger(null)).toEqual([]);
    expect(groupTransactionsForLedger([])).toEqual([]);
    expect(groupTransactionsForLedger(undefined)).toEqual([]);
  });

  test('attaches refund EXPENSE as child under parent INCOME matching orderPublicId', () => {
    const income = {
      id: 1,
      transactionType: 'INCOME',
      orderPublicId: 'ord-100',
      description: '상담료 입금'
    };
    const refund = {
      id: 2,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_REFUND',
      orderPublicId: 'ord-100',
      description: '상담료 환불'
    };
    const groups = groupTransactionsForLedger([income, refund]);

    expect(groups).toHaveLength(1);
    expect(groups[0].parent).toBe(income);
    expect(groups[0].children).toHaveLength(1);
    expect(groups[0].children[0]).toBe(refund);
    expect(groups[0].isRefundOrphan).toBe(false);
  });

  test('attaches refund EXPENSE as child under parent INCOME matching paymentId', () => {
    const income = {
      id: 10,
      transactionType: 'INCOME',
      paymentId: 'pay-200',
      description: '카드 결제 입금'
    };
    const refund = {
      id: 20,
      transactionType: 'EXPENSE',
      description: '카드 매출취소',
      paymentId: 'pay-200'
    };
    const groups = groupTransactionsForLedger([income, refund]);

    expect(groups).toHaveLength(1);
    expect(groups[0].parent).toBe(income);
    expect(groups[0].children).toEqual([refund]);
  });

  test('attaches refund with remarks to matching INCOME parent', () => {
    const income = {
      id: 101,
      transactionType: 'INCOME',
      orderPublicId: 'ord-shop-99',
      paymentId: 'pay-shop-99',
      description: '쇼핑몰 결제 입금'
    };
    const refund = {
      id: 102,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_REFUND',
      description: '상담료 환불 - Path B',
      remarks: 'orderPublicId=ord-shop-99; paymentId=pay-shop-99'
    };
    const groups = groupTransactionsForLedger([income, refund]);

    expect(groups).toHaveLength(1);
    expect(groups[0].parent).toBe(income);
    expect(groups[0].children).toEqual([refund]);
  });

  test('prefers attaching to INCOME with matching relatedEntityId when keys are identical', () => {
    const incomeA = {
      id: 1,
      transactionType: 'INCOME',
      orderPublicId: 'ord-common',
      relatedEntityId: 11
    };
    const incomeB = {
      id: 2,
      transactionType: 'INCOME',
      orderPublicId: 'ord-common',
      relatedEntityId: 22
    };
    const refund = {
      id: 3,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_REFUND',
      description: '환불',
      orderPublicId: 'ord-common',
      relatedEntityId: 22
    };
    const groups = groupTransactionsForLedger([incomeA, incomeB, refund]);

    expect(groups).toHaveLength(2);
    expect(groups[0].parent).toBe(incomeA);
    expect(groups[0].children).toEqual([]);
    expect(groups[1].parent).toBe(incomeB);
    expect(groups[1].children).toEqual([refund]);
  });

  test('attaches refund by matching relatedEntityId when order/payment keys are missing', () => {
    const income = {
      id: 1,
      transactionType: 'INCOME',
      relatedEntityId: 777,
      description: '상담료 입금'
    };
    const refund = {
      id: 2,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_REFUND',
      relatedEntityId: 777,
      description: '상담료 부분환불'
    };
    const groups = groupTransactionsForLedger([income, refund]);

    expect(groups).toHaveLength(1);
    expect(groups[0].parent).toBe(income);
    expect(groups[0].children).toEqual([refund]);
  });

  test('keeps orphan refund as standalone group with isRefundOrphan: true when no parent matches', () => {
    const income = {
      id: 1,
      transactionType: 'INCOME',
      orderPublicId: 'ord-100',
      description: '상담료 입금'
    };
    const orphanRefund = {
      id: 2,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_REFUND',
      orderPublicId: 'ord-unknown',
      description: '고아 환불 행'
    };
    const groups = groupTransactionsForLedger([income, orphanRefund]);

    expect(groups).toHaveLength(2);
    expect(groups[0].parent).toBe(income);
    expect(groups[0].children).toEqual([]);
    expect(groups[0].isRefundOrphan).toBe(false);
    expect(groups[1].parent).toBe(orphanRefund);
    expect(groups[1].children).toEqual([]);
    expect(groups[1].isRefundOrphan).toBe(true);
  });

  test('forbids flat standalone refund when parent link exists even if refund appears before income in array', () => {
    const refund = {
      id: 2,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_REFUND',
      orderPublicId: 'ord-reverse',
      description: '환불'
    };
    const income = {
      id: 1,
      transactionType: 'INCOME',
      orderPublicId: 'ord-reverse',
      description: '입금'
    };
    const groups = groupTransactionsForLedger([refund, income]);

    expect(groups).toHaveLength(1);
    expect(groups[0].parent).toBe(income);
    expect(groups[0].children).toEqual([refund]);
  });

  test('supports multiple refund children under single parent INCOME', () => {
    const income = {
      id: 1,
      transactionType: 'INCOME',
      orderPublicId: 'ord-multi',
      description: '입금'
    };
    const refund1 = {
      id: 2,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_PARTIAL_REFUND',
      orderPublicId: 'ord-multi',
      description: '1차 부분환불'
    };
    const refund2 = {
      id: 3,
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_PARTIAL_REFUND',
      orderPublicId: 'ord-multi',
      description: '2차 부분환불'
    };
    const groups = groupTransactionsForLedger([income, refund1, refund2]);

    expect(groups).toHaveLength(1);
    expect(groups[0].parent).toBe(income);
    expect(groups[0].children).toEqual([refund1, refund2]);
  });

  test('keeps non-refund EXPENSE (RENT, SALARY) as standalone parent group', () => {
    const rent = {
      id: 5,
      transactionType: 'EXPENSE',
      category: 'RENT',
      description: '월 임대료'
    };
    const groups = groupTransactionsForLedger([rent]);

    expect(groups).toHaveLength(1);
    expect(groups[0].parent).toBe(rent);
    expect(groups[0].children).toEqual([]);
    expect(groups[0].isRefundOrphan).toBe(false);
  });
});
