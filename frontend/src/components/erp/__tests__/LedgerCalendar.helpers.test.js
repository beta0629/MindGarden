/**
 * LedgerCalendar — day aggregation + month navigation helpers
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import {
  buildMonthGridDays,
  canNavigateNextMonth,
  canNavigatePrevMonth,
  getMonthBounds,
  groupTransactionsByDate,
  LEDGER_CALENDAR_MIN_MONTH_YM,
  shiftMonthYm
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

  it('shiftMonthYm moves forward and backward across year boundary', () => {
    expect(shiftMonthYm('2026-08', -1)).toBe('2026-07');
    expect(shiftMonthYm('2026-01', -1)).toBe('2025-12');
    expect(shiftMonthYm('2025-12', 1)).toBe('2026-01');
  });

  it('getMonthBounds returns inclusive first and last day', () => {
    expect(getMonthBounds('2026-02')).toEqual({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      year: 2026,
      month: 2,
      daysInMonth: 28
    });
  });

  it('canNavigatePrevMonth blocks below 2020-01', () => {
    expect(LEDGER_CALENDAR_MIN_MONTH_YM).toBe('2020-01');
    expect(canNavigatePrevMonth('2020-01')).toBe(false);
    expect(canNavigatePrevMonth('2020-02')).toBe(true);
  });

  it('canNavigateNextMonth blocks past current month', () => {
    expect(canNavigateNextMonth('2026-08', '2026-08')).toBe(false);
    expect(canNavigateNextMonth('2026-07', '2026-08')).toBe(true);
    expect(canNavigateNextMonth('2026-09', '2026-08')).toBe(false);
  });
});
