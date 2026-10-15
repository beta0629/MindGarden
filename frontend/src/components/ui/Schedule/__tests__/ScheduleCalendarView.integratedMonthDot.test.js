/**
 * 통합 월간 칩은 상담사 색 __dot 하나만 그린다.
 * 예전 8px mg-v2-teacher-dot 는 주·일 칩에만 남긴다.
 */
import React from 'react';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import i18n from '../../../../i18n';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

jest.mock('../../../../hooks/useConsultantColorPalette', () => ({
  useConsultantColorPalette: () => ({
    colors: [],
    paletteSize: 0,
    colorClassFor: (consultantId) =>
      `mg-v2-consultant-color mg-v2-consultant-color--${consultantId}`
  })
}));

jest.mock('@fullcalendar/react', () => {
  const ReactActual = require('react');
  const Mock = ReactActual.forwardRef((props, ref) => {
    globalThis.__FC_MONTH_DOT_PROPS = props;
    if (ref && typeof ref === 'object') {
      ref.current = { getApi: () => ({ updateSize: () => {}, changeView: () => {}, gotoDate: () => {} }) };
    }
    return ReactActual.createElement('div', { 'data-testid': 'fullcalendar-mock' });
  });
  Mock.displayName = 'FullCalendarMock';
  return { __esModule: true, default: Mock };
});
jest.mock('@fullcalendar/daygrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/timegrid', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/interaction', () => ({ __esModule: true, default: {} }));
jest.mock('@fullcalendar/luxon3', () => ({ __esModule: true, default: { id: 'luxon3' } }), {
  virtual: true
});

// eslint-disable-next-line import/first
import ScheduleCalendarView from '../ScheduleCalendarView';

const SRC = path.resolve(__dirname, '..', '..', '..', '..');

const read = (...parts) => fs.readFileSync(path.resolve(...parts), 'utf8');

describe('통합 월간 칩 점', () => {
  beforeAll(async() => {
    await i18n.changeLanguage('ko');
  });

  test('칩마다 점이 하나이고 그 색 클래스는 범례와 같다', () => {
    const consultantId = 7;
    const legendClass = `mg-v2-consultant-color mg-v2-consultant-color--${consultantId}`;
    render(
      <ScheduleCalendarView
        events={[]}
        consultants={[{ id: consultantId, name: '이상담' }]}
        userRole="ADMIN"
        integratedMonthEventLayout
        calendarSkin="integrated"
        onDateClick={jest.fn()}
        onEventClick={jest.fn()}
        onEventDrop={jest.fn()}
      />
    );

    const chip = globalThis.__FC_MONTH_DOT_PROPS.eventContent({
      timeText: '오전 10시',
      view: { type: 'dayGridMonth' },
      event: {
        title: '상담',
        start: new Date(2026, 9, 22, 10, 0),
        end: new Date(2026, 9, 22, 11, 0),
        consultantId,
        extendedProps: {
          clientName: '김하늘',
          consultantName: '이상담',
          consultantId,
          status: 'BOOKED'
        }
      }
    });
    const view = render(chip);
    const dots = view.container.querySelectorAll('.mg-v2-ad-calendar-event__dot');
    expect(dots).toHaveLength(1);
    expect(view.container.querySelector('.mg-v2-teacher-dot')).toBeNull();
    expect(view.container.querySelector('.mg-v2-ad-calendar-event__teacher-dot')).toBeNull();
    expect(dots[0].className).toContain('mg-v2-consultant-color');
    expect(dots[0].className).toContain(`mg-v2-consultant-color--${consultantId}`);
    expect(`mg-v2-legend-color ${legendClass}`).toContain(legendClass);
    expect(dots[0].className).toContain(legendClass.split(' ')[0]);
    expect(dots[0].className).toContain(legendClass.split(' ')[1]);

    const chipCss = read(
      SRC,
      'components',
      'admin',
      'mapping-management',
      'IntegratedMatchingSchedule.css'
    );
    const legendCss = read(SRC, 'components', 'ui', 'Schedule', 'consultantColorSwatch.css');
    expect(chipCss).toMatch(
      /\.mg-v2-ad-calendar-event__dot\s*\{[\s\S]*?background-color:\s*var\(--mg-consultant-color,\s*var\(--mg-v2-color-neutral-500\)\)/
    );
    expect(legendCss).toMatch(
      /\.mg-v2-legend-color\.mg-v2-consultant-color\s*\{[^}]*background-color:\s*var\(--mg-consultant-color,\s*var\(--mg-v2-color-neutral-500\)\)/
    );
    const stageGHeader = '@container mg-month-event (width < 64px)';
    const stageGStart = chipCss.indexOf(stageGHeader);
    expect(stageGStart).toBeGreaterThan(-1);
    const stageG = chipCss.slice(stageGStart, stageGStart + 1800);
    expect(stageG).toMatch(
      /border-inline-start:\s*var\(--mg-v2-border-width-thick\)\s+solid\s+var\(--mg-month-event-status-color\)/
    );
    expect(chipCss.indexOf(
      'border-inline-start: var(--mg-v2-border-width-thick) solid var(--mg-month-event-status-color)'
    )).toBeGreaterThan(stageGStart);

    const weekChip = read(SRC, 'components', 'ui', 'Schedule', 'WeekDayScheduleEventChip.js');
    expect(weekChip).toMatch(/TeacherColorDot/);
    expect(weekChip).toMatch(/mg-v2-ad-calendar-event__teacher-dot/);
  });
});
