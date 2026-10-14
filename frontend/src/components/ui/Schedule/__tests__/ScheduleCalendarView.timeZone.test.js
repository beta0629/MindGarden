/**
 * ScheduleCalendarView — FullCalendar timeZone Asia/Seoul (luxon3) 계약.
 * 기기 TZ(America/Los_Angeles)에서도 today/now·일정 벽시계가 KST 기준.
 */

import React from 'react';
import { render } from '@testing-library/react';
import {
  DEFAULT_ZONE,
  formatDateKeyInZone,
  parseScheduleTimeKey,
  toFloatingDateTimeInZone
} from '../../../../utils/zonedDateTime';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

jest.mock('@fullcalendar/react', () => {
  const ReactLocal = require('react');
  const Mock = ReactLocal.forwardRef((props, ref) => {
    if (!globalThis.__FC_TZ_PROPS_LOG) globalThis.__FC_TZ_PROPS_LOG = [];
    globalThis.__FC_TZ_PROPS_LOG.push(props);
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
jest.mock('@fullcalendar/luxon3', () => ({
  __esModule: true,
  default: { name: '@fullcalendar/luxon3', id: 'luxon3' }
}), { virtual: true });

import ScheduleCalendarView from '../ScheduleCalendarView';

const getLastProps = () => {
  const log = globalThis.__FC_TZ_PROPS_LOG || [];
  return log.length > 0 ? log[log.length - 1] : null;
};

beforeEach(() => {
  globalThis.__FC_TZ_PROPS_LOG = [];
});

describe('ScheduleCalendarView timeZone Asia/Seoul', () => {
  test('FullCalendar에 timeZone=DEFAULT_ZONE(Asia/Seoul)과 luxon 플러그인이 전달된다', () => {
    render(
      <ScheduleCalendarView
        events={[]}
        userRole="ADMIN"
        onDateClick={jest.fn()}
        onEventClick={jest.fn()}
        onEventDrop={jest.fn()}
      />
    );
    const captured = getLastProps();
    expect(DEFAULT_ZONE).toBe('Asia/Seoul');
    expect(captured.timeZone).toBe(DEFAULT_ZONE);
    expect(captured.timeZone).toBe('Asia/Seoul');
    expect(captured.nowIndicator).toBe(true);
    expect(captured.plugins.some((p) => p && p.name === '@fullcalendar/luxon3')).toBe(true);
  });

  test('절대 ISO 휴가는 floating KST로 정규화되어 LA/Seoul 벽시계가 같다', () => {
    const vacationIsoStart = new Date('2026-10-14T00:00:00+09:00').toISOString();
    const vacationIsoEnd = new Date('2026-10-14T13:00:00+09:00').toISOString();
    const consultationFloating = '2026-10-14T14:00:00';

    render(
      <ScheduleCalendarView
        events={[
          {
            id: 'vac-1',
            title: '오전 휴무',
            start: vacationIsoStart,
            end: vacationIsoEnd,
            extendedProps: { type: 'vacation' }
          },
          {
            id: 'sch-1',
            title: '상담',
            start: consultationFloating,
            end: '2026-10-14T15:00:00',
            extendedProps: { clientName: '홍길동' }
          }
        ]}
        userRole="ADMIN"
        onDateClick={jest.fn()}
        onEventClick={jest.fn()}
        onEventDrop={jest.fn()}
      />
    );

    const captured = getLastProps();
    const vac = captured.events.find((e) => e.id === 'vac-1');
    const sch = captured.events.find((e) => e.id === 'sch-1');

    expect(vac.start).toBe('2026-10-14T00:00:00');
    expect(vac.end).toBe('2026-10-14T13:00:00');
    expect(String(vac.start)).not.toMatch(/Z|[+-]\d{2}:?\d{2}$/);
    expect(sch.start).toBe(consultationFloating);

    const displayVacStart = parseScheduleTimeKey(vac.start);
    const displaySchStart = parseScheduleTimeKey(sch.start);
    expect(displayVacStart).toBe('00:00');
    expect(displaySchStart).toBe('14:00');

    // 기기 TZ와 무관하게 동일 문자열 (정규화 결과)
    expect(toFloatingDateTimeInZone(vacationIsoStart)).toBe(vac.start);
    expect(toFloatingDateTimeInZone(consultationFloating)).toBe(consultationFloating);
  });

  test('America/Los_Angeles mock 시각에서도 today 키는 Seoul 캘린더일', () => {
    const prevTz = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';

    try {
      // 2026-10-14 00:30 KST = 2026-10-13 08:30 PDT — LA 날짜는 13일, Seoul은 14일
      const instant = new Date('2026-10-13T15:30:00.000Z');
      expect(formatDateKeyInZone(instant, DEFAULT_ZONE)).toBe('2026-10-14');

      const laDateKey = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(instant);
      expect(laDateKey).toBe('2026-10-13');
      expect(formatDateKeyInZone(instant, DEFAULT_ZONE)).not.toBe(laDateKey);

      render(
        <ScheduleCalendarView
          events={[]}
          userRole="ADMIN"
          onDateClick={jest.fn()}
          onEventClick={jest.fn()}
          onEventDrop={jest.fn()}
        />
      );
      const captured = getLastProps();
      expect(captured.timeZone).toBe('Asia/Seoul');
      expect(captured.nowIndicator).toBe(true);
    } finally {
      if (prevTz == null) {
        delete process.env.TZ;
      } else {
        process.env.TZ = prevTz;
      }
    }
  });
});
