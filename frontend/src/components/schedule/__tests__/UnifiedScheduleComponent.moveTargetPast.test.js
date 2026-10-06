/**
 * UnifiedScheduleComponent handleEventDrop — 과거 칸 드롭은 API 호출 전 차단·안내,
 * 이미 지난 일정을 미래 칸으로 옮기면 PUT 호출. 서버 400 사유는 그대로 안내.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../ui/Schedule/ScheduleCalendarView', () => {
  const React = require('react');
  const Mock = (props) => {
    globalThis.__USC_CALENDAR_PROPS = props;
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
  default: { put: jest.fn(), get: jest.fn(() => Promise.resolve([])), post: jest.fn() }
}));
jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { warning: jest.fn(), error: jest.fn(), success: jest.fn(), info: jest.fn() }
}));

import UnifiedScheduleComponent from '../UnifiedScheduleComponent';
import StandardizedApi from '../../../utils/standardizedApi';
import notificationManager from '../../../utils/notification';
import { SCHEDULE_MOVE_TO_PAST_ERROR_CODE } from '../../../utils/scheduleMoveGuard';

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_MS = 50 * 60 * 1000;

const at = (dayOffset, hour) => {
  const d = new Date(Date.now() + dayOffset * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d;
};

const dropInfo = ({ id = 501, status = 'CONFIRMED', oldStart, newStart }) => {
  const revert = jest.fn();
  return {
    revert,
    oldEvent: { start: oldStart, end: new Date(oldStart.getTime() + SESSION_MS) },
    event: {
      id,
      title: 'drag',
      start: newStart,
      end: new Date(newStart.getTime() + SESSION_MS),
      extendedProps: { status, consultantId: 7 }
    }
  };
};

const renderAndGetDrop = async() => {
  render(
    <MemoryRouter>
      <UnifiedScheduleComponent userRole="ADMIN" userId={1} />
    </MemoryRouter>
  );
  await waitFor(() => expect(typeof globalThis.__USC_CALENDAR_PROPS?.onEventDrop).toBe('function'));
  return globalThis.__USC_CALENDAR_PROPS;
};

beforeEach(() => {
  globalThis.__USC_CALENDAR_PROPS = undefined;
  StandardizedApi.put.mockReset();
  notificationManager.warning.mockClear();
  notificationManager.error.mockClear();
  notificationManager.success.mockClear();
});

describe('UnifiedScheduleComponent 일정 이동 — 이동 후 시각 판정', () => {
  test('미래 일정을 과거 칸(어제 11:00)에 놓으면 API 미호출 + 사유 안내 + revert', async() => {
    const calendar = await renderAndGetDrop();
    const info = dropInfo({ oldStart: at(1, 11), newStart: at(-1, 11) });

    await act(async() => {
      await calendar.onEventDrop(info);
    });

    expect(StandardizedApi.put).not.toHaveBeenCalled();
    expect(info.revert).toHaveBeenCalled();
    expect(notificationManager.warning).toHaveBeenCalledWith(expect.stringContaining('일정을 옮길 수 없습니다'));
  });

  test('이미 지난 일정(어제 11:00)을 미래 칸으로 → API 미호출 + 지난 일정 안내', async() => {
    const calendar = await renderAndGetDrop();
    const info = dropInfo({ oldStart: at(-1, 11), newStart: at(2, 11) });

    await act(async() => {
      await calendar.onEventDrop(info);
    });

    expect(StandardizedApi.put).not.toHaveBeenCalled();
    expect(info.revert).toHaveBeenCalled();
    expect(notificationManager.warning).toHaveBeenCalledWith(expect.stringContaining('지난 일정'));
  });

  test('완료 일정은 미래 칸이어도 API 미호출 + 완료 잠금 안내', async() => {
    const calendar = await renderAndGetDrop();
    const info = dropInfo({ status: 'COMPLETED', oldStart: at(-1, 11), newStart: at(2, 11) });

    await act(async() => {
      await calendar.onEventDrop(info);
    });

    expect(StandardizedApi.put).not.toHaveBeenCalled();
    expect(notificationManager.warning).toHaveBeenCalledWith(expect.stringContaining('완료'));
  });

  test('서버가 과거 이동(400 SCHEDULE_MOVE_TO_PAST)으로 거부하면 같은 안내 + revert', async() => {
    const error = Object.assign(new Error('server'), {
      status: 400,
      response: { data: { errorCode: SCHEDULE_MOVE_TO_PAST_ERROR_CODE } }
    });
    StandardizedApi.put.mockRejectedValue(error);
    const calendar = await renderAndGetDrop();
    const info = dropInfo({ oldStart: at(1, 11), newStart: at(2, 11) });

    await act(async() => {
      await calendar.onEventDrop(info);
    });

    expect(info.revert).toHaveBeenCalled();
    expect(notificationManager.error).toHaveBeenCalledWith(expect.stringContaining('일정을 옮길 수 없습니다'));
  });

  test('드래그가 과거 칸에서 끝난 사유 안내(onEventMoveRejected)는 경고 토스트로 표시', async() => {
    const calendar = await renderAndGetDrop();
    act(() => {
      calendar.onEventMoveRejected('사유');
    });
    expect(notificationManager.warning).toHaveBeenCalledWith('사유');
  });

  test('과거 슬롯 클릭(생성)은 API 미호출 + 안내', async() => {
    const calendar = await renderAndGetDrop();
    await act(async() => {
      calendar.onDateClick({
        date: at(-1, 11),
        dateStr: 'past',
        view: { type: 'timeGridDay' }
      });
    });
    expect(StandardizedApi.put).not.toHaveBeenCalled();
    expect(StandardizedApi.post).not.toHaveBeenCalled();
    expect(notificationManager.warning).toHaveBeenCalledWith(expect.stringContaining('등록할 수 없습니다'));
  });
});
