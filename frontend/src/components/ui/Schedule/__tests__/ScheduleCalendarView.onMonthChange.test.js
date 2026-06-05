/**
 * ScheduleCalendarView — onMonthChange (FullCalendar datesSet pass-through) 단위 테스트.
 *
 * 검증 매트릭스 (F8~F9):
 *  - F8: onMonthChange 전달 + FullCalendar datesSet 트리거 → { start: Date, end: Date, view: 'dayGridMonth' } 호출
 *  - F9: onMonthChange 미전달 시 에러 없이 무시
 *
 * 전략: FullCalendar 의 react 컴포넌트를 mock 해 datesSet props 를 직접 캡처/호출한다.
 * (실제 FullCalendar 인스턴스는 jsdom 환경에서 렌더링·라이프사이클 부담이 큼.)
 *
 * SSOT: frontend/src/components/ui/Schedule/ScheduleCalendarView.js
 *
 * @author MindGarden core-tester
 * @since 2026-06-09
 */

import React from 'react';
import { render } from '@testing-library/react';

// jsdom 에 ResizeObserver 가 없으므로 ScheduleCalendarView 의 useEffect 가 throw 한다.
// 가벼운 stub 으로 polyfill — 실제 콜백은 호출되지 않아도 datesSet 검증과 무관.
class ResizeObserverStub {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

let lastFullCalendarProps = null;

jest.mock('@fullcalendar/react', () => ({
  __esModule: true,
  default: (props) => {
    // jest.mock factory 의 hoisting 으로 외부 let 가 undefined 일 수 있어
    // globalThis 에 저장한 뒤 test 에서 읽어 안전하게 캡처한다.
    globalThis.__mockFullCalendarProps = props;
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'fullcalendar-mock' });
  }
}));

// FullCalendar plugins — 단순 stub
jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: {} }));

import ScheduleCalendarView from '../ScheduleCalendarView';

const baseProps = (overrides = {}) => ({
  events: [],
  userRole: 'ADMIN',
  onDateClick: () => {},
  onEventClick: () => {},
  onEventDrop: () => {},
  ...overrides
});

beforeEach(() => {
  globalThis.__mockFullCalendarProps = null;
});

describe('ScheduleCalendarView — onMonthChange (datesSet pass-through)', () => {
  // ─── F8 ────────────────────────────────────────────────────────────
  test('F8: onMonthChange 전달 + FullCalendar datesSet 트리거 → { start, end, view } 호출', () => {
    const onMonthChange = jest.fn();
    render(<ScheduleCalendarView {...baseProps({ onMonthChange })} />);

    const captured = globalThis.__mockFullCalendarProps;
    expect(captured).not.toBeNull();
    expect(typeof captured.datesSet).toBe('function');

    const start = new Date('2026-05-31T00:00:00.000Z');
    const end = new Date('2026-07-05T00:00:00.000Z');
    captured.datesSet({ start, end, view: { type: 'dayGridMonth' } });

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange).toHaveBeenCalledWith({
      start,
      end,
      view: 'dayGridMonth'
    });
  });

  // ─── F9 ────────────────────────────────────────────────────────────
  test('F9: onMonthChange 미전달 시 에러 없이 무시', () => {
    render(<ScheduleCalendarView {...baseProps()} />);

    const captured = globalThis.__mockFullCalendarProps;
    expect(typeof captured.datesSet).toBe('function');
    // onMonthChange?.() optional chaining 가드 — 호출해도 에러가 발생하면 안 된다
    expect(() => {
      captured.datesSet({
        start: new Date('2026-06-01T00:00:00.000Z'),
        end: new Date('2026-06-30T00:00:00.000Z'),
        view: { type: 'dayGridMonth' }
      });
    }).not.toThrow();
  });
});
