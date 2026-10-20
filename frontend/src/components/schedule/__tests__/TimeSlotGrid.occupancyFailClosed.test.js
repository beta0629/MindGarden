/**
 * TimeSlotGrid — 일정 조회 401·실패 시 빈 목록을 '가능'으로 보지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TimeSlotGrid from '../TimeSlotGrid';
import StandardizedApi from '../../../utils/standardizedApi';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key) => (
      key === 'schedule:TimeSlotGrid.loadFailed'
        ? '일정을 불러오지 못해 시간을 선택할 수 없습니다. 다시 시도해 주세요.'
        : key
    ),
    i18n: { language: 'ko' }
  })
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
    warning: jest.fn()
  }
}));

const LOAD_FAILED_TEXT = '일정을 불러오지 못해 시간을 선택할 수 없습니다. 다시 시도해 주세요.';
const GRID_DATE = new Date(2099, 5, 15);
const CONSULTANT_ID = 18;

function rejectScheduleLookup(error) {
  StandardizedApi.get.mockImplementation((endpoint, params, options) => {
    if (String(endpoint).includes('/schedules/consultant/')) {
      expect(params).toEqual({ date: '2099-06-15' });
      expect(options).toEqual(expect.objectContaining({ throwOnUnauthorized: true }));
      return Promise.reject(error);
    }
    if (String(endpoint).includes('/availability/vacations')) {
      return Promise.resolve({});
    }
    if (String(endpoint).includes('/consultants/')) {
      return Promise.resolve({
        consultationHours: '09:00-21:00',
        breakTime: null,
        sessionDuration: 50,
        breakBetweenSessions: 10
      });
    }
    return Promise.resolve(null);
  });
}

function renderGrid(onTimeSlotSelect, onOccupancyLoadFailed) {
  return render(
    <TimeSlotGrid
      date={GRID_DATE}
      consultantId={CONSULTANT_ID}
      duration={50}
      variant="b0kla"
      onTimeSlotSelect={onTimeSlotSelect}
      onOccupancyLoadFailed={onOccupancyLoadFailed}
    />
  );
}

async function expectSelectionBlocked(onTimeSlotSelect) {
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(LOAD_FAILED_TEXT);
    expect(document.querySelector('.mg-v2-ad-ts-item')).not.toBeNull();
    expect(document.querySelector('.mg-v2-ad-ts-item--available')).toBeNull();
  });
  const slot = document.querySelector('.mg-v2-ad-ts-item');
  expect(slot).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(slot);
  fireEvent.keyDown(slot, { key: 'Enter' });
  expect(onTimeSlotSelect).not.toHaveBeenCalled();
}

describe('TimeSlotGrid occupancy fail closed', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  test.each([
    ['401', () => {
      const error = new Error('인증이 필요합니다.');
      error.status = 401;
      error.response = { status: 401, data: { message: '로그인이 필요합니다.' } };
      return error;
    }],
    ['조회 실패', () => {
      const error = new Error('서버 오류');
      error.status = 500;
      error.response = { status: 500, data: {} };
      return error;
    }]
  ])('%s 이면 시간 선택을 막는다', async(_label, buildError) => {
    const onTimeSlotSelect = jest.fn();
    const onOccupancyLoadFailed = jest.fn();
    rejectScheduleLookup(buildError());
    renderGrid(onTimeSlotSelect, onOccupancyLoadFailed);

    await expectSelectionBlocked(onTimeSlotSelect);
    expect(onOccupancyLoadFailed).toHaveBeenCalled();
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/schedules/consultant/18/date',
      { date: '2099-06-15' },
      expect.objectContaining({ throwOnUnauthorized: true })
    );
  });

  test('일정 목록이 아니면 빈 결과를 가능으로 보지 않는다', async() => {
    const onTimeSlotSelect = jest.fn();
    StandardizedApi.get.mockImplementation((endpoint) => {
      if (String(endpoint).includes('/schedules/consultant/')) {
        return Promise.resolve(null);
      }
      if (String(endpoint).includes('/availability/vacations')) {
        return Promise.resolve({});
      }
      return Promise.resolve({
        consultationHours: '09:00-21:00',
        breakTime: null,
        sessionDuration: 50,
        breakBetweenSessions: 10
      });
    });
    renderGrid(onTimeSlotSelect, jest.fn());
    await expectSelectionBlocked(onTimeSlotSelect);
  });
});
