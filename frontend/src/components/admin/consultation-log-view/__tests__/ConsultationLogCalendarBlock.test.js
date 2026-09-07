/**
 * ConsultationLogCalendarBlock — 필터 기간 initialDate 패리티·이벤트 매핑 회귀 가드.
 *
 * @author Core Solution
 * @since 2026-09-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationLogCalendarBlock, {
  computeCalendarInitialDate
} from '../ConsultationLogCalendarBlock';

jest.mock('../../../../utils/consultantColor', () => ({
  getConsultantColor: () => 'var(--mg-v2-color-primary-solid)'
}));

jest.mock('../../../dashboard-v2/content/ContentSection', () => ({
  __esModule: true,
  default: ({ children, className }) => (
    <section data-testid="content-section" className={className}>{children}</section>
  )
}));

jest.mock('../../../dashboard-v2/content/ContentCard', () => ({
  __esModule: true,
  default: ({ children, className }) => (
    <div data-testid="content-card" className={className}>{children}</div>
  )
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>{children}</button>
  )
}));

jest.mock('@fullcalendar/react', () => {
  const ReactLib = require('react');
  return {
    __esModule: true,
    default: ReactLib.forwardRef((props, ref) => (
      <div
        ref={ref}
        data-testid="fullcalendar"
        data-initial-date={props.initialDate ?? ''}
        data-events={JSON.stringify(props.events || [])}
      />
    ))
  };
});

jest.mock('@fullcalendar/daygrid', () => ({}));
jest.mock('@fullcalendar/interaction', () => ({}));

describe('computeCalendarInitialDate', () => {
  test('prefers startDate when set', () => {
    expect(
      computeCalendarInitialDate('2026-08-01', [
        { sessionDate: '2026-07-15' },
        { sessionDate: '2026-08-10' }
      ])
    ).toBe('2026-08-01');
  });

  test('falls back to earliest record date when startDate absent', () => {
    expect(
      computeCalendarInitialDate(null, [
        { sessionDate: '2026-08-18' },
        { consultationDate: '2026-08-01' },
        { sessionDate: '2026-08-10' }
      ])
    ).toBe('2026-08-01');
  });

  test('returns undefined when no startDate and no records', () => {
    expect(computeCalendarInitialDate(undefined, [])).toBeUndefined();
    expect(computeCalendarInitialDate('', null)).toBeUndefined();
  });
});

describe('ConsultationLogCalendarBlock', () => {
  const baseRecords = [
    {
      id: 11,
      sessionDate: '2026-08-05',
      clientId: 1,
      clientName: '내담자A',
      consultantId: 2,
      isSessionCompleted: true
    },
    {
      id: 12,
      sessionDate: '2026-08-12',
      clientId: 3,
      clientName: '내담자B',
      consultantId: 2,
      isSessionCompleted: false
    }
  ];

  test('passes initialDate from startDate to FullCalendar and remount key', () => {
    render(
      <ConsultationLogCalendarBlock
        records={baseRecords}
        onOpenModal={jest.fn()}
        startDate="2026-08-01"
        endDate="2026-08-18"
      />
    );

    const calendar = screen.getByTestId('fullcalendar');
    expect(calendar).toHaveAttribute('data-initial-date', '2026-08-01');
    expect(calendar.closest('[data-calendar-key]')).toHaveAttribute(
      'data-calendar-key',
      '2026-08-01|2026-08-18'
    );
  });

  test('maps allDay events with start only (no same-day exclusive end)', () => {
    render(
      <ConsultationLogCalendarBlock
        records={baseRecords}
        onOpenModal={jest.fn()}
        startDate="2026-08-01"
      />
    );

    const events = JSON.parse(screen.getByTestId('fullcalendar').getAttribute('data-events'));
    expect(events).toHaveLength(2);
    events.forEach((event) => {
      expect(event.start).toMatch(/^2026-08-/);
      expect(event.allDay).toBe(true);
      expect(event.end).toBeUndefined();
    });
  });

  test('uses earliest record date when startDate omitted', () => {
    render(
      <ConsultationLogCalendarBlock
        records={baseRecords}
        onOpenModal={jest.fn()}
      />
    );

    expect(screen.getByTestId('fullcalendar')).toHaveAttribute(
      'data-initial-date',
      '2026-08-05'
    );
  });
});
