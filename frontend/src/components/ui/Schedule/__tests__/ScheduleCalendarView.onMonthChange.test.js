/**
 * ScheduleCalendarView — onMonthChange (FullCalendar datesSet pass-through) 단위 테스트.
 *
 * 검증 매트릭스 (F8~F9):
 *  - F8: onMonthChange 전달 + FullCalendar datesSet 트리거 → { start: Date, end: Date,
 *        activeStart: Date, view: 'dayGridMonth' } 호출 (2026-06-09 R3 보강).
 *  - F9: onMonthChange 미전달 시 에러 없이 무시.
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

// FullCalendar mock — forwardRef 로 ref warning 제거 + props 캡처
jest.mock('@fullcalendar/react', () => {
  const React = require('react');
  const Mock = React.forwardRef((props, ref) => {
    // props 를 globalThis 배열에 push (jest.mock factory hoisting 제약 우회)
    if (!globalThis.__FC_PROPS_LOG) globalThis.__FC_PROPS_LOG = [];
    globalThis.__FC_PROPS_LOG.push(props);
    if (ref) {
      const api = { getApi: () => ({ updateSize: () => {} }) };
      if (typeof ref === 'function') ref(api);
      else if (typeof ref === 'object') ref.current = api;
    }
    return React.createElement('div', { 'data-testid': 'fullcalendar-mock' });
  });
  Mock.displayName = 'FullCalendarMock';
  return { __esModule: true, default: Mock };
});

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

const getLastFullCalendarProps = () => {
  const log = globalThis.__FC_PROPS_LOG || [];
  // datesSet 함수가 들어있는 마지막 props 반환 (refresh / placeholder render 회피)
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i] && typeof log[i].datesSet === 'function') return log[i];
  }
  return log.length > 0 ? log[log.length - 1] : null;
};

beforeEach(() => {
  globalThis.__FC_PROPS_LOG = [];
});

describe('ScheduleCalendarView — onMonthChange (datesSet pass-through)', () => {
  // ─── F8 ────────────────────────────────────────────────────────────
  test('F8: onMonthChange 전달 + FullCalendar datesSet 트리거 → { start, end, activeStart, view } 호출', () => {
    const onMonthChange = jest.fn();
    render(<ScheduleCalendarView {...baseProps({ onMonthChange })} />);

    const captured = getLastFullCalendarProps();
    expect(captured).toBeTruthy();
    expect(typeof captured.datesSet).toBe('function');

    // FullCalendar 실제 동작: April 보기 → start 는 표시 첫 셀(이전 달 일요일).
    //                          view.activeStart 는 활성 월 1일.
    const start = new Date('2026-03-29T00:00:00.000Z');
    const end = new Date('2026-05-10T00:00:00.000Z');
    const activeStart = new Date('2026-04-01T00:00:00.000Z');
    captured.datesSet({ start, end, view: { type: 'dayGridMonth', activeStart } });

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(onMonthChange).toHaveBeenCalledWith({
      start,
      end,
      activeStart,
      view: 'dayGridMonth'
    });
  });

  // ─── F9 ────────────────────────────────────────────────────────────
  test('F9: onMonthChange 미전달 시 에러 없이 무시', () => {
    render(<ScheduleCalendarView {...baseProps()} />);

    const captured = getLastFullCalendarProps();
    expect(captured).toBeTruthy();
    expect(typeof captured.datesSet).toBe('function');
    // onMonthChange?.() optional chaining 가드 — 호출해도 에러가 발생하면 안 된다
    expect(() => {
      captured.datesSet({
        start: new Date('2026-06-01T00:00:00.000Z'),
        end: new Date('2026-06-30T00:00:00.000Z'),
        view: { type: 'dayGridMonth', activeStart: new Date('2026-06-01T00:00:00.000Z') }
      });
    }).not.toThrow();
  });
});
