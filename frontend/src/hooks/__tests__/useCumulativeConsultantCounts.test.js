/**
 * useCumulativeConsultantCounts — 신규 공통 hook 단위 테스트.
 *
 * Phase 3-B (R6 2026-06-06) — AdminDashboardV2 「상담사 별 통합데이터」 카드의
 * §A «누적 상담 건수» 섹션 SSOT.
 *
 * 검증 매트릭스:
 *  - U1: 마운트 시 cumulative-consultant-counts API 1회 호출 (year/month 파라미터 없음)
 *  - U2: tenantId 단일 캐시 — 동일 tenantId 재호출 시 캐시 hit (rerender)
 *  - U3: tenantId 변경 → 캐시 리셋 + 재호출
 *  - U4: { success: true, data: { counts: [...] } } 형태 응답 unwrap
 *  - U5: API 실패 → 빈 Map + error 노출 (조용한 실패)
 *  - U6: 응답 counts 가 배열이 아니면 빈 Map 유지 (안전 폴백)
 *  - U7: unmount race — resolve 가 unmount 이후에도 setState 미호출
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
import useCumulativeConsultantCounts, {
  CUMULATIVE_CONSULTANT_COUNTS_ENDPOINT
} from '../useCumulativeConsultantCounts';

const setUser = (tenantId) => {
  useSession.mockImplementation(() => ({ user: { id: 1, tenantId } }));
};

const callCount = () =>
  StandardizedApi.get.mock.calls.filter(
    (call) => call[0] === CUMULATIVE_CONSULTANT_COUNTS_ENDPOINT
  ).length;

beforeEach(() => {
  StandardizedApi.get.mockReset();
  useSession.mockReset();
  setUser('tenant-A');
});

describe('useCumulativeConsultantCounts', () => {
  // ─── U1 ──────────────────────────────────────────────────────────
  test('U1: 마운트 시 1회 호출 (year/month 파라미터 없음)', async() => {
    StandardizedApi.get.mockResolvedValue({
      counts: [
        { consultantId: 11, consultantName: 'A', count: 50 },
        { consultantId: 12, consultantName: 'B', count: 0 }
      ]
    });

    const { result } = renderHook(() => useCumulativeConsultantCounts());
    await waitFor(() => expect(result.current.counts.size).toBe(2));
    expect(callCount()).toBe(1);
    // 두 번째 인자(year/month) 가 전달되면 안 됨
    expect(StandardizedApi.get.mock.calls[0]).toEqual([
      CUMULATIVE_CONSULTANT_COUNTS_ENDPOINT
    ]);
    expect(result.current.counts.get(11)).toBe(50);
    expect(result.current.counts.get(12)).toBe(0);
    expect(result.current.error).toBeNull();
  });

  // ─── U2 ──────────────────────────────────────────────────────────
  test('U2: 동일 tenantId rerender → 캐시 hit (추가 호출 없음)', async() => {
    StandardizedApi.get.mockResolvedValue({
      counts: [{ consultantId: 11, consultantName: 'A', count: 5 }]
    });

    const { result, rerender } = renderHook(() => useCumulativeConsultantCounts());
    await waitFor(() => expect(result.current.counts.size).toBe(1));
    expect(callCount()).toBe(1);

    rerender();
    await act(async() => {});
    expect(callCount()).toBe(1);
  });

  // ─── U3 ──────────────────────────────────────────────────────────
  test('U3: tenantId 변경 → 캐시 리셋 + 재호출', async() => {
    StandardizedApi.get.mockResolvedValue({
      counts: [{ consultantId: 11, consultantName: 'A', count: 5 }]
    });

    const { rerender } = renderHook(() => useCumulativeConsultantCounts());
    await waitFor(() => expect(callCount()).toBe(1));

    setUser('tenant-B');
    rerender();
    await waitFor(() => expect(callCount()).toBeGreaterThanOrEqual(2));
  });

  // ─── U4 ──────────────────────────────────────────────────────────
  test('U4: { success: true, data: { counts: [...] } } 형태 응답 unwrap', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: {
        counts: [
          { consultantId: 11, consultantName: 'A', count: 5 },
          { consultantId: 12, consultantName: 'B', count: 3 }
        ]
      }
    });
    const { result } = renderHook(() => useCumulativeConsultantCounts());
    await waitFor(() => expect(result.current.counts.size).toBe(2));
    expect(result.current.counts.get(12)).toBe(3);
  });

  // ─── U5 ──────────────────────────────────────────────────────────
  test('U5: API 실패 → 빈 Map + error 노출 (조용한 실패)', async() => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    StandardizedApi.get.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCumulativeConsultantCounts());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.counts.size).toBe(0);
    consoleSpy.mockRestore();
  });

  // ─── U6 ──────────────────────────────────────────────────────────
  test('U6: 응답 counts 가 배열이 아니면 빈 Map 유지', async() => {
    StandardizedApi.get.mockResolvedValue({ counts: 'bogus' });
    const { result } = renderHook(() => useCumulativeConsultantCounts());
    // resolve 후 isLoading=false 까지 대기 — 빈 Map 이므로 size 0 유지.
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.counts.size).toBe(0);
    expect(result.current.error).toBeNull();
  });

  // ─── U7 ──────────────────────────────────────────────────────────
  test('U7: unmount race — resolve 가 unmount 이후에도 setState 미호출', async() => {
    let resolveLater;
    StandardizedApi.get.mockImplementation(
      () => new Promise((res) => {
        resolveLater = res;
      })
    );
    const { result, unmount } = renderHook(() => useCumulativeConsultantCounts());
    expect(result.current.isLoading).toBe(true);
    unmount();
    await act(async() => {
      resolveLater({ counts: [{ consultantId: 11, consultantName: 'A', count: 1 }] });
    });
    // unmount 이후 setState 가 호출되지 않으므로 마지막 값이 유지됨 (빈 Map).
    expect(result.current.counts.size).toBe(0);
  });
});
