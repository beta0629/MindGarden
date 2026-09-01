/**
 * useYearLedgerSummary / YearEndIncomePanel — calendar-year ledger summary tests
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FM_TAX_DISCLOSURE,
  FM_SUMMARY
} from '../../../../../constants/financialManagementStrings';

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  )
}));

jest.mock('../../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

import StandardizedApi from '../../../../../utils/standardizedApi';
import useYearLedgerSummary, { getCalendarYearDateRange } from '../useYearLedgerSummary';
import YearEndIncomePanel from '../YearEndIncomePanel';

const API_ADMIN_FINANCIAL_TRANSACTIONS = '/api/v1/admin/financial-transactions';

const mockYearSummary = (overrides = {}) => ({
  success: true,
  summary: {
    totalIncome: 4620000,
    totalExpense: 1540000,
    remaining: 3080000,
    ...overrides
  }
});

describe('getCalendarYearDateRange', () => {
  test('returns YYYY-01-01 through YYYY-12-31 for calendar year', () => {
    expect(getCalendarYearDateRange(2026)).toEqual({
      startDate: '2026-01-01',
      endDate: '2026-12-31'
    });
    expect(getCalendarYearDateRange(2024)).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });
  });
});

describe('useYearLedgerSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue(mockYearSummary());
  });

  test('calls financial-transactions with calendar year startDate and endDate on mount', async() => {
    const { result } = renderHook(() => useYearLedgerSummary(2025));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      API_ADMIN_FINANCIAL_TRANSACTIONS,
      { page: 0, size: 1, startDate: '2025-01-01', endDate: '2025-12-31' },
      { unwrapApiEnvelope: false }
    );
  });

  test('remaining equals totalIncome minus totalExpense when server omits remaining', async() => {
    StandardizedApi.get.mockResolvedValue(
      mockYearSummary({ totalIncome: 5000, totalExpense: 2000, remaining: undefined })
    );

    const { result } = renderHook(() => useYearLedgerSummary(2026));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.summary.totalIncome).toBe(5000);
    expect(result.current.summary.totalExpense).toBe(2000);
    expect(result.current.summary.remaining).toBe(3000);
  });

  test('uses server remaining when envelope.summary provides it', async() => {
    StandardizedApi.get.mockResolvedValue(
      mockYearSummary({ totalIncome: 5000, totalExpense: 2000, remaining: 2500 })
    );

    const { result } = renderHook(() => useYearLedgerSummary(2026));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.summary.remaining).toBe(2500);
    expect(result.current.summary.remaining).not.toBe(
      result.current.summary.totalIncome - result.current.summary.totalExpense
    );
  });

  test('setYear refetches with new calendar year date range', async() => {
    const { result } = renderHook(() => useYearLedgerSummary(2026));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setYear(2024);
    });

    await waitFor(() => expect(result.current.year).toBe(2024));

    const lastCall = StandardizedApi.get.mock.calls[StandardizedApi.get.mock.calls.length - 1];
    expect(lastCall[0]).toBe(API_ADMIN_FINANCIAL_TRANSACTIONS);
    expect(lastCall[1]).toEqual({
      page: 0,
      size: 1,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });
    expect(lastCall[2]).toEqual({ unwrapApiEnvelope: false });
  });
});

describe('YearEndIncomePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue(mockYearSummary());
  });

  test('loads year summary via financial-transactions for selected calendar year', async() => {
    render(<YearEndIncomePanel initialYear={2026} />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ADMIN_FINANCIAL_TRANSACTIONS,
        expect.objectContaining({
          startDate: '2026-01-01',
          endDate: '2026-12-31'
        }),
        { unwrapApiEnvelope: false }
      );
    });
  });

  test('year select refetches with new calendar year date range', async() => {
    render(<YearEndIncomePanel initialYear={2026} />);

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(FM_TAX_DISCLOSURE.YEAR_LABEL), {
      target: { value: '2024' }
    });

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalledWith(
        API_ADMIN_FINANCIAL_TRANSACTIONS,
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }),
        { unwrapApiEnvelope: false }
      );
    });
  });

  test('shows remaining from envelope.summary (income − expense identity)', async() => {
    StandardizedApi.get.mockResolvedValue(
      mockYearSummary({ totalIncome: 1000000, totalExpense: 400000, remaining: 600000 })
    );

    render(<YearEndIncomePanel initialYear={2026} />);

    await waitFor(() => {
      expect(screen.getByTestId('ledger-summary-income').textContent).toContain('1,000,000원');
    });

    expect(screen.getByTestId('ledger-summary-expense').textContent).toContain('400,000원');
    expect(screen.getByTestId('ledger-summary-remaining').textContent).toContain('600,000원');
    expect(screen.getByText(FM_SUMMARY.REMAINING_LABEL)).toBeInTheDocument();
  });

  test('does not show 순이익 in year-end income panel', async() => {
    render(<YearEndIncomePanel initialYear={2026} />);

    await waitFor(() => {
      expect(screen.getByTestId('operator-ledger-summary')).toBeInTheDocument();
    });

    expect(screen.queryByText('순이익')).not.toBeInTheDocument();
  });
});
