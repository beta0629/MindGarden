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

describe('SidePeekBillingScheduleAccordion', () => {
  it('returns null when there are no schedules', () => {
    const { container } = render(
      <SidePeekBillingScheduleAccordion consultationSchedules={[]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps schedule detail collapsed by default and expands on toggle', () => {
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
    expect(screen.getByTestId('side-peek-billing-schedule-glance')).toHaveTextContent(
      '8월 15일 · 9월 3일'
    );
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent(
      '8/15 · 10:00 · 완료 · 1회차'
    );
    expect(screen.getByTestId('side-peek-billing-schedule-list')).toHaveTextContent(
      '9/3 · 11:00 · 예약'
    );
  });
});
