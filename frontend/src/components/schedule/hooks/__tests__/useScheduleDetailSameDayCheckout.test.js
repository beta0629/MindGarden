/**
 * useScheduleDetailSameDayCheckout — mapping 해석·권한·lazy fetch
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import { act, renderHook } from '@testing-library/react';
import useScheduleDetailSameDayCheckout, {
  buildCheckoutSameDayMappingPayload,
  normalizeMappingsListResponse,
  resolveCheckoutMappingFromSchedule,
  resolveSameDayCheckoutEnabled,
  resolveScheduleMappingId,
  SAME_DAY_CHECKOUT_MSG_MAPPING_INCOMPLETE,
  SAME_DAY_CHECKOUT_MSG_MAPPING_NOT_FOUND
} from '../useScheduleDetailSameDayCheckout';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

const COMPLETE_MAPPING = {
  id: 42,
  consultantId: 7,
  consultantName: '김상담',
  clientId: 9,
  clientName: '이내담',
  packageName: '10회 패키지',
  packagePrice: 500000,
  paymentAmount: 500000,
  totalSessions: 10
};

describe('useScheduleDetailSameDayCheckout helpers', () => {
  test('resolveScheduleMappingId — top-level / extendedProps', () => {
    expect(resolveScheduleMappingId({ mappingId: 42 })).toBe(42);
    expect(resolveScheduleMappingId({ extendedProps: { mappingId: '99' } })).toBe('99');
    expect(resolveScheduleMappingId({})).toBeNull();
  });

  test('normalizeMappingsListResponse', () => {
    expect(normalizeMappingsListResponse({ mappings: [COMPLETE_MAPPING] }))
      .toEqual([COMPLETE_MAPPING]);
    expect(normalizeMappingsListResponse([COMPLETE_MAPPING])).toEqual([COMPLETE_MAPPING]);
    expect(normalizeMappingsListResponse(null)).toEqual([]);
  });

  test('buildCheckoutSameDayMappingPayload — incomplete → null', () => {
    expect(buildCheckoutSameDayMappingPayload({ id: 1, packageName: 'x' }, 10)).toBeNull();
    expect(buildCheckoutSameDayMappingPayload(COMPLETE_MAPPING, 55)).toEqual(
      expect.objectContaining({
        id: 42,
        consultantId: 7,
        packageName: '10회 패키지',
        sameDaySessionScheduleId: 55
      })
    );
  });

  test('resolveCheckoutMappingFromSchedule — not found / incomplete / ok', () => {
    expect(resolveCheckoutMappingFromSchedule({ id: 1 }, []).reason)
      .toBe('missing_mapping_id');
    expect(resolveCheckoutMappingFromSchedule({ id: 1, mappingId: 42 }, []).reason)
      .toBe('not_found');
    expect(resolveCheckoutMappingFromSchedule(
      { id: 1, mappingId: 42 },
      [{ id: 42, packageName: 'x' }]
    ).reason).toBe('incomplete');
    const ok = resolveCheckoutMappingFromSchedule(
      { id: 88, mappingId: 42 },
      [COMPLETE_MAPPING]
    );
    expect(ok.ok).toBe(true);
    expect(ok.payload.sameDaySessionScheduleId).toBe(88);
  });

  test('resolveSameDayCheckoutEnabled — admin/staff true, consultant false', () => {
    expect(resolveSameDayCheckoutEnabled({ role: 'ADMIN' })).toBe(true);
    expect(resolveSameDayCheckoutEnabled({ role: 'STAFF' })).toBe(true);
    expect(resolveSameDayCheckoutEnabled({ role: 'CONSULTANT' })).toBe(false);
    expect(resolveSameDayCheckoutEnabled({ role: 'CONSULTANT' }, true)).toBe(true);
    expect(resolveSameDayCheckoutEnabled({ role: 'ADMIN' }, false)).toBe(false);
  });
});

describe('useScheduleDetailSameDayCheckout hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('enabled=false → onCheckoutSameDayFromDetail null (확정 fallback 경로)', () => {
    const { result } = renderHook(() => useScheduleDetailSameDayCheckout({
      enabled: false,
      user: { role: 'CONSULTANT' }
    }));
    expect(result.current.onCheckoutSameDayFromDetail).toBeNull();
  });

  test('admin + 매핑 조회 성공 → checkoutSameDayMapping set', async() => {
    StandardizedApi.get.mockResolvedValue({ mappings: [COMPLETE_MAPPING] });
    const { result } = renderHook(() => useScheduleDetailSameDayCheckout({
      user: { role: 'ADMIN' }
    }));

    await act(async() => {
      await result.current.onCheckoutSameDayFromDetail({
        id: 100,
        mappingId: 42
      });
    });

    expect(result.current.checkoutSameDayMapping).toEqual(
      expect.objectContaining({
        id: 42,
        sameDaySessionScheduleId: 100,
        packageName: '10회 패키지'
      })
    );
  });

  test('mappingId 없음 → error toast, 모달 미오픈', async() => {
    const { result } = renderHook(() => useScheduleDetailSameDayCheckout({
      enabled: true
    }));

    await act(async() => {
      await result.current.onCheckoutSameDayFromDetail({ id: 1 });
    });

    expect(notificationManager.error).toHaveBeenCalledWith(
      SAME_DAY_CHECKOUT_MSG_MAPPING_NOT_FOUND
    );
    expect(result.current.checkoutSameDayMapping).toBeNull();
  });

  test('불완전 매칭 → warning toast', async() => {
    StandardizedApi.get.mockResolvedValue({
      mappings: [{ id: 42, packageName: 'x' }]
    });
    const { result } = renderHook(() => useScheduleDetailSameDayCheckout({
      enabled: true
    }));

    await act(async() => {
      await result.current.onCheckoutSameDayFromDetail({
        id: 1,
        mappingId: 42
      });
    });

    expect(notificationManager.warning).toHaveBeenCalledWith(
      SAME_DAY_CHECKOUT_MSG_MAPPING_INCOMPLETE
    );
    expect(result.current.checkoutSameDayMapping).toBeNull();
  });

  test('handleCheckoutSameDayCompleted → mapping clear + onCheckoutCompleted', () => {
    const onCheckoutCompleted = jest.fn();
    const { result } = renderHook(() => useScheduleDetailSameDayCheckout({
      enabled: true,
      user: { role: 'ADMIN' },
      onCheckoutCompleted
    }));

    act(() => {
      result.current.handleCheckoutSameDayCompleted();
    });

    expect(result.current.checkoutSameDayMapping).toBeNull();
    expect(onCheckoutCompleted).toHaveBeenCalledTimes(1);
  });
});
