/**
 * YearEndClosePanel — primary year-end tabs + secondary accountant fold tests
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  FM_TAX_DISCLOSURE,
  FM_TAX_YEAR_END_TABS,
  FM_TAX_ACCOUNTANT_TABS,
  FM_SUMMARY
} from '../../../../../constants/financialManagementStrings';

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, role, 'aria-selected': ariaSelected }) => (
    <button type="button" role={role} aria-selected={ariaSelected} onClick={onClick}>
      {children}
    </button>
  )
}));

jest.mock('../../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../YearEndBalancePanel', () => ({
  __esModule: true,
  default: () => <div data-testid="year-end-balance-panel">year-end-balance</div>
}));

jest.mock('../TaxStatementsPanel', () => ({
  __esModule: true,
  default: ({ activeTab }) => <div data-testid="tax-statements-panel">{activeTab}</div>
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

describe('YearEndClosePanel tax disclosure UX', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockResolvedValue(mockYearSummary);
  });

  test('shows 2 primary tabs (손익, 연말 자산·부채), not 9 equal accountant tabs', () => {
    render(<YearEndClosePanel />);

    expect(screen.getByTestId('year-end-close-panel')).toBeInTheDocument();

    const primaryTablist = screen.getAllByRole('tablist')[0];
    const primaryTabs = primaryTablist.querySelectorAll('[role="tab"]');
    expect(primaryTabs).toHaveLength(FM_TAX_YEAR_END_TABS.length);
    expect(FM_TAX_YEAR_END_TABS.length).toBe(2);

    FM_TAX_YEAR_END_TABS.forEach((tab) => {
      expect(screen.getByRole('tab', { name: tab.label })).toBeInTheDocument();
    });

    FM_TAX_ACCOUNTANT_TABS.forEach((tab) => {
      expect(screen.queryByRole('tab', { name: tab.label })).not.toBeInTheDocument();
    });
  });

  test('year-end income panel has no 순이익 and uses ledger summary labels', async() => {
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

  test('balance tab renders YearEndBalancePanel without exposing accountant tabs', async() => {
    render(<YearEndClosePanel initialTab="balance-sheet" />);

    expect(screen.getByTestId('year-end-balance-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('tax-statements-panel')).not.toBeInTheDocument();

    FM_TAX_ACCOUNTANT_TABS.forEach((tab) => {
      expect(screen.queryByRole('tab', { name: tab.label })).not.toBeInTheDocument();
    });
  });

  test('7 accountant tabs are hidden until secondary fold is expanded', async() => {
    render(<YearEndClosePanel />);

    expect(screen.getByTestId('year-end-accountant-fold')).toBeInTheDocument();
    expect(screen.queryByTestId('tax-statements-panel')).not.toBeInTheDocument();
    expect(FM_TAX_ACCOUNTANT_TABS.length).toBe(7);

    FM_TAX_ACCOUNTANT_TABS.forEach((tab) => {
      expect(screen.queryByRole('tab', { name: tab.label })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(FM_TAX_DISCLOSURE.ACCOUNTANT_FOLD_TITLE));

    await waitFor(() => {
      expect(screen.getByTestId('tax-statements-panel')).toBeInTheDocument();
    });

    FM_TAX_ACCOUNTANT_TABS.forEach((tab) => {
      expect(screen.getByRole('tab', { name: tab.label })).toBeInTheDocument();
    });

    const tablists = screen.getAllByRole('tablist');
    expect(tablists.length).toBeGreaterThanOrEqual(2);
  });
});
