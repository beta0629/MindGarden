/**
 * ScheduleCalendarView — 드래그 중 과거 시각 칸은 놓을 수 없음(eventAllow=false),
 * 그 칸에서 놓으면 사유 안내(onEventMoveRejected). 지난 일정은 미래 칸으로도 이동 불가.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import React from 'react';
import { act, render } from '@testing-library/react';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

jest.mock('@fullcalendar/react', () => {
  const React = require('react');
  const Mock = React.forwardRef((props, ref) => {
    globalThis.__FC_MOVE_PROPS = props;
    if (ref && typeof ref === 'object') {
      ref.current = { getApi: () => ({ updateSize: () => {}, changeView: () => {}, gotoDate: () => {} }) };
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

const hoursFromNow = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

const renderView = (overrides = {}) => {
  const props = {
    events: [],
    userRole: 'ADMIN',
    onDateClick: jest.fn(),
    onEventClick: jest.fn(),
    onEventDrop: jest.fn(),
    onEventMoveRejected: jest.fn(),
    ...overrides
  };
  render(<ScheduleCalendarView {...props} />);
  return { props, fc: globalThis.__FC_MOVE_PROPS };
};

const bookedEvent = (start) => ({
  extendedProps: { status: 'CONFIRMED', slotDragLocked: false },
  start,
  end: new Date(start.getTime() + 50 * 60 * 1000),
  allDay: false
});

describe('ScheduleCalendarView 과거 시각 이동 차단', () => {
  test('미래 일정을 과거 칸에 놓으면 놓을 수 없음 → 드래그 종료 시 사유 안내, onEventDrop 없음', () => {
    const { props, fc } = renderView();
    expect(typeof fc.eventDragStart).toBe('function');
    expect(typeof fc.eventDragStop).toBe('function');

    act(() => {
      fc.eventDragStart();
    });
    const allowed = fc.eventAllow({ start: hoursFromNow(-3), allDay: false }, bookedEvent(hoursFromNow(24)));
    expect(allowed).toBe(false);

    act(() => {
      fc.eventDragStop();
    });
    expect(props.onEventMoveRejected).toHaveBeenCalledTimes(1);
    expect(props.onEventMoveRejected).toHaveBeenCalledWith(expect.stringContaining('일정을 옮길 수 없습니다'));
    expect(props.onEventDrop).not.toHaveBeenCalled();
  });

  test('이미 지난 일정을 미래 칸으로 → 놓을 수 없음(원본 잠금), 목적지 사유 안내 없음', () => {
    const { props, fc } = renderView();
    act(() => {
      fc.eventDragStart();
    });
    const allowed = fc.eventAllow({ start: hoursFromNow(48), allDay: false }, bookedEvent(hoursFromNow(-30)));
    expect(allowed).toBe(false);

    act(() => {
      fc.eventDragStop();
    });
    expect(props.onEventMoveRejected).not.toHaveBeenCalled();
    expect(props.onEventDrop).not.toHaveBeenCalled();
  });

  test('과거 칸을 지나 미래 칸에서 놓으면 마지막 판정(허용) 기준 → 안내 없음', () => {
    const { props, fc } = renderView();
    act(() => {
      fc.eventDragStart();
    });
    const original = bookedEvent(hoursFromNow(24));
    expect(fc.eventAllow({ start: hoursFromNow(-2), allDay: false }, original)).toBe(false);
    expect(fc.eventAllow({ start: hoursFromNow(30), allDay: false }, original)).toBe(true);
    act(() => {
      fc.eventDragStop();
    });
    expect(props.onEventMoveRejected).not.toHaveBeenCalled();
  });

  test('완료 일정은 미래 칸이어도 잠금 유지', () => {
    const { fc } = renderView();
    const completed = {
      extendedProps: { status: 'COMPLETED', slotDragLocked: true },
      start: hoursFromNow(-30),
      end: hoursFromNow(-29)
    };
    expect(fc.eventAllow({ start: hoursFromNow(48), allDay: false }, completed)).toBe(false);
  });
});
