/**
 * LedgerTable & OperatorLedger CSS test:
 * - Refund/매출취소 EXPENSE rows are visually distinct blue (comment/thread accent)
 * - isLedgerRefundOrRevenueCancelRow covers CONSULTATION_REFUND, CONSULTATION_PARTIAL_REFUND, REVENUE_CANCEL, relatedEntityType, and description
 * - INCOME rows stay red/income polarity (--mg-v2-ledger-color-income)
 * - CSS uses b0kla-blue tokens, 3px left border accent, no random green
 *
 * @author CoreSolution
 * @since 2026-09-19
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import LedgerTable from '../LedgerTable';
import { isLedgerRefundOrRevenueCancelRow } from '../../../../../utils/erpFinanceDisplay';
import { FM_TX_TABLE_LABELS } from '../../../../../constants/financialManagementStrings';

const CSS_PATH = path.resolve(__dirname, '..', 'OperatorLedger.css');
const readCss = () => fs.readFileSync(CSS_PATH, 'utf8');

const extractRuleBody = (css, selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const match = css.match(re);
  return match ? match[1] : null;
};

describe('isLedgerRefundOrRevenueCancelRow logic', () => {
  test('covers CONSULTATION_REFUND subcategory on EXPENSE', () => {
    const tx = {
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_REFUND',
      description: '상담료 환불'
    };
    expect(isLedgerRefundOrRevenueCancelRow(tx)).toBe(true);
  });

  test('covers CONSULTATION_PARTIAL_REFUND subcategory on EXPENSE', () => {
    const tx = {
      transactionType: 'EXPENSE',
      subcategory: 'CONSULTATION_PARTIAL_REFUND',
      description: '상담료 부분 환불'
    };
    expect(isLedgerRefundOrRevenueCancelRow(tx)).toBe(true);
  });

  test('covers relatedEntityType containing REFUND', () => {
    const tx = {
      transactionType: 'EXPENSE',
      subcategory: 'OTHER',
      relatedEntityType: 'CONSULTANT_CLIENT_MAPPING_REFUND',
      description: '기타 환불'
    };
    expect(isLedgerRefundOrRevenueCancelRow(tx)).toBe(true);
  });

  test('covers description containing 환불 or 매출취소 on EXPENSE', () => {
    expect(isLedgerRefundOrRevenueCancelRow({
      transactionType: 'EXPENSE',
      subcategory: 'OTHER',
      description: '단순 변심 환불 처리'
    })).toBe(true);

    expect(isLedgerRefundOrRevenueCancelRow({
      transactionType: 'EXPENSE',
      subcategory: 'OTHER',
      description: '카드 매출취소 처리'
    })).toBe(true);
  });

  test('does NOT match INCOME rows even if description or subcategory contains refund/cancel', () => {
    const incomeDeposit = {
      transactionType: 'INCOME',
      subcategory: 'CONSULTATION',
      description: '상담료 입금 확인 - 기본 패키지'
    };
    expect(isLedgerRefundOrRevenueCancelRow(incomeDeposit)).toBe(false);

    const incomeWithWord = {
      transactionType: 'INCOME',
      subcategory: 'CONSULTATION_REFUND',
      description: '상담료 환불 취소'
    };
    expect(isLedgerRefundOrRevenueCancelRow(incomeWithWord)).toBe(false);
  });

  test('normal EXPENSE (e.g. RENT, SALARY) is not a refund row', () => {
    const rent = {
      transactionType: 'EXPENSE',
      subcategory: 'OFFICE_RENT',
      description: '사무실 임대료'
    };
    expect(isLedgerRefundOrRevenueCancelRow(rent)).toBe(false);
  });
});

describe('LedgerTable refund row rendering and classes', () => {
  const mockTransactions = [
    {
      id: 1,
      transactionDate: '2026-09-19',
      createdAt: '2026-09-19T10:15:00',
      transactionType: 'INCOME',
      category: 'CONSULTATION',
      description: '상담료 입금',
      amount: 300000,
      orderPublicId: 'ord-income-1',
      paymentId: 'pay-income-1'
    },
    {
      id: 2,
      transactionDate: '2026-09-19',
      createdAt: '2026-09-19T14:30:00',
      transactionType: 'EXPENSE',
      category: 'CONSULTATION',
      subcategory: 'CONSULTATION_REFUND',
      description: '상담료 환불 - 기본 패키지',
      amount: 100000,
      remarks: 'orderPublicId=ord-refund-2; paymentId=pay-refund-2'
    },
    {
      id: 3,
      transactionDate: '2026-09-19',
      transactionType: 'EXPENSE',
      category: 'RENT',
      description: '사무실 임대료',
      amount: 500000
    }
  ];

  test('renders refund row with operator-ledger-table__row--refund and data-refund-row="true"', () => {
    const { container } = render(<LedgerTable transactions={mockTransactions} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Row 1: INCOME (not refund)
    expect(rows[0]).not.toHaveClass('operator-ledger-table__row--refund');
    expect(rows[0].getAttribute('data-refund-row')).toBeNull();
    const incomeAmount = rows[0].querySelector('.operator-ledger-table__amount--income');
    expect(incomeAmount).toBeInTheDocument();
    expect(incomeAmount).toHaveTextContent('300,000원');

    // Row 2: CONSULTATION_REFUND (refund row)
    expect(rows[1]).toHaveClass('operator-ledger-table__row--refund');
    expect(rows[1].getAttribute('data-refund-row')).toBe('true');
    const refundDesc = rows[1].querySelector('.operator-ledger-table__desc-primary--refund');
    expect(refundDesc).toBeInTheDocument();
    const refundAmount = rows[1].querySelector('.operator-ledger-table__amount--refund');
    expect(refundAmount).toBeInTheDocument();
    expect(refundAmount).toHaveTextContent('100,000원');

    // Chip present with constant
    const chip = rows[1].querySelector('.operator-ledger-table__refund-chip');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent(FM_TX_TABLE_LABELS.REFUND_BADGE);

    // Row 3: Standard EXPENSE (not refund)
    expect(rows[2]).not.toHaveClass('operator-ledger-table__row--refund');
    expect(rows[2].getAttribute('data-refund-row')).toBeNull();
    const expenseAmount = rows[2].querySelector('.operator-ledger-table__amount--expense');
    expect(expenseAmount).toBeInTheDocument();
    expect(expenseAmount).not.toHaveClass('operator-ledger-table__amount--refund');
    expect(expenseAmount).toHaveTextContent('500,000원');
  });

  test('shows HH:mm from createdAt and order/payment identifiers on rows', () => {
    const { container } = render(<LedgerTable transactions={mockTransactions} />);
    const rows = container.querySelectorAll('tbody tr');

    expect(rows[0].querySelector('td')).toHaveTextContent('2026-09-19 10:15');
    expect(rows[1].querySelector('td')).toHaveTextContent('2026-09-19 14:30');
    // date-only only → 00:00 (일시 컬럼 SSOT)
    expect(rows[2].querySelector('td')).toHaveTextContent('2026-09-19 00:00');

    const incomeSecondaries = rows[0].querySelectorAll('.operator-ledger-table__desc-secondary');
    const incomeText = Array.from(incomeSecondaries).map((el) => el.textContent).join(' ');
    expect(incomeText).toContain('ord-income-1');
    expect(incomeText).toContain('pay-income-1');

    const refundSecondaries = rows[1].querySelectorAll('.operator-ledger-table__desc-secondary');
    const refundText = Array.from(refundSecondaries).map((el) => el.textContent).join(' ');
    expect(refundText).toContain('ord-refund-2');
    expect(refundText).toContain('pay-refund-2');
  });

  test('renders linked refund as indented child row under parent INCOME with thread accent and shared link IDs', () => {
    const linkedTxs = [
      {
        id: 10,
        transactionDate: '2026-09-19',
        createdAt: '2026-09-19T09:30:00',
        transactionType: 'INCOME',
        category: 'CONSULTATION',
        description: '상담료 입금 (신용카드)',
        amount: 500000,
        orderPublicId: 'ORD-PARENT-777',
        paymentId: 'PAY-PARENT-888'
      },
      {
        id: 20,
        transactionDate: '2026-09-19',
        createdAt: '2026-09-19T11:45:00',
        transactionType: 'EXPENSE',
        category: 'CONSULTATION',
        subcategory: 'CONSULTATION_REFUND',
        description: '상담료 환불',
        amount: 200000,
        orderPublicId: 'ORD-PARENT-777',
        paymentId: 'PAY-PARENT-888'
      },
      {
        id: 30,
        transactionDate: '2026-09-19',
        transactionType: 'EXPENSE',
        category: 'OFFICE_RENT',
        description: '사무실 임대료',
        amount: 1000000
      }
    ];

    const { container } = render(<LedgerTable transactions={linkedTxs} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);

    // Parent row (INCOME)
    expect(rows[0]).not.toHaveClass('operator-ledger-table__row--refund-child');
    expect(rows[0].querySelector('td')).toHaveTextContent('2026-09-19 09:30');
    const parentSecondaries = rows[0].querySelectorAll('.operator-ledger-table__desc-secondary');
    const parentText = Array.from(parentSecondaries).map((el) => el.textContent).join(' ');
    expect(parentText).toContain('ORD-PARENT-777');
    expect(parentText).toContain('PAY-PARENT-888');

    // Child row (REFUND) immediately under parent
    expect(rows[1]).toHaveClass('operator-ledger-table__row--refund');
    expect(rows[1]).toHaveClass('operator-ledger-table__row--refund-child');
    expect(rows[1].getAttribute('data-refund-row')).toBe('true');
    expect(rows[1].getAttribute('data-refund-child')).toBe('true');
    expect(rows[1].querySelector('td')).toHaveTextContent('2026-09-19 11:45');

    // Child shows thread indicator ↳
    const threadPrefix = rows[1].querySelector('.operator-ledger-table__thread-prefix');
    expect(threadPrefix).toBeInTheDocument();
    expect(threadPrefix).toHaveTextContent('↳');

    // Child shows parent link IDs (both parent and child show them)
    const childSecondaries = rows[1].querySelectorAll('.operator-ledger-table__desc-secondary');
    const childText = Array.from(childSecondaries).map((el) => el.textContent).join(' ');
    expect(childText).toContain('ORD-PARENT-777');
    expect(childText).toContain('PAY-PARENT-888');

    // Child amount in Expense column
    const refundAmount = rows[1].querySelector('.operator-ledger-table__amount--refund');
    expect(refundAmount).toHaveTextContent('200,000원');

    // Row 3: normal expense
    expect(rows[2].querySelector('td')).toHaveTextContent('2026-09-19 00:00');
    expect(rows[2]).not.toHaveClass('operator-ledger-table__row--refund');
  });

  test('renders orphan refund row with warning style when no parent link exists', () => {
    const orphanTx = [
      {
        id: 99,
        transactionDate: '2026-09-19',
        createdAt: '2026-09-19T16:00:00',
        transactionType: 'EXPENSE',
        category: 'CONSULTATION',
        subcategory: 'CONSULTATION_REFUND',
        description: '원거래 없는 단독 환불',
        amount: 70000
      }
    ];

    const { container } = render(<LedgerTable transactions={orphanTx} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveClass('operator-ledger-table__row--refund');
    expect(rows[0]).toHaveClass('operator-ledger-table__row--refund-orphan');
    expect(rows[0].getAttribute('data-refund-orphan')).toBe('true');

    const warnBadge = rows[0].querySelector('.operator-ledger-table__desc-secondary--warn');
    expect(warnBadge).toBeInTheDocument();
    expect(warnBadge).toHaveTextContent(FM_TX_TABLE_LABELS.REFUND_ORPHAN_LABEL);
  });
});

describe('OperatorLedger CSS refund contract', () => {
   const css = readCss();

  test('refund row uses b0kla-blue wash and left accent border (3px)', () => {
    const rowBody = extractRuleBody(css, '.operator-ledger-table__row--refund');
    expect(rowBody).toBeTruthy();
    expect(rowBody).toMatch(/background:\s*var\(--mg-color-b0kla-blue-50/);

    const borderBody = extractRuleBody(css, '.operator-ledger-table__row--refund td:first-child');
    expect(borderBody).toBeTruthy();
    expect(borderBody).toMatch(/border-left:\s*3px\s+solid\s+var\(--mg-color-b0kla-blue-400/);
  });

  test('refund child row uses indent and left thread border with b0kla tokens', () => {
    const childBody = extractRuleBody(css, '.operator-ledger-table__row--refund-child td:first-child');
    expect(childBody).toBeTruthy();
    expect(childBody).toMatch(/padding-left:\s*var\(--mg-v2-space-5/);
    expect(childBody).toMatch(/border-left:\s*3px\s+solid\s+var\(--mg-color-b0kla-blue-400/);

    const descBody = extractRuleBody(css, '.operator-ledger-table__row--refund-child .operator-ledger-table__desc');
    expect(descBody).toBeTruthy();
    expect(descBody).toMatch(/border-left:\s*2px\s+solid\s+var\(--mg-color-b0kla-blue-400/);

    const threadBody = extractRuleBody(css, '.operator-ledger-table__thread-prefix');
    expect(threadBody).toBeTruthy();
    expect(threadBody).toMatch(/color:\s*var\(--mg-color-b0kla-blue-400/);
  });

  test('orphan refund row uses dashed left border with b0kla token', () => {
    const orphanBody = extractRuleBody(css, '.operator-ledger-table__row--refund-orphan td:first-child');
    expect(orphanBody).toBeTruthy();
    expect(orphanBody).toMatch(/border-left:\s*3px\s+dashed\s+var\(--mg-color-b0kla-blue-400/);
  });

  test('refund desc and amount use b0kla-blue token', () => {
    const descBody = extractRuleBody(css, '.operator-ledger-table__desc-primary--refund');
    expect(descBody).toBeTruthy();
    expect(descBody).toMatch(/color:\s*var\(--mg-color-b0kla-blue-400/);

    const amountBody = extractRuleBody(css, '.operator-ledger-table__amount--refund');
    expect(amountBody).toBeTruthy();
    expect(amountBody).toMatch(/color:\s*var\(--mg-color-b0kla-blue-400/);
  });

  test('refund row styling does not use random green', () => {
    const rowBody = extractRuleBody(css, '.operator-ledger-table__row--refund') || '';
    const descBody = extractRuleBody(css, '.operator-ledger-table__desc-primary--refund') || '';
    const amountBody = extractRuleBody(css, '.operator-ledger-table__amount--refund') || '';
    const combined = `${rowBody} ${descBody} ${amountBody}`;
    expect(combined).not.toMatch(/green/i);
  });

  test('income polarity remains red/income (--mg-v2-ledger-color-income)', () => {
    const incomeBody = extractRuleBody(css, '.operator-ledger-table__amount--income');
    expect(incomeBody).toBeTruthy();
    expect(incomeBody).toMatch(/color:\s*var\(--mg-v2-ledger-color-income\)/);
  });
});
