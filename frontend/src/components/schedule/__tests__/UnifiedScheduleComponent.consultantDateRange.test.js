/**
 * UnifiedScheduleComponent CONSULTANT + integrated — 가시 범위(startDate/endDate)만 조회.
 * datesSet 전 mount 조회 없음 · 월 이동 silent refetch · 늦게 온 이전 달 응답 무시 · 휴가 카드 유지.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../ui/Schedule/ScheduleCalendarView', () => {
  const React = require('react');
  const Mock = (props) => {
    globalThis.__USC_RANGE_CALENDAR_PROPS = props;
    return React.createElement('div', { 'data-testid': 'calendar-view-mock' });
  };
  return { __esModule: true, default: Mock };
});
jest.mock('../../ui/Schedule/ScheduleHeader', () => () => null);
jest.mock('../../ui/Schedule/ScheduleLegend', () => () => null);
jest.mock('../ScheduleModal', () => () => null);
jest.mock('../ScheduleDetailModal', () => () => null);
jest.mock('../RescheduleScheduleModal', () => () => null);
jest.mock('../DateActionModal', () => () => null);
jest.mock('../../consultant/ConsultationLogModal', () => () => null);
jest.mock('../../consultant/ConsultantVacationModal', () => () => null);
jest.mock('../../admin/VacationManagementModal', () => () => null);
jest.mock('../../common/UnifiedLoading', () => () => null);

jest.mock('../../../utils/ajax', () => ({
  ...jest.requireActual('../../../utils/ajax'),
  apiGet: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../../api/adminListFetch', () => ({
  ...jest.requireActual('../../../api/adminListFetch'),
  adminScheduleControllerListGetAll: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../../utils/commonCodeApi', () => ({
  getCommonCodes: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { put: jest.fn(), get: jest.fn(), post: jest.fn() }
}));
jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { warning: jest.fn(), error: jest.fn(), success: jest.fn(), info: jest.fn() }
}));

import UnifiedScheduleComponent from '../UnifiedScheduleComponent';
import StandardizedApi from '../../../utils/standardizedApi';
import { apiGet } from '../../../utils/ajax';

const CONSULTANT_ID = 7;
const CONSULTANT_URL = `/api/v1/schedules/consultant/${CONSULTANT_ID}`;

/** FullCalendar dayGridMonth datesSet: start = 그리드 첫날, end = 그리드 마지막 다음날(exclusive) */
const OCTOBER_GRID = { start: new Date(2026, 8, 27), end: new Date(2026, 10, 8) };
const OCTOBER_RANGE = { startDate: '2026-09-27', endDate: '2026-11-07' };
const NOVEMBER_GRID = { start: new Date(2026, 10, 1), end: new Date(2026, 11, 13) };
const NOVEMBER_RANGE = { startDate: '2026-11-01', endDate: '2026-12-12' };

const scheduleRow = (id, date, status = 'CONFIRMED') => ({
  id,
  consultantId: CONSULTANT_ID,
  clientId: status === 'VACATION' ? null : 3,
  date,
  startTime: '10:00:00',
  endTime: '10:50:00',
  status,
  title: `row-${id}`
});

const payload = (...rows) => ({ schedules: rows, totalCount: rows.length });

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

const calendarProps = () => globalThis.__USC_RANGE_CALENDAR_PROPS;

const renderConsultant = (props = {}) => render(
  <MemoryRouter>
    <UnifiedScheduleComponent
      userRole="CONSULTANT"
      userId={CONSULTANT_ID}
      calendarSkin="integrated"
      {...props}
    />
  </MemoryRouter>
);

const fireDatesSet = async(grid) => {
  await act(async() => {
    calendarProps().onMonthChange(grid);
  });
};

const consultantGetCalls = () => StandardizedApi.get.mock.calls.filter(([url]) => url === CONSULTANT_URL);

beforeEach(() => {
  globalThis.__USC_RANGE_CALENDAR_PROPS = undefined;
  StandardizedApi.get.mockReset();
  apiGet.mockClear();
});

