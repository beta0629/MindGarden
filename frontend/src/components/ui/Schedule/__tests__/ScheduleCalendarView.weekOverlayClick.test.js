/**
 * ScheduleCalendarView — 주간/일간 뷰에서 주말·평일 08:00~09:00 일정 클릭 가능 (비영업 오버레이 가림 회귀).
 *
 * businessHours(월~금 09:00~) 밖 구간(주말 전체·평일 08:00~09:00)은 FullCalendar 가
 * .fc-timegrid-col-bg 안에 .fc-non-business 를 깐다. 일정 레이어(.fc-timegrid-col-events)가
 * 그 배경 레이어보다 z-index 가 낮으면 해당 구간 일정 위를 비영업 오버레이가 덮어 클릭이 막힌다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */

import React from 'react';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

jest.mock('@fullcalendar/react', () => {
  const React = require('react');
  const Mock = React.forwardRef((props, ref) => {
    globalThis.__FC_WEEK_OVERLAY_PROPS = props;
    if (ref && typeof ref === 'object') {
      ref.current = { getApi: () => ({ updateSize: jest.fn(), changeView: jest.fn(), gotoDate: jest.fn() }) };
    }
    return React.createElement('div', { 'data-testid': 'fullcalendar-mock' });
  });
  Mock.displayName = 'FullCalendarMock';
  return { __esModule: true, default: Mock };
});

jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: {} }));

import ScheduleCalendarView from '../ScheduleCalendarView';

const CALENDAR_CSS_PATH = path.resolve(__dirname, '..', 'ScheduleCalendarView.css');
const FC_TIMEGRID_CSS_PATH = path.resolve(
  __dirname, '..', '..', '..', '..', '..', 'node_modules', '@fullcalendar', 'timegrid', 'internal.js'
);
const SATURDAY = 6;
const SUNDAY = 0;

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 선택자 블록의 z-index (마지막 선언 기준) */
const readZIndex = (cssText, selector) => {
  const re = new RegExp(`${escapeRegExp(selector)}\\s*\\{([^}]*)\\}`, 'g');
  let value = null;
  let match = re.exec(cssText);
  while (match) {
    const z = /z-index\s*:\s*(-?\d+)/.exec(match[1]);
    if (z) {
      value = Number(z[1]);
    }
    match = re.exec(cssText);
  }
  return value;
};

const localDate = (y, m, d, hh, mm) => new Date(y, m - 1, d, hh, mm, 0, 0);

const baseProps = (overrides = {}) => ({
  events: [],
  userRole: 'ADMIN',
  onDateClick: jest.fn(),
  onEventClick: jest.fn(),
  onEventDrop: jest.fn(),
  ...overrides
});

describe('ScheduleCalendarView — 주간 비영업 오버레이가 일정 클릭을 가리지 않음', () => {
  afterEach(() => {
    delete globalThis.__FC_WEEK_OVERLAY_PROPS;
  });

  test('일정 레이어 z-index 가 FullCalendar 배경 레이어(비영업 오버레이 포함)보다 높다', () => {
    const calendarCss = fs.readFileSync(CALENDAR_CSS_PATH, 'utf8');
    const fcCss = fs.readFileSync(FC_TIMEGRID_CSS_PATH, 'utf8');

    const eventsZ = readZIndex(calendarCss, '.mg-v2-schedule-calendar-view .fc-timegrid-col-events');
    const bgZ = readZIndex(fcCss, '.fc .fc-timegrid-col-bg');
    const fcEventsZ = readZIndex(fcCss, '.fc .fc-timegrid-col-events');

    expect(bgZ).not.toBeNull();
    expect(eventsZ).not.toBeNull();
    expect(eventsZ).toBeGreaterThan(bgZ);
    expect(eventsZ).toBeGreaterThanOrEqual(fcEventsZ);
  });

  test('비영업 오버레이 구간 = 주말 전체·평일 09:00 이전 (08:00 부터 표시)', () => {
    render(<ScheduleCalendarView {...baseProps()} />);
    const props = globalThis.__FC_WEEK_OVERLAY_PROPS;

    expect(props.businessHours.daysOfWeek).not.toContain(SATURDAY);
    expect(props.businessHours.daysOfWeek).not.toContain(SUNDAY);
    expect(props.businessHours.startTime).toBe('09:00');
    expect(props.slotMinTime).toBe('08:00:00');
  });

  test.each([
    ['토요일 14:00', localDate(2026, 10, 3, 14, 0), localDate(2026, 10, 3, 15, 0)],
    ['일요일 10:00', localDate(2026, 10, 4, 10, 0), localDate(2026, 10, 4, 11, 0)],
    ['평일 08:30', localDate(2026, 10, 5, 8, 30), localDate(2026, 10, 5, 9, 20)]
  ])('%s 일정 클릭 → onEventClick 전달', (_label, start, end) => {
    const onEventClick = jest.fn();
    const event = { id: 'sch-1', start, end, extendedProps: { status: 'BOOKED' } };
    render(<ScheduleCalendarView {...baseProps({ events: [event], onEventClick })} />);
    const props = globalThis.__FC_WEEK_OVERLAY_PROPS;

    expect(props.events).toContain(event);
    const clickInfo = { event, view: { type: 'timeGridWeek' } };
    props.eventClick(clickInfo);

    expect(onEventClick).toHaveBeenCalledWith(clickInfo);
  });
});
