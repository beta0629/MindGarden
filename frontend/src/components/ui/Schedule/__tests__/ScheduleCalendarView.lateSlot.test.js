/**
 * ScheduleCalendarView — 주 보기에서 20:00 슬롯과 20:00 시작 일정이 실제로 렌더된다 (실 FullCalendar).
 * 관리자·상담사 공통 캘린더.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { DEFAULT_ZONE, formatDateKeyInZone } from '../../../../utils/zonedDateTime';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

// @fullcalendar/luxon3 may be listed in package.json but absent in CI/agent node_modules.
// This suite renders real FullCalendar, so prefer the real plugin when installed.
jest.mock('@fullcalendar/luxon3', () => {
  try {
    return jest.requireActual('@fullcalendar/luxon3');
  } catch {
    return { __esModule: true, default: { id: 'luxon3' } };
  }
}, {
  virtual: true
});

import ScheduleCalendarView from '../ScheduleCalendarView';

const LATE_TITLE = 'late-2000-schedule';
const LATER_TITLE = 'late-2130-schedule';

/**
 * CI(UTC)와 캘린더(Asia/Seoul)의 달력 날이 어긋나면 로컬 `new Date()` 날짜의 일정이
 * 주 보기 밖에 놓인다. jest.useFakeTimers 는 waitFor 를 멈추므로 Date 생성자와 now 만 고정한다.
 * 2026-10-14T03:00:00.000Z = 서울 2026-10-14 12:00(수). 일~토·월~일 주 모두 이 날을 포함한다.
 */
const FIXED_DATE_ISO = '2026-10-14T03:00:00.000Z';
const RealDate = global.Date;
const FIXED_TS = new RealDate(FIXED_DATE_ISO).getTime();
const SEOUL_DAY = formatDateKeyInZone(new RealDate(FIXED_TS), DEFAULT_ZONE);

class FixedDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super(FIXED_TS);
    } else {
      super(...args);
    }
  }

  static now() {
    return FIXED_TS;
  }

  static parse(...args) {
    return RealDate.parse(...args);
  }

  static UTC(...args) {
    return RealDate.UTC(...args);
  }
}

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
  beforeAll(() => {
    global.Date = FixedDate;
  });

  afterAll(() => {
    global.Date = RealDate;
  });

  test.each(['ADMIN', 'CONSULTANT'])('%s: 20:00 슬롯과 20:00 시작 일정이 보인다', async(role) => {
    const view = await renderWeek(
      [lateEvent(479, LATE_TITLE, `${SEOUL_DAY}T20:00:00`, `${SEOUL_DAY}T20:50:00`)],
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
    const view = await renderWeek(
      [lateEvent(480, LATER_TITLE, `${SEOUL_DAY}T21:30:00`, `${SEOUL_DAY}T22:20:00`)],
      'ADMIN'
    );

    await waitFor(() => {
      expect(view.container.querySelector('.fc-timegrid-slot[data-time="22:00:00"]')).not.toBeNull();
    });
    expect(view.container.querySelector('.fc-timegrid-slot[data-time="23:00:00"]')).toBeNull();
    expect(view.container.textContent).toContain(LATER_TITLE);
  });
});
