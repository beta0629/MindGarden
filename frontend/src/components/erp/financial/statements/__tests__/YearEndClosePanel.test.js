/**
 * YearEndClosePanel — operator-visible year-end tabs only (slim fold)
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import {
  FM_TAX_DISCLOSURE,
  FM_TAX_YEAR_END_TABS,
  FM_TAX_ACCOUNTANT_TABS,
  FM_SUMMARY
} from '../../../../../constants/financialManagementStrings';

jest.mock('../../../../common/TabChipRow', () => ({
  __esModule: true,
  default: ({ items, activeKey, onChange, ariaLabel }) => (
    <div role="tablist" aria-label={ariaLabel} data-testid="tab-chip-row">
      {items.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeKey === tab.key}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}));

jest.mock('../YearEndBalancePanel', () => ({
  __esModule: true,
  default: () => <div data-testid="year-end-balance-panel">year-end-balance</div>
}));

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

import StandardizedApi from '../../../../../utils/standardizedApi';
import YearEndClosePanel from '../YearEndClosePanel';

const mockYearSummary = {
  success: true,
  summary: {
    totalIncome: 4620000,
    totalExpense: 1540000,
    remaining: 3080000
  }
};

const mockTaxSeries = {
  year: '2026',
  months: Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    vatTotal: 0,
    withholdingTotal: 0,
    expenseVatTotal: 0,
    salaryWithholdingNational: 0,
    salaryWithholdingLocal: 0,
    salaryVat: 0
  })),
  salaryTaxTotals: {
    WITHHOLDING_NATIONAL: 0,
    WITHHOLDING_LOCAL: 0,
    VAT: 0
  }
};

describe('YearEndClosePanel tax disclosure UX', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockImplementation((url) => {
      if (String(url).includes('tax-monthly-series')) {
        return Promise.resolve(mockTaxSeries);
      }
      return Promise.resolve(mockYearSummary);
    });
  });

  test('shows 2 primary tabs (손익, 연말 자산·부채) via TabChipRow', () => {
    render(<YearEndClosePanel />);

    expect(screen.getByTestId('year-end-close-panel')).toBeInTheDocument();
    expect(screen.getByTestId('tab-chip-row')).toBeInTheDocument();

    const primaryTablist = screen.getByRole('tablist', { name: FM_TAX_DISCLOSURE.TITLE });
    const primaryTabs = primaryTablist.querySelectorAll('[role="tab"]');
    expect(primaryTabs).toHaveLength(FM_TAX_YEAR_END_TABS.length);
    expect(FM_TAX_YEAR_END_TABS.length).toBe(2);

    FM_TAX_YEAR_END_TABS.forEach((tab) => {
      expect(screen.getByRole('tab', { name: tab.label })).toBeInTheDocument();
    });
  });

  test('accountant fold and 7 accountant tabs are not rendered', () => {
    render(<YearEndClosePanel />);

    expect(screen.queryByTestId('year-end-accountant-fold')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tax-statements-panel')).not.toBeInTheDocument();
    expect(FM_TAX_ACCOUNTANT_TABS.length).toBe(7);

    FM_TAX_ACCOUNTANT_TABS.forEach((tab) => {
      expect(screen.queryByRole('tab', { name: tab.label })).not.toBeInTheDocument();
    });

    expect(screen.queryByText(FM_TAX_DISCLOSURE.ACCOUNTANT_FOLD_TITLE)).not.toBeInTheDocument();
  });

  test('year-end income panel has no 순이익 and uses ledger summary labels', async () => {
    render(<YearEndClosePanel initialTab="income-statement" />);

    await waitFor(() => {
      expect(screen.getByTestId('year-end-income-panel')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('operator-ledger-summary')).toBeInTheDocument();
    });

    expect(screen.queryByText('순이익')).not.toBeInTheDocument();
    expect(screen.getByText(FM_SUMMARY.INCOME_LABEL)).toBeInTheDocument();
    expect(screen.getByText(FM_SUMMARY.EXPENSE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(FM_SUMMARY.REMAINING_LABEL)).toBeInTheDocument();
  });

  test('balance tab renders YearEndBalancePanel without exposing accountant tabs', () => {
    render(<YearEndClosePanel initialTab="balance-sheet" />);

    expect(screen.getByTestId('year-end-balance-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('tax-statements-panel')).not.toBeInTheDocument();

    FM_TAX_ACCOUNTANT_TABS.forEach((tab) => {
      expect(screen.queryByRole('tab', { name: tab.label })).not.toBeInTheDocument();
    });
  });
});
