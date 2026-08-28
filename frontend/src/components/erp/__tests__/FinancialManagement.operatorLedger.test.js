/**
 * Operator Ledger Phase 2 — FinancialManagement canonical shell tests
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  FM_PAGE_TITLE,
  FM_SUMMARY,
  FM_TAX_DISCLOSURE,
  FM_LEDGER_VIEW_OPTIONS,
  FM_VIEW_TABS
} from '../../../constants/financialManagementStrings';
import { formatKrw } from '../../../utils/erpFinancialAmountStack';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children, ariaLabel }) => (
    <div data-testid="content-area" data-aria-label={ariaLabel}>
      {children}
    </div>
  ),
  ContentHeader: ({ title }) => <header data-testid="content-header">{title}</header>
}));

jest.mock('../shell/ErpPageShell', () => ({
  __esModule: true,
  default: ({ children, mainAriaLabel }) => (
    <div data-testid="erp-page-shell" aria-label={mainAriaLabel}>
      {children}
    </div>
  )
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options, value, onChange, 'aria-label': ariaLabel }) => (
    <div data-testid="badge-select" aria-label={ariaLabel} data-value={value}>
      {(options || []).map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

jest.mock('../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title }) => <div data-testid="empty-state">{title}</div>
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel, 'aria-pressed': ariaPressed }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  )
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ children, title, isOpen }) =>
    (isOpen ? (
      <div data-testid="unified-modal">
        <div>{title}</div>
        {children}
      </div>
    ) : null)
}));

jest.mock('../financial/ledger/LedgerCalendar', () => ({
  __esModule: true,
  default: ({ monthYm }) => (
    <div data-testid="ledger-calendar" data-month-ym={monthYm}>
      ledger-calendar
    </div>
  )
}));

jest.mock('../FinancialTransactionForm', () => ({
  __esModule: true,
  default: ({ modalTitle }) => <div data-testid="money-record-form">{modalTitle || 'form'}</div>
}));

jest.mock('../financial/statements/TaxStatementsPanel', () => ({
  __esModule: true,
  default: ({ activeTab }) => <div data-testid="tax-statements-panel">{activeTab}</div>
}));

const mockSessionUser = { id: 1, name: '운영자', role: 'ADMIN', tenantId: 't1' };

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: mockSessionUser,
    isLoggedIn: true,
    isLoading: false
  })
}));

const mockTransactionsResponse = {
  success: true,
  data: [
    {
      id: 101,
      transactionDate: '2026-08-15',
      transactionType: 'INCOME',
      category: 'CONSULTATION',
      description: '상담료 입금',
      amount: 1500000,
      status: 'APPROVED'
    },
    {
      id: 102,
      transactionDate: '2026-08-16',
      transactionType: 'EXPENSE',
      category: 'RENT',
      description: '임대료',
      amount: 800000,
      status: 'APPROVED'
    }
  ],
  currentPage: 0,
  totalPages: 1,
  totalCount: 2,
  size: 20
};

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../financial/ledger/MonthlyRecurringExpensesPanel', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../utils/sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    show: jest.fn()
  }
}));

import FinancialManagement from '../FinancialManagement';
import RedirectWithSearchHarness from './__fixtures__/RedirectWithSearchHarness';
import StandardizedApi from '../../../utils/standardizedApi';

describe('FinancialManagement Operator Ledger Phase 2', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockImplementation(async(endpoint) => {
      if (String(endpoint).includes('financial-transactions')) {
        return mockTransactionsResponse;
      }
      if (String(endpoint).includes('recurring-expenses')) {
        return { success: true, data: { expenses: [] } };
      }
      return { success: true, data: {} };
    });
    StandardizedApi.post.mockResolvedValue({ success: true });
    StandardizedApi.delete.mockResolvedValue({ success: true });
  });

  it('canonical /erp/financial renders 들어온 돈 · 나간 돈', async() => {
    render(
      <MemoryRouter initialEntries={['/erp/financial']}>
        <Routes>
          <Route path="/erp/financial" element={<FinancialManagement />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: FM_PAGE_TITLE })).toBeInTheDocument();
    });
    expect(screen.getByText(FM_PAGE_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId('operator-ledger')).toBeInTheDocument();
  });

  it('default view has summary strip without 순이익 and without 건', async() => {
    render(
      <MemoryRouter initialEntries={['/erp/financial']}>
        <Routes>
          <Route path="/erp/financial" element={<FinancialManagement />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('operator-ledger-summary')).toBeInTheDocument();
    });

    expect(screen.getByText(FM_SUMMARY.INCOME_LABEL)).toBeInTheDocument();
    expect(screen.getByText(FM_SUMMARY.EXPENSE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(FM_SUMMARY.REMAINING_LABEL)).toBeInTheDocument();
    expect(screen.queryByText('순이익')).not.toBeInTheDocument();

    const summary = screen.getByTestId('operator-ledger-summary');
    expect(summary.textContent).not.toMatch(/\d+건/);
  });

  it('amounts include 원 and ko-KR grouping', async() => {
    expect(formatKrw(1500000)).toBe('1,500,000원');
    expect(formatKrw(800000)).toBe('800,000원');
    expect(formatKrw(1500000)).toContain('원');
    expect(formatKrw(1500000)).toMatch(/,/);

    render(
      <MemoryRouter initialEntries={['/erp/financial']}>
        <Routes>
          <Route path="/erp/financial" element={<FinancialManagement />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      const income = screen.queryByTestId('ledger-summary-income');
      expect(income).toBeTruthy();
      expect(income.textContent).toContain('원');
    });

    // Loaded mock rows → grouped KRW in summary or table
    await waitFor(() => {
      const bodyText = document.body.textContent || '';
      expect(bodyText.includes('1,500,000원') || bodyText.includes('0원')).toBe(true);
      expect(bodyText).toMatch(/\d{1,3}(,\d{3})*원/);
    });
  });

  it('default view does NOT include leading 차변/대변/대차대조표 equal tabs', async() => {
    render(
      <MemoryRouter initialEntries={['/erp/financial']}>
        <Routes>
          <Route path="/erp/financial" element={<FinancialManagement />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('operator-ledger')).toBeInTheDocument();
    });

    expect(screen.queryByRole('tab', { name: '차변' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '대변' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '대차대조표' })).not.toBeInTheDocument();
    expect(screen.queryByText(FM_VIEW_TABS.DASHBOARD)).not.toBeInTheDocument();
    expect(screen.getByText(FM_TAX_DISCLOSURE.TITLE)).toBeInTheDocument();

    FM_LEDGER_VIEW_OPTIONS.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    });
  });

  it('/admin/erp/financial redirects to /erp/financial preserving query', async() => {
    render(
      <MemoryRouter initialEntries={['/admin/erp/financial?period=lastMonth&tax=1']}>
        <RedirectWithSearchHarness />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent(
        '/erp/financial?period=lastMonth&tax=1'
      );
    });
  });

  it('calendar is default and mounts LedgerCalendar inside shared operator-ledger-stage', async() => {
    render(
      <MemoryRouter initialEntries={['/erp/financial']}>
        <Routes>
          <Route path="/erp/financial" element={<FinancialManagement />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('operator-ledger')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('ledger-summary-income').textContent).toContain('1,500,000원');
    });

    expect(screen.getByTestId('operator-ledger-stage')).toBeInTheDocument();
    expect(screen.getByTestId('ledger-calendar')).toBeInTheDocument();
    expect(screen.queryByTestId('financial-calendar-view')).not.toBeInTheDocument();
    expect(screen.getByTestId('operator-ledger-stage')).toContainElement(
      screen.getByTestId('ledger-calendar')
    );

    fireEvent.click(screen.getByText('테이블'));

    await waitFor(() => {
      expect(screen.queryByTestId('ledger-calendar')).not.toBeInTheDocument();
      expect(screen.getByTestId('operator-ledger-table')).toBeInTheDocument();
    });
    expect(screen.getByTestId('operator-ledger-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('financial-calendar-view')).not.toBeInTheDocument();
    expect(screen.getByText(FM_TAX_DISCLOSURE.TITLE)).toBeInTheDocument();
  });
});
