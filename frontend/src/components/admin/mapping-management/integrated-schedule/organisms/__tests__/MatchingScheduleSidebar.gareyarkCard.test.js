/**
 * MatchingScheduleSidebar — 가예약(unpaid soft) MappingScheduleCard 섹션
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { fireEvent, render, screen } from '@testing-library/react';
import MatchingScheduleSidebar from '../MatchingScheduleSidebar';
import { MAPPING_STATUS_PENDING_PAYMENT } from '../../../constants/integratedScheduleSidebarFilterConstants';

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
  default: ({ mappings }) => (
    <div
      data-testid="matching-list"
      data-mapping-count={Array.isArray(mappings) ? mappings.length : 0}
    />
  )
}));

jest.mock('../../molecules/DensityToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="density-toggle" />
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

  it('renders 가예약 MappingScheduleList section chrome even when mappings is empty', () => {
    const onOpenList = jest.fn();
    render(
      <MatchingScheduleSidebar
        {...baseProps}
        gareyarkCard={{
          mappings: [],
          onOpenList,
          onCheckout: jest.fn()
        }}
      />
    );

    const section = screen.getByTestId('integrated-schedule-gareyark-section');
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('data-sidebar-gareyark-card', 'true');
    expect(section).toHaveAttribute(
      'data-legacy-testid',
      'integrated-schedule-pending-payment-alert'
    );
    expect(screen.getByText('가예약')).toBeInTheDocument();
    expect(screen.getByText('0건')).toBeInTheDocument();

    const lists = screen.getAllByTestId('matching-list');
    const gareyarkList = lists.find((el) => el.getAttribute('data-mapping-count') === '0');
    expect(gareyarkList).toBeTruthy();

    fireEvent.click(screen.getByText('목록'));
    expect(onOpenList).toHaveBeenCalledTimes(1);
  });

  it('passes unpaid soft mappings into MatchingScheduleList and derives count from length', () => {
    const onCheckoutSameDay = jest.fn();
    const unpaidRows = [
      { id: 11, status: MAPPING_STATUS_PENDING_PAYMENT },
      { id: 12, status: MAPPING_STATUS_PENDING_PAYMENT }
    ];
    render(
      <MatchingScheduleSidebar
        {...baseProps}
        onCheckoutSameDay={onCheckoutSameDay}
        gareyarkCard={{
          mappings: unpaidRows,
          onOpenList: jest.fn()
        }}
      />
    );

    expect(screen.getByText('2건')).toBeInTheDocument();
    const lists = screen.getAllByTestId('matching-list');
    const gareyarkList = lists.find((el) => el.getAttribute('data-mapping-count') === '2');
    expect(gareyarkList).toBeTruthy();
  });

  it('omits section when gareyarkCard prop is not provided', () => {
    render(<MatchingScheduleSidebar {...baseProps} />);
    expect(
      screen.queryByTestId('integrated-schedule-gareyark-section')
    ).not.toBeInTheDocument();
  });

  it('source has no hardcoded client names or mapping id 279', () => {
    const sidebarPath = path.join(__dirname, '..', 'MatchingScheduleSidebar.js');
    const schedulePath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'IntegratedMatchingSchedule.js'
    );
    const sidebarSrc = fs.readFileSync(sidebarPath, 'utf8');
    const scheduleSrc = fs.readFileSync(schedulePath, 'utf8');
    expect(sidebarSrc).not.toMatch(/김아영|남혜진/);
    expect(scheduleSrc).not.toMatch(/김아영|남혜진/);
    expect(sidebarSrc).not.toMatch(/\b279\b/);
    expect(scheduleSrc).not.toMatch(/mappings:\s*\[/);
    expect(sidebarSrc).toMatch(/MatchingScheduleList/);
    expect(sidebarSrc).toMatch(/gareyarkCard\.mappings/);
    expect(sidebarSrc).not.toMatch(/pending-payment-alert--sidebar/);
    expect(sidebarSrc).not.toMatch(/renderGareyarkCard/);
  });
});
