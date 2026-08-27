/**
 * LedgerCalendar — day aggregation helpers
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  buildMonthGridDays,
  groupTransactionsByDate
} from '../financial/ledger/LedgerCalendar';

describe('LedgerCalendar helpers', () => {
  it('buildMonthGridDays pads to full weeks without adjacent-month numbers', () => {
    const days = buildMonthGridDays('2026-08');
    expect(days.filter((d) => d != null).length).toBe(31);
    expect(days.every((d) => d == null || (d >= 1 && d <= 31))).toBe(true);
    expect(days.length % 7).toBe(0);
    expect(days.length).toBeGreaterThanOrEqual(35);
  });

  it('groupTransactionsByDate aggregates income and expense by ymd', () => {
    const grouped = groupTransactionsByDate([
      {
        id: 1,
        transactionDate: '2026-08-15',
        transactionType: 'INCOME',
        amount: 100000
      },
      {
        id: 2,
        transactionDate: '2026-08-15T09:00:00',
        transactionType: 'EXPENSE',
        amount: 40000
      },
      {
        id: 3,
        transactionDate: '2026-08-16',
        transactionType: 'INCOME',
        amount: 50000
      }
    ]);

    expect(grouped['2026-08-15'].income).toBe(100000);
    expect(grouped['2026-08-15'].expense).toBe(40000);
    expect(grouped['2026-08-15'].transactions).toHaveLength(2);
    expect(grouped['2026-08-16'].income).toBe(50000);
    expect(grouped['2026-08-16'].expense).toBe(0);
  });
});
