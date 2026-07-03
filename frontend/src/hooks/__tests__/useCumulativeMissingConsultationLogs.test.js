/**
 * useCumulativeMissingConsultationLogs — 누적 누락 일지 공통 hook 단위 테스트.
 *
 * 2026-07-03 — 어드민 대시보드 «상담일지 누락» 섹션이 현재 월만 조회하여 이전 달
 * (예: 7/3 접속 시 6/30) 누락 건을 놓치던 버그 보정. 월 경계 비의존 누적 SSOT hook.
 *
 * 검증 매트릭스:
 *  - C1: 마운트 시 cumulative-missing-consultation-logs API 1회 호출 (파라미터 없음) + 정규화
 *  - C2: 월 경계를 넘는 누락(6/30 + 7/1)이 items 에 모두 포함
 *  - C3: tenantId 변경 → 캐시 리셋 + 재호출
 *  - C4: { success: true, data: { items: [...] } } 형태 응답 unwrap
 *  - C5: API 실패 → items=null sentinel + error 노출
 *  - C6: unmount race (cancelled) — resolve 가 unmount 이후에도 setState 미호출
 *  - C7: 캐시 hit — 재렌더 시 추가 API 호출 없음
 *
 * @author MindGarden core-coder
 * @since 2026-07-03
 */

import { act, renderHook, waitFor } from '@testing-library/react';

jest.mock('../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: jest.fn()
}));

import StandardizedApi from '../../utils/standardizedApi';
import { useSession } from '../../contexts/SessionContext';
import useCumulativeMissingConsultationLogs, {
  CUMULATIVE_MISSING_CONSULTATION_LOGS_ENDPOINT
} from '../useCumulativeMissingConsultationLogs';

const setUser = (tenantId) => {
  useSession.mockImplementation(() => ({ user: { id: 1, tenantId } }));
};

const callCount = () =>
  StandardizedApi.get.mock.calls.filter(
    (call) => call[0] === CUMULATIVE_MISSING_CONSULTATION_LOGS_ENDPOINT
  ).length;

beforeEach(() => {
  StandardizedApi.get.mockReset();
  useSession.mockReset();
  setUser('tenant-A');
});

describe('useCumulativeMissingConsultationLogs', () => {
  // ─── C1 ──────────────────────────────────────────────────────────
  test('C1: 마운트 시 파라미터 없이 1회 호출 + 정규화', async() => {
    StandardizedApi.get.mockResolvedValue({
      items: [
        { consultantId: 3, consultantName: '조재은', missingDates: ['2026-06-30'] }
      ]
    });

    const { result } = renderHook(() => useCumulativeMissingConsultationLogs());
    await waitFor(() => expect(Array.isArray(result.current.items)).toBe(true));
    expect(callCount()).toBe(1);
    expect(StandardizedApi.get.mock.calls[0]).toEqual([
      CUMULATIVE_MISSING_CONSULTATION_LOGS_ENDPOINT
    ]);
    expect(result.current.items).toEqual([
      { consultantId: 3, consultantName: '조재은', missingDates: ['2026-06-30'] }
    ]);
  });

  // ─── C2 ──────────────────────────────────────────────────────────
  test('C2: 월 경계를 넘는 누락(6/30 + 7/1)이 모두 포함', async() => {
    StandardizedApi.get.mockResolvedValue({
      items: [
        { consultantId: 3, consultantName: '조재은', missingDates: ['2026-06-30', '2026-07-01'] }
      ]
    });
    const { result } = renderHook(() => useCumulativeMissingConsultationLogs());
    await waitFor(() => expect(result.current.items?.length).toBe(1));
    expect(result.current.items[0].missingDates).toEqual(['2026-06-30', '2026-07-01']);
  });

  // ─── C3 ──────────────────────────────────────────────────────────
  test('C3: tenantId 변경 → 캐시 리셋 + 재호출', async() => {
    StandardizedApi.get.mockResolvedValue({ items: [] });
    const { rerender } = renderHook(() => useCumulativeMissingConsultationLogs());
    await waitFor(() => expect(callCount()).toBe(1));

    setUser('tenant-B');
    rerender();
    await waitFor(() => expect(callCount()).toBeGreaterThanOrEqual(2));
  });

  // ─── C4 ──────────────────────────────────────────────────────────
  test('C4: { success: true, data: { items: [...] } } 형태 응답 unwrap', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: {
        items: [{ consultantId: 9, consultantName: 'X', missingDates: ['2026-06-30'] }]
      }
    });
    const { result } = renderHook(() => useCumulativeMissingConsultationLogs());
    await waitFor(() => expect(Array.isArray(result.current.items)).toBe(true));
    expect(result.current.items[0].consultantId).toBe(9);
  });

  // ─── C5 ──────────────────────────────────────────────────────────
  test('C5: API 실패 → items=null sentinel + error 노출', async() => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    StandardizedApi.get.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCumulativeMissingConsultationLogs());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.items).toBeNull();
    consoleSpy.mockRestore();
  });

  // ─── C6 ──────────────────────────────────────────────────────────
  test('C6: unmount race — resolve 가 unmount 이후에도 setState 미호출', async() => {
    let resolveLater;
    StandardizedApi.get.mockImplementation(
      () => new Promise((res) => {
        resolveLater = res;
      })
    );
    const { result, unmount } = renderHook(() => useCumulativeMissingConsultationLogs());
    expect(result.current.isLoading).toBe(true);
    unmount();
    await act(async() => {
      resolveLater({ items: [] });
    });
    expect(result.current.items).toBeNull();
  });

  // ─── C7 ──────────────────────────────────────────────────────────
  test('C7: 캐시 hit — 재렌더 시 추가 API 호출 없음', async() => {
    StandardizedApi.get.mockResolvedValue({ items: [] });
    const { result, rerender } = renderHook(() => useCumulativeMissingConsultationLogs());
    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(callCount()).toBe(1);

    rerender();
    await act(async() => {});
    expect(callCount()).toBe(1);
  });
});
