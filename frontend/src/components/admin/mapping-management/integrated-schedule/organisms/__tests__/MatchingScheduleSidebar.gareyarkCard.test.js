/**
 * MatchingScheduleSidebar — 가예약(unpaid soft) 카드 항상 렌더
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MatchingScheduleSidebar from '../MatchingScheduleSidebar';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, opts) => {
      if (opts && opts.defaultValue != null) {
        if (typeof opts.defaultValue === 'string' && opts.count != null) {
          return opts.defaultValue.replace('{{count}}', String(opts.count));
        }
        return opts.defaultValue;
      }
      return key;
    }
  })
}));

jest.mock('../../../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('../../../../../dashboard-v2/atoms/SearchInput', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../MatchingScheduleList', () => ({
  __esModule: true,
  default: () => <div data-testid="matching-list" />
}));

jest.mock('../../molecules/DensityToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="density-toggle" />
}));

jest.mock('../../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, preventDoubleClick: _p, ...rest }) => (
    <button type="button" onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}));

jest.mock('../../../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mg-v2-btn'
}));

describe('MatchingScheduleSidebar gareyarkCard', () => {
  const baseProps = {
    isCollapsed: false,
    onToggle: jest.fn(),
    filteredMappings: [],
    loading: false,
    viewFilter: 'new',
    onViewFilterChange: jest.fn(),
    statusFilter: '',
    onStatusFilterChange: jest.fn(),
    getStatusCount: () => 0,
    onScheduleFromCard: jest.fn()
  };

  it('renders 가예약 card chrome even when count is 0', () => {
    const onOpenList = jest.fn();
    render(
      <MatchingScheduleSidebar
        {...baseProps}
        gareyarkCard={{
          count: 0,
          firstPending: null,
          onOpenList,
          onCheckout: jest.fn()
        }}
      />
    );

    const card = screen.getByTestId('integrated-schedule-pending-payment-alert');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('data-sidebar-gareyark-card', 'true');
    expect(screen.getByText('가예약')).toBeInTheDocument();
    expect(screen.getByText('0건')).toBeInTheDocument();

    fireEvent.click(screen.getByText('목록'));
    expect(onOpenList).toHaveBeenCalledTimes(1);
  });

  it('shows count and enables checkout when firstPending exists', () => {
    const onCheckout = jest.fn();
    const firstPending = { id: 42, status: 'PENDING_PAYMENT' };
    render(
      <MatchingScheduleSidebar
        {...baseProps}
        gareyarkCard={{
          count: 2,
          firstPending,
          onOpenList: jest.fn(),
          onCheckout
        }}
      />
    );

    expect(screen.getByText('2건')).toBeInTheDocument();
    fireEvent.click(screen.getByText('당일 결제'));
    expect(onCheckout).toHaveBeenCalledWith(firstPending);
  });

  it('omits card when gareyarkCard prop is not provided', () => {
    render(<MatchingScheduleSidebar {...baseProps} />);
    expect(
      screen.queryByTestId('integrated-schedule-pending-payment-alert')
    ).not.toBeInTheDocument();
  });
});
