/**
 * ScheduleCalendarView — 월/주 날짜 클릭 → 일간 확대, 일간 dateClick → 등록 모달.
 * DnD(eventDrop/editable/droppable) props 회귀 없음·fade만(scale 없음) 검증.
 *
 * @author MindGarden
 * @since 2026-08-25
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

class ResizeObserverStub {
  constructor(cb) {
    this.cb = cb;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

const mockCalendarApi = {
  updateSize: jest.fn(),
  changeView: jest.fn(),
  gotoDate: jest.fn()
};

jest.mock('@fullcalendar/react', () => {
  const React = require('react');
  const Mock = React.forwardRef((props, ref) => {
    if (!globalThis.__FC_PROPS_LOG) globalThis.__FC_PROPS_LOG = [];
    globalThis.__FC_PROPS_LOG.push(props);
    if (ref) {
      const api = { getApi: () => mockCalendarApi };
      if (typeof ref === 'function') ref(api);
      else if (typeof ref === 'object') ref.current = api;
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

const CSS_PATH = path.resolve(__dirname, '..', 'ScheduleCalendarView.css');

const baseProps = (overrides = {}) => ({
  events: [],
  userRole: 'ADMIN',
  onDateClick: jest.fn(),
  onEventClick: jest.fn(),
  onEventDrop: jest.fn(),
  ...overrides
});

const getLastFullCalendarProps = () => {
  const log = globalThis.__FC_PROPS_LOG || [];
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i] && typeof log[i].dateClick === 'function') return log[i];
  }
  return log.length > 0 ? log[log.length - 1] : null;
};

beforeEach(() => {
  globalThis.__FC_PROPS_LOG = [];
  mockCalendarApi.updateSize.mockClear();
  mockCalendarApi.changeView.mockClear();
  mockCalendarApi.gotoDate.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ScheduleCalendarView — 날짜 클릭 일간 확대', () => {
  test('월간 dateClick → gotoDate + changeView(timeGridDay), onDateClick 미호출', async () => {
    const onDateClick = jest.fn();
    render(<ScheduleCalendarView {...baseProps({ onDateClick })} />);

    const captured = getLastFullCalendarProps();
    const clickedDate = new Date('2026-08-20T00:00:00');

    act(() => {
      captured.dateClick({
        date: clickedDate,
        dateStr: '2026-08-20',
        view: { type: 'dayGridMonth' }
      });
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockCalendarApi.gotoDate).toHaveBeenCalledWith(clickedDate);
      expect(mockCalendarApi.changeView).toHaveBeenCalledWith('timeGridDay');
    });
    expect(onDateClick).not.toHaveBeenCalled();
  });

  test('주간 dateClick → 일간 확대, onDateClick 미호출', async () => {
    const onDateClick = jest.fn();
    render(<ScheduleCalendarView {...baseProps({ onDateClick })} />);

    const captured = getLastFullCalendarProps();
    const clickedDate = new Date('2026-08-21T10:00:00');

    act(() => {
      captured.dateClick({
        date: clickedDate,
        dateStr: '2026-08-21',
        view: { type: 'timeGridWeek' }
      });
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockCalendarApi.changeView).toHaveBeenCalledWith('timeGridDay');
      expect(mockCalendarApi.gotoDate).toHaveBeenCalledWith(clickedDate);
    });
    expect(onDateClick).not.toHaveBeenCalled();
  });

  test('일간 dateClick → 기존 onDateClick(등록 모달) 유지', () => {
    const onDateClick = jest.fn();
    render(<ScheduleCalendarView {...baseProps({ onDateClick })} />);

    const captured = getLastFullCalendarProps();
    const info = {
      date: new Date('2026-08-20T09:00:00'),
      dateStr: '2026-08-20',
      view: { type: 'timeGridDay' }
    };

    act(() => {
      captured.dateClick(info);
    });

    expect(onDateClick).toHaveBeenCalledWith(info);
    expect(mockCalendarApi.changeView).not.toHaveBeenCalled();
  });

  test('확대 후「전체 보기」→ 이전 뷰(month) 복귀', async () => {
    render(<ScheduleCalendarView {...baseProps()} />);

    let captured = getLastFullCalendarProps();
    act(() => {
      captured.dateClick({
        date: new Date('2026-08-20T00:00:00'),
        view: { type: 'dayGridMonth' }
      });
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockCalendarApi.changeView).toHaveBeenCalledWith('timeGridDay');
    });

    captured = getLastFullCalendarProps();
    expect(captured.customButtons?.zoomOut?.click).toEqual(expect.any(Function));
    expect(captured.headerToolbar?.right).toContain('zoomOut');

    mockCalendarApi.changeView.mockClear();
    act(() => {
      captured.customButtons.zoomOut.click();
      jest.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(mockCalendarApi.changeView).toHaveBeenCalledWith('dayGridMonth');
    });
  });

  test('DnD 관련 props(editable/droppable/eventDrop/eventReceive)가 확대 로직과 무관하게 유지', () => {
    const onEventDrop = jest.fn();
    render(
      <ScheduleCalendarView
        {...baseProps({
          onEventDrop,
          onExternalEventReceive: jest.fn(),
          disableCalendarEventDrag: false,
          acceptExternalCalendarDrops: true
        })}
      />
    );

    const captured = getLastFullCalendarProps();
    expect(captured.editable).toBe(true);
    expect(captured.droppable).toBe(true);
    expect(captured.eventDrop).toBe(onEventDrop);
    expect(typeof captured.eventReceive).toBe('function');
  });

  test('CSS: 뷰 전환은 opacity fade만, transform/scale/zoom 없음', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');
    expect(css).toMatch(
      /\.mg-v2-schedule-calendar-view\s*\{[^}]*transition:\s*opacity\s+var\(--animation-duration-fast\)/
    );
    expect(css).toMatch(/\.mg-v2-schedule-calendar-view--fading\s*\{[^}]*opacity:\s*0/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    const fadeBlock = css.match(
      /\.mg-v2-schedule-calendar-view\s*\{[^}]+\}[\s\S]*?prefers-reduced-motion[\s\S]*?\}/
    );
    expect(fadeBlock?.[0] || '').not.toMatch(/transform:\s*scale|zoom\s*:/);
  });

  test('CSS: 일/주 풀 카드는 overflow visible + 토큰 min-height (클리핑 방지)', () => {
    const css = fs.readFileSync(CSS_PATH, 'utf8');
    expect(css).toMatch(
      /\.mg-v2-ad-calendar-event\s*\{[^}]*overflow:\s*visible/
    );
    expect(css).toMatch(
      /\.mg-v2-ad-calendar-event\s*\{[^}]*min-height:\s*var\(--mg-v2-space-16/
    );
    expect(css).not.toMatch(
      /\.mg-v2-ad-calendar-event\s*\{[^}]*height:\s*100%/
    );
  });

  test('FullCalendar eventMinHeight가 전달되어 짧은 슬롯에서도 본문이 눌리지 않는다', () => {
    render(<ScheduleCalendarView {...baseProps()} />);
    const captured = getLastFullCalendarProps();
    expect(captured.eventMinHeight).toBe(64);
  });
});
