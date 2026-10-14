/**
 * UnifiedScheduleComponent integrated 범위 조회 — 진입 1회·범위 이동 1회.
 * 실제 FullCalendar 처럼 달력(자식)이 마운트 effect 에서 datesSet 을 먼저 보고하는 순서를 재현한다.
 * 관리자·상담사 공통: 추정 월 범위 선요청 없음, 같은 범위 키는 진행 중 요청 재사용,
 * 응답 순서가 뒤집혀도 마지막 요청(최신 범위·조건) 응답만 화면에 반영.
 *
 * @author CoreSolution
 * @since 2026-10-07
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../ui/Schedule/ScheduleCalendarView', () => {
  const ReactInMock = require('react');
  const Mock = (props) => {
    globalThis.__USC_DEDUPE_CALENDAR_PROPS = props;
    ReactInMock.useEffect(() => {
      props.onMonthChange?.(globalThis.__USC_DEDUPE_INITIAL_GRID);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return ReactInMock.createElement('div', { 'data-testid': 'calendar-view-mock' });
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
  adminScheduleControllerListGetAll: jest.fn(() => Promise.resolve({ schedules: [] }))
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
import { adminScheduleControllerListGetAll } from '../../../api/adminListFetch';

const CONSULTANT_ID = 3;
const CONSULTANT_URL = `/api/v1/schedules/consultant/${CONSULTANT_ID}`;
const OCTOBER_GRID = { start: new Date(2026, 8, 27), end: new Date(2026, 10, 8) };
const OCTOBER_RANGE = { startDate: '2026-09-27', endDate: '2026-11-07' };
const NOVEMBER_GRID = { start: new Date(2026, 10, 1), end: new Date(2026, 11, 13) };
const NOVEMBER_RANGE = { startDate: '2026-11-01', endDate: '2026-12-12' };
const SETTLE_ROUNDS = 5;

const calendarProps = () => globalThis.__USC_DEDUPE_CALENDAR_PROPS;
const consultantGetCalls = () => StandardizedApi.get.mock.calls.filter(([url]) => url === CONSULTANT_URL);

/** 늦게 도는 effect·microtask 까지 비운다 — 추가 요청이 없음을 확인하기 위함 */
const settle = async() => {
  for (let i = 0; i < SETTLE_ROUNDS; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await act(async() => {
      await Promise.resolve();
    });
  }
};

const renderSchedule = (props) => render(
  <MemoryRouter>
    <UnifiedScheduleComponent calendarSkin="integrated" {...props} />
  </MemoryRouter>
);

beforeEach(() => {
  globalThis.__USC_DEDUPE_CALENDAR_PROPS = undefined;
  globalThis.__USC_DEDUPE_INITIAL_GRID = OCTOBER_GRID;
  StandardizedApi.get.mockReset();
  StandardizedApi.get.mockResolvedValue({ schedules: [], totalCount: 0 });
  adminScheduleControllerListGetAll.mockReset();
  adminScheduleControllerListGetAll.mockResolvedValue({ schedules: [] });
});

describe('UnifiedScheduleComponent — 범위 조회 진입 1회 (datesSet 선보고 순서)', () => {
  test('상담사 진입: 가시 범위로 정확히 1회, 월 범위 선요청 없음', async() => {
    renderSchedule({ userRole: 'CONSULTANT', userId: CONSULTANT_ID });
    await waitFor(() => expect(consultantGetCalls()).toHaveLength(1));
    await settle();

    expect(consultantGetCalls()).toHaveLength(1);
    expect(consultantGetCalls()[0][1]).toEqual(OCTOBER_RANGE);
  });

  test('상담사 범위 이동: 새 범위로 정확히 1회 추가', async() => {
    renderSchedule({ userRole: 'CONSULTANT', userId: CONSULTANT_ID });
    await waitFor(() => expect(consultantGetCalls()).toHaveLength(1));

    await act(async() => {
      calendarProps().onMonthChange(NOVEMBER_GRID);
    });
    await settle();

    expect(consultantGetCalls()).toHaveLength(2);
    expect(consultantGetCalls()[1][1]).toEqual(NOVEMBER_RANGE);
  });

  test('상담사 refetchTrigger 증가: 갱신 effect·범위 effect 가 겹쳐도 1회', async() => {
    const view = renderSchedule({ userRole: 'CONSULTANT', userId: CONSULTANT_ID, refetchTrigger: 0 });
    await waitFor(() => expect(consultantGetCalls()).toHaveLength(1));

    view.rerender(
      <MemoryRouter>
        <UnifiedScheduleComponent
          calendarSkin="integrated"
          userRole="CONSULTANT"
          userId={CONSULTANT_ID}
          refetchTrigger={1}
        />
      </MemoryRouter>
    );
    await settle();

    expect(consultantGetCalls()).toHaveLength(2);
    expect(consultantGetCalls()[1][1]).toEqual(OCTOBER_RANGE);
  });

  test('관리자 진입: 같은 규칙으로 가시 범위 1회', async() => {
    renderSchedule({ userRole: 'ADMIN', userId: 1 });
    await waitFor(() => expect(adminScheduleControllerListGetAll).toHaveBeenCalledTimes(1));
    await settle();

    expect(adminScheduleControllerListGetAll).toHaveBeenCalledTimes(1);
    expect(adminScheduleControllerListGetAll.mock.calls[0][0]).toEqual(
      expect.objectContaining(OCTOBER_RANGE)
    );
  });
});

