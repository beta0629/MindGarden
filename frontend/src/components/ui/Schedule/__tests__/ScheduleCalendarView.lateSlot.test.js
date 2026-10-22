/**
 * ScheduleCalendarView — 주 보기에서 20:00 슬롯과 20:00 시작 일정이 실제로 렌더된다 (실 FullCalendar).
 * 관리자·상담사 공통 캘린더.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

// 실 FullCalendar 사용 — createPlugin 형태여야 addDefs(deps) 가 깨지지 않음.
// moduleNameMapper stub 과 동일 계약; 형제 테스트의 virtual mock 패턴 유지.
jest.mock('@fullcalendar/luxon3', () => {
  const { createPlugin } = require('@fullcalendar/core');
  return {
    __esModule: true,
    default: createPlugin({ name: '@fullcalendar/luxon3' })
  };
}, {
  virtual: true
});

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import ScheduleCalendarView from '../ScheduleCalendarView';
import { DEFAULT_ZONE, formatDateKeyInZone } from '../../../../utils/zonedDateTime';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

const LATE_TITLE = 'late-2000-schedule';
const LATER_TITLE = 'late-2130-schedule';

/**
 * CI(UTC)와 캘린더(Asia/Seoul)의 달력 날이 어긋나면 로컬 `new Date()` 날짜의 일정이
 * 주 보기 밖에 놓인다. jest.useFakeTimers 는 대기를 멈추므로 Date 생성자와 now 만 고정하고, 대기는 실제 시계로 포기한다.
 * 2026-10-14T03:00:00.000Z = 서울 2026-10-14 12:00(수). 일~토·월~일 주 모두 이 날을 포함한다.
 */
const FIXED_DATE_ISO = '2026-10-14T03:00:00.000Z';
const RealDate = global.Date;
const FIXED_TS = new RealDate(FIXED_DATE_ISO).getTime();
const SEOUL_DAY = formatDateKeyInZone(new RealDate(FIXED_TS), DEFAULT_ZONE);
/** waitFor 는 Date.now 경과로 포기한다. now()를 고정하면 슬롯이 없을 때 5초 행으로 끝난다. */
const SLOT_WAIT_TIMEOUT_MS = 8000;
const SLOT_WAIT_INTERVAL_MS = 50;
const LATE_SLOT_TEST_TIMEOUT_MS = 20000;

class FixedDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super(FIXED_TS);
    } else {
      super(...args);
    }
  }

  /**
   * `new Date()` 는 고정일이라 주 보기가 어긋나지 않는다.
   * 대기는 RealDate.now 로만 재므로 여기서는 달력 시각을 고정한다.
   */
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

/**
 * Date.now 가 고정돼도 실제 시계로 포기한다.
 * 선행 스위트가 fake timer 를 남기면 setTimeout 이 멈추므로 호출 전에 real timer 를 보장한다.
 *
 * @param {() => unknown} assertion
 * @returns {Promise<unknown>}
 */
const waitUntil = async(assertion) => {
  jest.useRealTimers();
  const startedAt = RealDate.now();
  let lastError;
  while (RealDate.now() - startedAt <= SLOT_WAIT_TIMEOUT_MS) {
    try {
      return assertion();
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, SLOT_WAIT_INTERVAL_MS);
    });
  }
  throw lastError;
};

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
  const weekButton = await waitUntil(() => {
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
  jest.setTimeout(LATE_SLOT_TEST_TIMEOUT_MS);

  beforeAll(() => {
    global.Date = FixedDate;
  });

  beforeEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
    global.Date = RealDate;
  });

  test.each(['ADMIN', 'CONSULTANT'])('%s: 20:00 슬롯과 20:00 시작 일정이 보인다', async(role) => {
    const view = await renderWeek(
      [lateEvent(479, LATE_TITLE, `${SEOUL_DAY}T20:00:00`, `${SEOUL_DAY}T20:50:00`)],
      role
    );

    await waitUntil(() => {
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

    await waitUntil(() => {
      expect(view.container.querySelector('.fc-timegrid-slot[data-time="22:00:00"]')).not.toBeNull();
    });
    expect(view.container.querySelector('.fc-timegrid-slot[data-time="23:00:00"]')).toBeNull();
    expect(view.container.textContent).toContain(LATER_TITLE);
  });
});
