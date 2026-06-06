/**
 * useMissingConsultationLogs — 신규 공통 hook 단위 테스트.
 *
 * Phase 3-B (R6 2026-06-06) — IntegratedMatchingSchedule + AdminDashboardV2 가
 * 동일 SSOT 의 누락 일지 데이터를 동일 캐시 정책으로 사용하기 위해 추출된 hook.
 *
 * 검증 매트릭스:
 *  - M1: 마운트 시 monthly-missing-consultation-logs API 1회 호출 + 정규화
 *  - M2: year/month 변경 → 새 API 호출 + 새 items
 *  - M3: tenantId 변경 → 캐시 리셋 + items=null sentinel 재진입 가능 + 재호출
 *  - M4: { success: true, data: { items: [...] } } 형태 응답 unwrap
 *  - M5: API 실패 → items=null + error 노출
 *  - M6: year/month null → fetch 미발동, items=null sentinel 유지
 *  - M7: unmount race (cancelled) — resolve 가 unmount 이후에도 setState 미호출
 *  - M8: items 정규화 — missingDates 가 배열이 아니면 [] 폴백
 *
 * @author MindGarden core-coder
 * @since 2026-06-06
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
import useMissingConsultationLogs, {
  MONTHLY_MISSING_CONSULTATION_LOGS_ENDPOINT
} from '../useMissingConsultationLogs';

const setUser = (tenantId) => {
  useSession.mockImplementation(() => ({ user: { id: 1, tenantId } }));
};

const callCount = () =>
  StandardizedApi.get.mock.calls.filter(
    (call) => call[0] === MONTHLY_MISSING_CONSULTATION_LOGS_ENDPOINT
  ).length;

beforeEach(() => {
  StandardizedApi.get.mockReset();
  useSession.mockReset();
  setUser('tenant-A');
});

describe('useMissingConsultationLogs', () => {
  // ─── M1 ──────────────────────────────────────────────────────────
  test('M1: 마운트 시 1회 호출 + 정규화', async() => {
    StandardizedApi.get.mockResolvedValue({
      year: 2026,
      month: 6,
      items: [
        { consultantId: 3, consultantName: '이혁진', missingDates: ['2026-06-15'] }
      ]
    });

    const { result } = renderHook(() => useMissingConsultationLogs(2026, 6));
    await waitFor(() => expect(Array.isArray(result.current.items)).toBe(true));
    expect(callCount()).toBe(1);
    expect(StandardizedApi.get.mock.calls[0]).toEqual([
      MONTHLY_MISSING_CONSULTATION_LOGS_ENDPOINT,
      { year: 2026, month: 6 }
    ]);
    expect(result.current.items).toEqual([
      { consultantId: 3, consultantName: '이혁진', missingDates: ['2026-06-15'] }
    ]);
  });

  // ─── M2 ──────────────────────────────────────────────────────────
  test('M2: year/month 변경 → 새 API 호출', async() => {
    StandardizedApi.get
      .mockResolvedValueOnce({ items: [] })
      .mockResolvedValueOnce({
        items: [{ consultantId: 4, consultantName: 'B', missingDates: ['2026-07-01'] }]
      });

    const { result, rerender } = renderHook(
      ({ year, month }) => useMissingConsultationLogs(year, month),
      { initialProps: { year: 2026, month: 6 } }
    );
    await waitFor(() => expect(result.current.items).toEqual([]));

    rerender({ year: 2026, month: 7 });
    await waitFor(() => expect(result.current.items?.length).toBe(1));
    expect(callCount()).toBe(2);
  });

  // ─── M3 ──────────────────────────────────────────────────────────
  test('M3: tenantId 변경 → 캐시 리셋 + 재호출', async() => {
    StandardizedApi.get.mockResolvedValue({ items: [] });
    const { rerender } = renderHook(() => useMissingConsultationLogs(2026, 6));
    await waitFor(() => expect(callCount()).toBe(1));

    setUser('tenant-B');
    rerender();
    await waitFor(() => expect(callCount()).toBeGreaterThanOrEqual(2));
  });

  // ─── M4 ──────────────────────────────────────────────────────────
  test('M4: { success: true, data: { items: [...] } } 형태 응답 unwrap', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: {
        items: [{ consultantId: 9, consultantName: 'X', missingDates: ['2026-06-30'] }]
      }
    });
    const { result } = renderHook(() => useMissingConsultationLogs(2026, 6));
    await waitFor(() => expect(Array.isArray(result.current.items)).toBe(true));
    expect(result.current.items[0].consultantId).toBe(9);
  });

  // ─── M5 ──────────────────────────────────────────────────────────
  test('M5: API 실패 → items=null sentinel + error 노출', async() => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    StandardizedApi.get.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useMissingConsultationLogs(2026, 6));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.items).toBeNull();
    consoleSpy.mockRestore();
  });

  // ─── M6 ──────────────────────────────────────────────────────────
  test('M6: year/month null → fetch 미발동, items=null sentinel 유지', async() => {
    const { result } = renderHook(() => useMissingConsultationLogs(null, null));
    await act(async() => {});
    expect(callCount()).toBe(0);
    expect(result.current.items).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  // ─── M7 ──────────────────────────────────────────────────────────
  test('M7: unmount race — resolve 가 unmount 이후에도 setState 미호출', async() => {
    let resolveLater;
    StandardizedApi.get.mockImplementation(
      () => new Promise((res) => {
        resolveLater = res;
      })
    );
    const { result, unmount } = renderHook(() => useMissingConsultationLogs(2026, 6));
    expect(result.current.isLoading).toBe(true);
    unmount();
    await act(async() => {
      resolveLater({ items: [] });
    });
    expect(result.current.items).toBeNull();
  });

  // ─── M8 ──────────────────────────────────────────────────────────
  test('M8: missingDates 가 배열이 아니면 빈 배열로 폴백', async() => {
    StandardizedApi.get.mockResolvedValue({
      items: [
        { consultantId: 1, consultantName: 'A', missingDates: 'bogus' },
        { consultantId: 2, consultantName: 'B' /* missingDates 누락 */ }
      ]
    });
    const { result } = renderHook(() => useMissingConsultationLogs(2026, 6));
    await waitFor(() => expect(result.current.items?.length).toBe(2));
    expect(result.current.items[0].missingDates).toEqual([]);
    expect(result.current.items[1].missingDates).toEqual([]);
  });
});