/** 호출마다 응답을 직접 풀 수 있게 보류한다 — 응답 도착 순서를 뒤집기 위함 */
const deferCalls = (mockFn) => {
  const pending = [];
  mockFn.mockImplementation((...args) => new Promise((resolve) => {
    pending.push({ args, resolve });
  }));
  return pending;
};

/** 요청 조건(startDate·refetch 표식)을 제목에 남긴 일정 1건 — 어느 응답이 화면에 남았는지 식별 */
const scheduleRowFor = (id, tag) => ({
  id,
  title: tag,
  date: '2026-10-15',
  startTime: '10:00:00',
  endTime: '10:50:00',
  status: 'BOOKED',
  consultantId: CONSULTANT_ID
});

const shownScheduleTitles = () => (calendarProps()?.events || [])
  .filter((event) => /^\d+$/.test(String(event.id)))
  .map((event) => event.title);

/** 나중 요청부터 먼저 응답 — 이전 요청 응답이 가장 늦게 도착 */
const resolveNewestFirst = async(pending, rowsFor) => {
  for (let i = pending.length - 1; i >= 0; i -= 1) {
    const { args, resolve } = pending[i];
    // eslint-disable-next-line no-await-in-loop
    await act(async() => {
      resolve(rowsFor(args, i));
    });
  }
  await settle();
};

describe('UnifiedScheduleComponent — 응답 순서가 뒤집혀도 최신 범위만 표시', () => {
  test('관리자: 이전 범위 응답이 늦게 와도 가시 범위 데이터를 덮어쓰지 않는다', async() => {
    const pending = deferCalls(adminScheduleControllerListGetAll);
    renderSchedule({ userRole: 'ADMIN', userId: 1 });
    await waitFor(() => expect(pending.length).toBeGreaterThanOrEqual(1));
    await act(async() => {
      calendarProps().onMonthChange(NOVEMBER_GRID);
    });
    await settle();

    const latestParams = pending[pending.length - 1].args[0];
    expect(latestParams).toEqual(expect.objectContaining(NOVEMBER_RANGE));
    await resolveNewestFirst(pending, ([params], i) => [scheduleRowFor(i + 1, `range-${params.startDate}`)]);

    expect(shownScheduleTitles()).toEqual([`range-${NOVEMBER_RANGE.startDate}`]);
  });

  test('상담사: 이전 범위 응답이 늦게 와도 가시 범위 데이터를 덮어쓰지 않는다', async() => {
    const pending = deferCalls(StandardizedApi.get);
    renderSchedule({ userRole: 'CONSULTANT', userId: CONSULTANT_ID });
    await waitFor(() => expect(pending.length).toBeGreaterThanOrEqual(1));
    await act(async() => {
      calendarProps().onMonthChange(NOVEMBER_GRID);
    });
    await settle();

    await resolveNewestFirst(pending, ([, params], i) => [scheduleRowFor(i + 1, `range-${params?.startDate}`)]);

    expect(shownScheduleTitles()).toEqual([`range-${NOVEMBER_RANGE.startDate}`]);
  });

  test('관리자: 같은 범위라도 이전 갱신(refetchTrigger) 응답이 늦게 오면 버린다', async() => {
    const pending = deferCalls(adminScheduleControllerListGetAll);
    const view = renderSchedule({ userRole: 'ADMIN', userId: 1, refetchTrigger: 0 });
    await waitFor(() => expect(pending.length).toBeGreaterThanOrEqual(1));
    view.rerender(
      <MemoryRouter>
        <UnifiedScheduleComponent calendarSkin="integrated" userRole="ADMIN" userId={1} refetchTrigger={1} />
      </MemoryRouter>
    );
    await settle();

    const newestIndex = pending.length - 1;
    await resolveNewestFirst(pending, (args, i) => [
      scheduleRowFor(i + 1, i === newestIndex ? 'newest-refetch' : `older-${i}`)
    ]);

    expect(shownScheduleTitles()).toEqual(['newest-refetch']);
  });
});