describe('UnifiedScheduleComponent — 상담사 integrated 가시 범위 조회', () => {
  test('datesSet 전에는 조회하지 않고, datesSet 의 가시 그리드(inclusive)를 startDate/endDate 로 전달', async() => {
    StandardizedApi.get.mockResolvedValue(payload());
    renderConsultant();
    await waitFor(() => expect(typeof calendarProps()?.onMonthChange).toBe('function'));

    expect(consultantGetCalls()).toHaveLength(0);

    await fireDatesSet(OCTOBER_GRID);

    await waitFor(() => expect(consultantGetCalls()).toHaveLength(1));
    expect(consultantGetCalls()[0][1]).toEqual(OCTOBER_RANGE);
    expect(apiGet).not.toHaveBeenCalledWith(CONSULTANT_URL);
  });

  test('월 이동 시 새 범위로 silent refetch, 같은 범위 datesSet 은 재조회하지 않음', async() => {
    StandardizedApi.get.mockResolvedValue(payload());
    renderConsultant();
    await waitFor(() => expect(typeof calendarProps()?.onMonthChange).toBe('function'));

    await fireDatesSet(OCTOBER_GRID);
    await waitFor(() => expect(consultantGetCalls()).toHaveLength(1));

    await fireDatesSet(NOVEMBER_GRID);
    await waitFor(() => expect(consultantGetCalls()).toHaveLength(2));
    expect(consultantGetCalls()[1][1]).toEqual(NOVEMBER_RANGE);

    await fireDatesSet(NOVEMBER_GRID);
    expect(consultantGetCalls()).toHaveLength(2);
  });

  test('휴가 행도 이벤트로 유지되고 onScheduleEventsChange 에 조회 범위를 함께 전달', async() => {
    StandardizedApi.get.mockResolvedValue(payload(
      scheduleRow(11, '2026-10-15'),
      scheduleRow(100005, '2026-09-30', 'VACATION')
    ));
    const onScheduleEventsChange = jest.fn();
    renderConsultant({ onScheduleEventsChange });
    await waitFor(() => expect(typeof calendarProps()?.onMonthChange).toBe('function'));

    await fireDatesSet(OCTOBER_GRID);

    await waitFor(() => {
      const ids = calendarProps().events.map((event) => String(event.id));
      expect(ids).toEqual(expect.arrayContaining(['11', '100005']));
    });
    const [events, range] = onScheduleEventsChange.mock.calls[onScheduleEventsChange.mock.calls.length - 1];
    expect(events.map((event) => String(event.id))).toEqual(expect.arrayContaining(['11', '100005']));
    expect(range).toEqual(OCTOBER_RANGE);
  });

  test('이전 달 응답이 월 이동 뒤에 늦게 도착하면 덮어쓰지 않음', async() => {
    const octoberResponse = deferred();
    StandardizedApi.get
      .mockImplementationOnce(() => octoberResponse.promise)
      .mockResolvedValueOnce(payload(scheduleRow(22, '2026-11-20')));
    const onScheduleEventsChange = jest.fn();
    renderConsultant({ onScheduleEventsChange });
    await waitFor(() => expect(typeof calendarProps()?.onMonthChange).toBe('function'));

    await fireDatesSet(OCTOBER_GRID);
    await fireDatesSet(NOVEMBER_GRID);
    await waitFor(() => {
      const ids = calendarProps().events.map((event) => String(event.id));
      expect(ids).toContain('22');
    });

    await act(async() => {
      octoberResponse.resolve(payload(scheduleRow(11, '2026-10-15')));
      await octoberResponse.promise;
    });

    const ids = calendarProps().events.map((event) => String(event.id));
    expect(ids).toContain('22');
    expect(ids).not.toContain('11');
    const [, lastRange] = onScheduleEventsChange.mock.calls[onScheduleEventsChange.mock.calls.length - 1];
    expect(lastRange).toEqual(NOVEMBER_RANGE);
  });

  test('integrated 가 아닌 상담사 캘린더는 기존처럼 mount 시 날짜 없이 조회', async() => {
    StandardizedApi.get.mockResolvedValue(payload());
    renderConsultant({ calendarSkin: undefined });

    await waitFor(() => expect(consultantGetCalls()).toHaveLength(1));
    expect(consultantGetCalls()[0][1]).toEqual({});
  });
});
