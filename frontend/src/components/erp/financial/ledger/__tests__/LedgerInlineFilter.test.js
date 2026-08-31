/**
 * LedgerInlineFilter — filter toolbar (custom date chip, category field)
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FM_FILTER,
  FM_FILTER_DATE_RANGE_OPTIONS,
  FM_PERIOD
} from '../../../../../constants/financialManagementStrings';
import LedgerInlineFilter from '../LedgerInlineFilter';

jest.mock('../../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options, value, onChange, 'aria-label': ariaLabel }) => (
    <div data-testid={`badge-select-${ariaLabel || 'default'}`} aria-label={ariaLabel}>
      {(options || []).map((opt) => (
        <button
          key={opt.value}
          type="button"
          data-selected={value === opt.value ? 'true' : 'false'}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, 'aria-label': ariaLabel }) => (
    <button type="button" onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  )
}));

const defaultFilters = {
  searchText: '',
  transactionType: 'ALL',
  category: 'ALL',
  dateRange: 'MONTH',
  startDate: '2026-08-01',
  endDate: '2026-08-31'
};

describe('LedgerInlineFilter custom date chip', () => {
  test('renders 직접 chip in filter toolbar', () => {
    render(
      <LedgerInlineFilter
        filters={defaultFilters}
        onFiltersChange={() => {}}
        viewMode="calendar"
        onViewModeChange={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: '직접' })).toBeInTheDocument();
  });

  test('clicking 직접 calls onPeriodChange with FM_PERIOD.CUSTOM', () => {
    const onPeriodChange = jest.fn();
    render(
      <LedgerInlineFilter
        filters={defaultFilters}
        onFiltersChange={() => {}}
        viewMode="calendar"
        onViewModeChange={() => {}}
        onPeriodChange={onPeriodChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '직접' }));
    expect(onPeriodChange).toHaveBeenCalledWith(FM_PERIOD.CUSTOM);
  });

  test('shows start/end date inputs when dateRange is CUSTOM', () => {
    render(
      <LedgerInlineFilter
        filters={{ ...defaultFilters, dateRange: 'CUSTOM' }}
        onFiltersChange={() => {}}
        viewMode="calendar"
        onViewModeChange={() => {}}
        onPeriodChange={() => {}}
      />
    );
    expect(screen.getByLabelText(FM_FILTER.START_DATE)).toBeInTheDocument();
    expect(screen.getByLabelText(FM_FILTER.END_DATE)).toBeInTheDocument();
  });

  test('직접 chip is selected when dateRange is CUSTOM', () => {
    render(
      <LedgerInlineFilter
        filters={{ ...defaultFilters, dateRange: 'CUSTOM' }}
        onFiltersChange={() => {}}
        viewMode="calendar"
        onViewModeChange={() => {}}
        onPeriodChange={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: '직접' })).toHaveAttribute('data-selected', 'true');
  });

  test('FM_FILTER_DATE_RANGE_OPTIONS contains only CUSTOM 직접 entry', () => {
    expect(FM_FILTER_DATE_RANGE_OPTIONS).toEqual([
      { value: FM_PERIOD.CUSTOM, label: '직접' }
    ]);
  });
});

describe('LedgerInlineFilter category field layout', () => {
  test('category field uses full-row modifier class', () => {
    const { container } = render(
      <LedgerInlineFilter
        filters={defaultFilters}
        onFiltersChange={() => {}}
        viewMode="calendar"
        onViewModeChange={() => {}}
      />
    );
    expect(
      container.querySelector('.operator-ledger-toolbar__field--category')
    ).toBeInTheDocument();
  });
});
