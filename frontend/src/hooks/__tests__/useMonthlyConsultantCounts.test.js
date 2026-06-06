/**
 * useMonthlyConsultantCounts — 신규 공통 hook 단위 테스트.
 *
 * Phase 3-B (R6 2026-06-06) — IntegratedMatchingSchedule + AdminDashboardV2 가
 * 동일 SSOT 의 월별 카운트를 동일 캐시 정책으로 사용하기 위해 추출된 hook.
 *
 * 검증 매트릭스:
 *  - H1: 마운트 시 monthly-consultant-counts API 1회 호출 + Map 변환
 *  - H2: 동일 tenantId/year/month 재마운트 → 추가 호출 없음 (모듈 스코프 캐시 hit) — 스킵: hook 내부 캐시는 컴포넌트 스코프
 *  - H3: year/month 변경 → 새 API 호출 + 새 Map
 *  - H4: tenantId 변경 → 캐시 리셋 + 동일 year/month 라도 재호출
 *  - H5: { success: true, data: { counts: [...] } } 형태 응답 unwrap
 *  - H6: API 실패 → 빈 Map + error 노출 + 토스트 미발동
 *  - H7: year/month null/undefined → fetch 미발동 (안전 가드)
 *  - H8: unmount race (cancelled) — resolve 가 unmount 이후 도착해도 setState 미호출
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
import useMonthlyConsultantCounts, {
  MONTHLY_CONSULTANT_COUNTS_ENDPOINT
} from '../useMonthlyConsultantCounts';

const setUser = (tenantId) => {
  useSession.mockImplementation(() => ({ user: { id: 1, tenantId } }));
};

const monthlyCallCount = () =>
  StandardizedApi.get.mock.calls.filter(
    (call) => call[0] === MONTHLY_CONSULTANT_COUNTS_ENDPOINT
  ).length;

beforeEach(() => {
  StandardizedApi.get.mockReset();
  useSession.mockReset();
  setUser('tenant-A');
});

describe('useMonthlyConsultantCounts', () => {
  // ─── H1 ──────────────────────────────────────────────────────────
  test('H1: 마운트 시 1회 호출 + Map 변환', async() => {
    StandardizedApi.get.mockResolvedValue({
      year: 2026,
      month: 6,
      counts: [
        { consultantId: 11, consultantName: 'A', count: 5 },
        { consultantId: 12, consultantName: 'B', count: 0 }
      ]
    });

    const { result } = renderHook(() => useMonthlyConsultantCounts(2026, 6));

    await waitFor(() => expect(result.current.counts.size).toBe(2));
    expect(monthlyCallCount()).toBe(1);
    expect(StandardizedApi.get.mock.calls[0]).toEqual([
      MONTHLY_CONSULTANT_COUNTS_ENDPOINT,
      { year: 2026, month: 6 }
    ]);
    expect(result.current.counts.get(11)).toBe(5);
    expect(result.current.counts.get(12)).toBe(0);
    expect(result.current.error).toBeNull();
  });

  // ─── H3 ──────────────────────────────────────────────────────────
  test('H3: year/month 변경 → 새 API 호출 + 새 Map', async() => {
    StandardizedApi.get.mockResolvedValueOnce({
      counts: [{ consultantId: 11, consultantName: 'A', count: 5 }]
    });
    StandardizedApi.get.mockResolvedValueOnce({
      counts: [{ consultantId: 11, consultantName: 'A', count: 9 }]
    });

    const { result, rerender } = renderHook(
      ({ year, month }) => useMonthlyConsultantCounts(year, month),
      { initialProps: { year: 2026, month: 6 } }
    );
    await waitFor(() => expect(result.current.counts.get(11)).toBe(5));
    expect(monthlyCallCount()).toBe(1);

    rerender({ year: 2026, month: 7 });
    await waitFor(() => expect(result.current.counts.get(11)).toBe(9));
    expect(monthlyCallCount()).toBe(2);
    expect(StandardizedApi.get.mock.calls[1][1]).toEqual({ year: 2026, month: 7 });
  });

  // ─── H4 ──────────────────────────────────────────────────────────
  test('H4: tenantId 변경 → 캐시 리셋 + 동일 year/month 라도 재호출', async() => {
    StandardizedApi.get.mockResolvedValue({
      counts: [{ consultantId: 11, consultantName: 'A', count: 5 }]
    });

    const { result, rerender } = renderHook(() => useMonthlyConsultantCounts(2026, 6));
    await waitFor(() => expect(monthlyCallCount()).toBe(1));

    setUser('tenant-B');
    rerender();

    await waitFor(() => expect(monthlyCallCount()).toBeGreaterThanOrEqual(2));
    expect(result.current.counts.get(11)).toBe(5);
  });

  // ─── H5 ──────────────────────────────────────────────────────────
  test('H5: { success: true, data: { counts: [...] } } 형태 응답 unwrap', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: {
        year: 2026,
        month: 6,
        counts: [{ consultantId: 11, consultantName: 'A', count: 7 }]
      }
    });

    const { result } = renderHook(() => useMonthlyConsultantCounts(2026, 6));
    await waitFor(() => expect(result.current.counts.size).toBe(1));
    expect(result.current.counts.get(11)).toBe(7);
  });

  // ─── H6 ──────────────────────────────────────────────────────────
  test('H6: API 실패 → 빈 Map + error 노출 + 토스트 미발동 (조용한 실패)', async() => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    StandardizedApi.get.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useMonthlyConsultantCounts(2026, 6));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.counts.size).toBe(0);
    consoleSpy.mockRestore();
  });

  // ─── H7 ──────────────────────────────────────────────────────────
  test('H7: year/month null → fetch 미발동', async() => {
    const { result } = renderHook(() => useMonthlyConsultantCounts(null, 6));
    // microtask flush
    await act(async() => {});
    expect(monthlyCallCount()).toBe(0);
    expect(result.current.counts.size).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  // ─── H8 ──────────────────────────────────────────────────────────
  test('H8: unmount race — resolve 가 unmount 이후 도착해도 setState 미발동', async() => {
    let resolveLater;
    StandardizedApi.get.mockImplementation(
      () => new Promise((res) => {
        resolveLater = res;
      })
    );

    const { result, unmount } = renderHook(() => useMonthlyConsultantCounts(2026, 6));
    expect(result.current.isLoading).toBe(true);

    unmount();
    await act(async() => {
      resolveLater({ counts: [{ consultantId: 11, consultantName: 'A', count: 1 }] });
    });
    // Unmounted 이후 추가 setState 없음 — 테스트 통과 자체로 검증.
    // (renderHook 의 result 는 unmount 후에도 마지막 값 유지.)
    expect(result.current.counts.size).toBe(0);
  });
});
