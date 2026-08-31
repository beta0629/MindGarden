/**
 * LedgerSummaryStrip — KPI money polarity DOM contract
 * (cell modifiers must be present so CSS token rules actually apply —
 *  MoneyHeroBand SSOT: income/expense/remaining cell modifiers)
 *
 * @author CoreSolution
 * @since 2026-08-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LedgerSummaryStrip from '../LedgerSummaryStrip';

jest.mock('../../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../../../dashboard-v2/atoms/KpiNumeral', () => ({
  __esModule: true,
  default: ({ value, unit }) => (
    <span data-testid="kpi-numeral">{value}{unit || ''}</span>
  )
}));

describe('LedgerSummaryStrip money polarity DOM contract', () => {
  it('applies --income cell modifier for 들어온 돈', () => {
    render(<LedgerSummaryStrip totalIncome={1000000} totalExpense={400000} remaining={600000} />);
    const income = screen.getByTestId('ledger-summary-income');
    expect(income.closest('.operator-ledger-summary__cell')).toHaveClass(
      'operator-ledger-summary__cell--income'
    );
  });

  it('applies --expense cell modifier for 나간 돈', () => {
    render(<LedgerSummaryStrip totalIncome={1000000} totalExpense={400000} remaining={600000} />);
    const expense = screen.getByTestId('ledger-summary-expense');
    expect(expense.closest('.operator-ledger-summary__cell')).toHaveClass(
      'operator-ledger-summary__cell--expense'
    );
  });

  it('applies --remaining cell modifier', () => {
    render(<LedgerSummaryStrip totalIncome={1000000} totalExpense={400000} remaining={600000} />);
    const remaining = screen.getByTestId('ledger-summary-remaining');
    expect(remaining.closest('.operator-ledger-summary__cell')).toHaveClass(
      'operator-ledger-summary__cell--remaining'
    );
  });

  it('renders captions when provided', () => {
    render(
      <LedgerSummaryStrip
        totalIncome={1000000}
        totalExpense={400000}
        remaining={600000}
        incomeCaption="상담료 1,000,000원"
        expenseCaption="급여 400,000원"
        remainingCaption="지난달보다 100,000원 많음"
      />
    );
    expect(screen.getByText('상담료 1,000,000원')).toBeInTheDocument();
    expect(screen.getByText('급여 400,000원')).toBeInTheDocument();
    expect(screen.getByText('지난달보다 100,000원 많음')).toBeInTheDocument();
  });
});
