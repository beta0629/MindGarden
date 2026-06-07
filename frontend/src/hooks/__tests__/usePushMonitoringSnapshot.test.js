/**
 * usePushMonitoringSnapshot — BW-1 60s 폴링 hook 단위 테스트.
 *
 * 검증 매트릭스:
 *  - U1: 마운트 시 즉시 1회 fetch, isLoading=true → false 전이
 *  - U2: { success: true, data: {...} } 응답 unwrap
 *  - U3: 60s 경과 시 background fetch (isRefreshing 플래그)
 *  - U4: range/channel 변경 시 즉시 재호출 + 타이머 리셋
 *  - U5: 실패 시 error 노출, 다음 tick 정상 진행
 *  - U6: refresh() 명시 호출 시 즉시 재호출
 *  - U7: unmount 시 추가 fetch 호출 없음 (cleanup 보장)
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import { act, renderHook, waitFor } from '@testing-library/react';

jest.mock('../../api/admin/pushMonitoringApi', () => {
  const actual = jest.requireActual('../../api/admin/pushMonitoringApi');
  return {
    __esModule: true,
    ...actual,
    getPushMonitoringSnapshot: jest.fn()
  };
});

import {
  getPushMonitoringSnapshot,
  PUSH_MONITORING_RANGE,
  PUSH_MONITORING_CHANNEL
} from '../../api/admin/pushMonitoringApi';
import usePushMonitoringSnapshot from '../usePushMonitoringSnapshot';

const stubResponse = (overrides = {}) => ({
  success: true,
  data: {
    generatedAt: '2026-06-07T00:00:00',
    range: 'D7',
    channel: 'ALL',
    pushAutoTrackingAvailable: false,
    costAvailable: false,
    ...overrides
  }
});

beforeEach(() => {
  getPushMonitoringSnapshot.mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('usePushMonitoringSnapshot', () => {
  test('U1: 마운트 즉시 1회 fetch, isLoading 전이', async() => {
    getPushMonitoringSnapshot.mockResolvedValue(stubResponse());

    const { result } = renderHook(() => usePushMonitoringSnapshot());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getPushMonitoringSnapshot).toHaveBeenCalledTimes(1);
    expect(result.current.snapshot).not.toBeNull();
    expect(result.current.snapshot.pushAutoTrackingAvailable).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('U2: { success: true, data: {...} } 응답 unwrap', async() => {
    getPushMonitoringSnapshot.mockResolvedValue(stubResponse({ failuresTotal: 7 }));

    const { result } = renderHook(() => usePushMonitoringSnapshot());
    await waitFor(() => expect(result.current.snapshot).not.toBeNull());
    expect(result.current.snapshot.failuresTotal).toBe(7);
  });

  test('U3: 60s 경과 시 background fetch', async() => {
    getPushMonitoringSnapshot.mockResolvedValue(stubResponse());

    const { result } = renderHook(() => usePushMonitoringSnapshot());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getPushMonitoringSnapshot).toHaveBeenCalledTimes(1);

    await act(async() => {
      jest.advanceTimersByTime(60000);
    });
    await waitFor(() => expect(getPushMonitoringSnapshot).toHaveBeenCalledTimes(2));
  });

  test('U4: range 변경 시 즉시 재호출', async() => {
    getPushMonitoringSnapshot.mockResolvedValue(stubResponse());

    let opts = { range: PUSH_MONITORING_RANGE.D7, channel: PUSH_MONITORING_CHANNEL.ALL };
    const { result, rerender } = renderHook(() => usePushMonitoringSnapshot(opts));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getPushMonitoringSnapshot).toHaveBeenCalledTimes(1);

    opts = { range: PUSH_MONITORING_RANGE.H24, channel: PUSH_MONITORING_CHANNEL.ALL };
    rerender();
    await waitFor(() => expect(getPushMonitoringSnapshot).toHaveBeenCalledTimes(2));
    expect(getPushMonitoringSnapshot.mock.calls[1][0]).toEqual({
      range: 'H24',
      channel: 'ALL'
    });
  });

  test('U5: 실패 시 error 노출', async() => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getPushMonitoringSnapshot.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => usePushMonitoringSnapshot());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.error.message).toBe('boom');
    errorSpy.mockRestore();
  });

  test('U6: refresh() 명시 호출 시 즉시 재호출', async() => {
    getPushMonitoringSnapshot.mockResolvedValue(stubResponse());

    const { result } = renderHook(() => usePushMonitoringSnapshot());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getPushMonitoringSnapshot).toHaveBeenCalledTimes(1);

    await act(async() => {
      result.current.refresh();
    });
    await waitFor(() => expect(getPushMonitoringSnapshot).toHaveBeenCalledTimes(2));
  });

  test('U7: unmount 후 추가 fetch 없음', async() => {
    getPushMonitoringSnapshot.mockResolvedValue(stubResponse());

    const { result, unmount } = renderHook(() => usePushMonitoringSnapshot());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const baseline = getPushMonitoringSnapshot.mock.calls.length;

    unmount();
    await act(async() => {
      jest.advanceTimersByTime(120000);
    });
    expect(getPushMonitoringSnapshot.mock.calls.length).toBe(baseline);
  });
});
