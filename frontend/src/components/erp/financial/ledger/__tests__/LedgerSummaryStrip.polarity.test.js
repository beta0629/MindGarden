/**
 * LedgerSummaryStrip — KPI money polarity DOM contract
 * (income/expense classes must be present so CSS token rules actually apply —
 *  guards against CSS-only fixes silently drifting from the rendered markup)
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

describe('LedgerSummaryStrip money polarity DOM contract', () => {
  it('applies --income class to 들어온 합 amount', () => {
    render(<LedgerSummaryStrip totalIncome={1000000} totalExpense={400000} remaining={600000} />);
    const income = screen.getByTestId('ledger-summary-income');
    expect(income).toHaveClass('operator-ledger-summary__amount--income');
  });

  it('applies --expense class to 나간 합 amount', () => {
    render(<LedgerSummaryStrip totalIncome={1000000} totalExpense={400000} remaining={600000} />);
    const expense = screen.getByTestId('ledger-summary-expense');
    expect(expense).toHaveClass('operator-ledger-summary__amount--expense');
  });

  it('applies --remaining-positive class when remaining >= 0', () => {
    render(<LedgerSummaryStrip totalIncome={1000000} totalExpense={400000} remaining={600000} />);
    const remaining = screen.getByTestId('ledger-summary-remaining');
    expect(remaining).toHaveClass('operator-ledger-summary__amount--remaining-positive');
    expect(remaining).not.toHaveClass('operator-ledger-summary__amount--remaining-negative');
  });

  it('applies --remaining-negative class when remaining < 0', () => {
    render(<LedgerSummaryStrip totalIncome={400000} totalExpense={1000000} remaining={-600000} />);
    const remaining = screen.getByTestId('ledger-summary-remaining');
    expect(remaining).toHaveClass('operator-ledger-summary__amount--remaining-negative');
    expect(remaining).not.toHaveClass('operator-ledger-summary__amount--remaining-positive');
  });
});
