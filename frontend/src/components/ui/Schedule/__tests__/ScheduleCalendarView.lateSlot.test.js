/**
 * ScheduleCalendarView — 주 보기에서 20:00 슬롯과 20:00 시작 일정이 실제로 렌더된다 (실 FullCalendar).
 * 관리자·상담사 공통 캘린더.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import ScheduleCalendarView from '../ScheduleCalendarView';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

const LATE_TITLE = 'late-2000-schedule';
const LATER_TITLE = 'late-2130-schedule';

const ymd = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0')
].join('-');

const lateEvent = (id, title, start, end) => ({
  id,
  title,
  start,
  end,
  extendedProps: { id, status: 'CONFIRMED', clientName: title, consultantName: 'c' }
});

const renderWeek = async(events, userRole) => {
  const view = render(
    <ScheduleCalendarView
      events={events}
      userRole={userRole}
      onDateClick={jest.fn()}
      onEventClick={jest.fn()}
      onEventDrop={jest.fn()}
    />
  );
  const weekButton = await waitFor(() => {
    const button = view.container.querySelector('.fc-timeGridWeek-button');
    expect(button).not.toBeNull();
    return button;
  });
  await act(async() => {
    fireEvent.click(weekButton);
  });
  return view;
};

describe('ScheduleCalendarView — 20시 이후 슬롯 (주 보기)', () => {
  test.each(['ADMIN', 'CONSULTANT'])('%s: 20:00 슬롯과 20:00 시작 일정이 보인다', async(role) => {
    const today = ymd(new Date());
    const view = await renderWeek(
      [lateEvent(479, LATE_TITLE, `${today}T20:00:00`, `${today}T20:50:00`)],
      role
    );

    await waitFor(() => {
      expect(view.container.querySelector('.fc-timegrid-slot[data-time="20:00:00"]')).not.toBeNull();
    });
    expect(view.container.querySelector('.fc-timegrid-slot[data-time="20:30:00"]')).not.toBeNull();
    expect(view.container.querySelector('.fc-timegrid-event')).not.toBeNull();
    expect(view.container.textContent).toContain(LATE_TITLE);
  });

  test('더 늦은 일정(21:30)이 있으면 시간축이 그 종료 정시까지 넓어진다', async() => {
    const today = ymd(new Date());
    const view = await renderWeek(
      [lateEvent(480, LATER_TITLE, `${today}T21:30:00`, `${today}T22:20:00`)],
      'ADMIN'
    );

    await waitFor(() => {
      expect(view.container.querySelector('.fc-timegrid-slot[data-time="22:00:00"]')).not.toBeNull();
    });
    expect(view.container.querySelector('.fc-timegrid-slot[data-time="23:00:00"]')).toBeNull();
    expect(view.container.textContent).toContain(LATER_TITLE);
  });
});
