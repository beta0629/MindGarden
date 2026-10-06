/**
 * ScheduleCalendarView — FullCalendar 영어 기본 문구를 i18n 으로 덮는다 (#1486 후속, gate-1486)
 *
 * - 더보기 링크: "+N more" → schedule:calendar.moreLink (i18next 복수형 _other, {{count}} 보간)
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import React from 'react';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import i18n from '../../../../i18n';
import {
  SCHEDULE_CALENDAR_I18N,
  buildScheduleCalendarMoreLinkText
} from '../scheduleCalendarI18n';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverStub;

jest.mock('@fullcalendar/react', () => {
  const React = require('react');
  const Mock = React.forwardRef((props, ref) => {
    globalThis.__FC_I18N_PROPS = props;
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

// eslint-disable-next-line import/first
import ScheduleCalendarView from '../ScheduleCalendarView';

const SCHEDULE_JSON = path.resolve(__dirname, '..', '..', '..', '..', 'locales', 'ko', 'schedule.json');

const renderView = () => {
  render(
    <ScheduleCalendarView
      events={[]}
      userRole="ADMIN"
      onDateClick={jest.fn()}
      onEventClick={jest.fn()}
      onEventDrop={jest.fn()}
    />
  );
  return globalThis.__FC_I18N_PROPS;
};

beforeAll(async () => {
  await i18n.changeLanguage('ko');
});

describe('더보기 링크 문구', () => {
  test('한국어 i18n 문구로 개수를 보간한다', () => {
    const props = renderView();
    expect(typeof props.moreLinkText).toBe('function');
    expect(props.moreLinkText(3)).toBe('+3건');
    expect(props.moreLinkText(1)).toBe('+1건');
    expect(props.moreLinkText(12)).not.toMatch(/more/i);
  });

  test('번역 함수가 없으면 빈 문자열', () => {
    expect(buildScheduleCalendarMoreLinkText(null)(2)).toBe('');
  });

  test('locale JSON 은 i18next 복수형 키와 {{count}} 보간을 쓰고 ${ 를 쓰지 않는다', () => {
    const raw = fs.readFileSync(SCHEDULE_JSON, 'utf8');
    const json = JSON.parse(raw);
    const leaf = SCHEDULE_CALENDAR_I18N.moreLink.split(':')[1].split('.');
    const parent = leaf.slice(0, -1).reduce((node, key) => node[key], json);
    const value = parent[`${leaf[leaf.length - 1]}_other`];
    expect(value).toContain('{{count}}');
    expect(raw).not.toContain('${');
  });
});
