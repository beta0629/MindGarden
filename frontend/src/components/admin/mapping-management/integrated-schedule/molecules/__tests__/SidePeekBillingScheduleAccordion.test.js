/**
 * SidePeekBillingScheduleAccordion — 일정 상세 아코디언 테스트
 *
 * @author CoreSolution
 * @since 2026-09-15
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('keeps schedule detail collapsed by default and expands list without glance', () => {
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
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('8/15');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('10:00');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('완료');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('1회차');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('9/3');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('11:00');
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent('예약');
    expect(screen.getByTestId('side-peek-billing-schedule-status-1')).toHaveAttribute(
      'data-status',
      'COMPLETED'
    );
  });
});
