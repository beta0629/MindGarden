/**
 * MonthlyRecurringExpensesPanel — collapsible quiet panel tests
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { FM_RECURRING } from '../../../../../constants/financialManagementStrings';
import MonthlyRecurringExpensesPanel from '../MonthlyRecurringExpensesPanel';

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}));

jest.mock('../../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children }) => (isOpen ? <div data-testid="recurring-modal">{children}</div> : null)
}));

jest.mock('../../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: () => <select data-testid="badge-select" />
}));

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

import StandardizedApi from '../../../../../utils/standardizedApi';

const mockRules = [
  {
    id: 1,
    expenseName: '월 임대료',
    amount: 1000000,
    category: 'RENT',
    recurrenceDay: 1,
    startDate: '2026-01-01',
    autoProcess: true,
    isActive: true
  },
  {
    id: 2,
    expenseName: '카드대금',
    amount: 0,
    category: 'CARD',
    recurrenceDay: 15,
    startDate: '2026-01-01',
    autoProcess: false,
    isActive: true,
    missingMonths: ['2026-09']
  }
];

describe('MonthlyRecurringExpensesPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    StandardizedApi.get.mockImplementation((endpoint) => {
      if (String(endpoint).includes('recurring-expenses')) {
        return Promise.resolve({ success: true, data: { expenses: mockRules } });
      }
      return Promise.resolve({ success: true, data: { expenseCategories: [] } });
    });
    StandardizedApi.post.mockResolvedValue({ success: true });
  });

  it('renders collapsed by default with rule count summary', async() => {
    render(<MonthlyRecurringExpensesPanel />);

    expect(screen.getByText(FM_RECURRING.TITLE)).toBeInTheDocument();
    expect(screen.queryByText(FM_RECURRING.CAPTION)).not.toBeInTheDocument();
    expect(screen.queryByText(FM_RECURRING.ADD)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(`${FM_RECURRING.COLLAPSED_SUMMARY(2)} · ${FM_RECURRING.COLLAPSED_MISSING_SUMMARY(1)}`)).toBeInTheDocument();
    });
  });

  it('expands panel on header click and shows recurring list', async() => {
    render(<MonthlyRecurringExpensesPanel />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: FM_RECURRING.TOGGLE_EXPAND }));

    expect(screen.getByText(FM_RECURRING.CAPTION)).toBeInTheDocument();
    expect(screen.getByText(FM_RECURRING.ADD)).toBeInTheDocument();
    expect(screen.getByText('월 임대료')).toBeInTheDocument();
    expect(screen.getByText(FM_RECURRING.MISSING_SECTION_TITLE)).toBeInTheDocument();
  });

  it('supports keyboard toggle via header button', async() => {
    render(<MonthlyRecurringExpensesPanel />);

    await waitFor(() => {
      expect(StandardizedApi.get).toHaveBeenCalled();
    });

    const toggle = screen.getByRole('button', { name: FM_RECURRING.TOGGLE_EXPAND });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute('aria-label', FM_RECURRING.TOGGLE_COLLAPSE);
  });
});
