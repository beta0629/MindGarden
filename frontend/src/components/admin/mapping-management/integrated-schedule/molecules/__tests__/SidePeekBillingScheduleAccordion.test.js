/**
 * SidePeekBillingScheduleAccordion — 일정 상세 아코디언 테스트
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import SidePeekBillingScheduleAccordion from '../SidePeekBillingScheduleAccordion';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (options && options.defaultValue) || key
  })
}));

jest.mock('../../../../../common/StatusBadge', () => ({
  __esModule: true,
  default: ({ status, children, ...rest }) => (
    <span data-testid={rest['data-testid'] || 'status-badge'} data-status={status}>
      {children ?? status}
    </span>
  )
}));

describe('SidePeekBillingScheduleAccordion', () => {
  it('returns null when there are no schedules', () => {
    const { container } = render(
      <SidePeekBillingScheduleAccordion consultationSchedules={[]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps schedule detail collapsed by default and expands table without glance', () => {
    render(
      <SidePeekBillingScheduleAccordion
        consultationSchedules={[
          {
            id: 1,
            date: '2026-08-15',
            startTime: '10:00',
            status: 'COMPLETED',
            sessionSequence: 1
          },
          {
            id: 2,
            date: '2026-09-03',
            startTime: '11:00',
            status: 'BOOKED'
          }
        ]}
      />
    );

    expect(screen.getByTestId('side-peek-billing-schedule-accordion')).toBeInTheDocument();
    expect(screen.getByTestId('side-peek-billing-schedule-toggle')).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.queryByTestId('side-peek-billing-schedule-glance')).not.toBeInTheDocument();
    expect(screen.queryByTestId('side-peek-billing-schedule-list')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('side-peek-billing-schedule-toggle'));

    expect(screen.getByTestId('side-peek-billing-schedule-toggle')).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(screen.queryByTestId('side-peek-billing-schedule-glance')).not.toBeInTheDocument();

    const table = screen.getByTestId('side-peek-billing-schedule-list');
    expect(table.tagName).toBe('TABLE');
    expect(within(table).getByRole('columnheader', { name: '일시' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: '상태' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: '회차' })).toBeInTheDocument();
    expect(table).toHaveTextContent('8/15');
    expect(table).toHaveTextContent('10:00');
    expect(table).toHaveTextContent('완료');
    expect(table).toHaveTextContent('1회차');
    expect(table).toHaveTextContent('9/3');
    expect(table).toHaveTextContent('11:00');
    expect(table).toHaveTextContent('예약');
    expect(screen.getByTestId('side-peek-billing-schedule-status-1')).toHaveAttribute(
      'data-status',
      'COMPLETED'
    );
  });
});
