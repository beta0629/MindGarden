/**
 * ScheduleCalendarView — FullCalendar now / past·today 가 serverClock getNow 를 쓰는지
 *
 * @author CoreSolution
 * @since 2026-10-14
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

jest.mock('../../../../utils/serverClock', () => {
  const serverNow = new Date('2026-10-14T06:00:00.000Z');
  const mockGetNow = jest.fn(() => serverNow);
  return {
    __esModule: true,
    getNow: mockGetNow,
    syncServerClock: jest.fn(),
    isServerClockSynced: jest.fn(() => true)
  };
});

jest.mock('@fullcalendar/react', () => {
  const ReactLocal = require('react');
  const Mock = ReactLocal.forwardRef((props, ref) => {
    if (!globalThis.__FC_SERVER_CLOCK_PROPS) globalThis.__FC_SERVER_CLOCK_PROPS = [];
    globalThis.__FC_SERVER_CLOCK_PROPS.push(props);
    if (ref) {
      const api = { getApi: () => ({ updateSize: jest.fn(), changeView: jest.fn(), gotoDate: jest.fn() }) };
      if (typeof ref === 'function') ref(api);
      else if (typeof ref === 'object') ref.current = api;
    }
    return ReactLocal.createElement('div', { 'data-testid': 'fullcalendar-mock' });
  });
  Mock.displayName = 'FullCalendarMock';
  return { __esModule: true, default: Mock };
});

jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: { id: 'daygrid' } }));
jest.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: { id: 'timegrid' } }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: { id: 'interaction' } }));
jest.mock('@fullcalendar/luxon3', () => ({ __esModule: true, default: { id: 'luxon3' } }));

import ScheduleCalendarView from '../ScheduleCalendarView';
import * as serverClock from '../../../../utils/serverClock';

describe('ScheduleCalendarView serverClock 계약', () => {
  beforeEach(() => {
    globalThis.__FC_SERVER_CLOCK_PROPS = [];
    const fixed = new Date('2026-10-14T06:00:00.000Z');
    if (typeof serverClock.getNow.mockReset === 'function') {
      serverClock.getNow.mockReset();
      serverClock.getNow.mockImplementation(() => fixed);
    }
  });

  test('소스에 getNow(serverClock) 와 FullCalendar now= 가 있다', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'ScheduleCalendarView.js'),
      'utf8'
    );
    expect(src).toMatch(/from ['"].*serverClock['"]/);
    expect(src).toMatch(/getNow as getServerNow/);
    expect(src).toMatch(/now=\{getServerNow\}/);
    expect(src).toMatch(/isPastCalendarDayInZone/);
    expect(src).toMatch(/resolveCalendarScrollTime\(getServerNow\(\)/);
  });

  test('FullCalendar now prop 이 serverClock getNow 함수다', () => {
    render(
      <ScheduleCalendarView
        events={[]}
        userRole="ADMIN"
        onDateClick={jest.fn()}
        onEventClick={jest.fn()}
        onEventDrop={jest.fn()}
      />
    );
    const props = globalThis.__FC_SERVER_CLOCK_PROPS[
      globalThis.__FC_SERVER_CLOCK_PROPS.length - 1
    ];
    expect(props.timeZone).toBe('Asia/Seoul');
    expect(props.nowIndicator).toBe(true);
    expect(typeof props.now).toBe('function');
    expect(props.now).toBe(serverClock.getNow);
    const resolved = props.now();
    expect(resolved).toBeInstanceOf(Date);
    expect(resolved.toISOString()).toBe('2026-10-14T06:00:00.000Z');
  });
});
