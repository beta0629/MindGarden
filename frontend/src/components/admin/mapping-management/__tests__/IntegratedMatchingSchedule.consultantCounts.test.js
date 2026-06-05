/**
 * IntegratedMatchingSchedule — 월별 상담사 COMPLETED 카운트 캐시·트리거 회귀 테스트.
 *
 * 검증 매트릭스 (F10~F15):
 *  - F10: 마운트 시 StandardizedApi.get('/api/v1/schedules/monthly-consultant-counts', { year, month }) 1회 호출 + Map 보관
 *  - F11: 동일 tenantId/year/month onMonthChange 재호출 → 추가 API 호출 없음 (캐시 hit)
 *  - F12: currentMonth 변경 → 새 API 호출
 *  - F13: user.tenantId 변경 → 캐시 리셋 → 동일 year/month 라도 재호출
 *  - F14: API 실패 → consultantCounts 빈 Map + 토스트 없음 (조용한 실패)
 *  - F15: { success: true, data: { counts: [...] } } 형태 응답도 정상 unwrap
 *
 * 전략: UnifiedScheduleComponent 를 mock 해 props.onMonthChange / consultantCounts 를
 * 외부 캡처 → 외부에서 onMonthChange 트리거 + consultantCounts 검증.
 *
 * SSOT: frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js
 *
 * @author MindGarden core-tester
 * @since 2026-06-09
 */

import React from 'react';
import { render, act, waitFor, cleanup } from '@testing-library/react';

const MONTHLY_ENDPOINT = '/api/v1/schedules/monthly-consultant-counts';
const MAPPINGS_ENDPOINT = '/api/v1/admin/mappings'; // SSOT 가 ADMIN_MAPPINGS_LIST 라 가정 — get path 가 다를 수 있어 endpoint 매칭은 '/monthly-consultant-counts' 포함 여부로 분기

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

// useSession 은 mockImplementation 으로 동적 변경 가능하도록 jest.fn() 으로
jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: jest.fn(),
  SessionContext: { Provider: ({ children }) => children }
}));

jest.mock('../../../../utils/safeDisplay', () => ({
  __esModule: true,
  toDisplayString: (v) => (v == null ? '' : String(v))
}));

jest.mock('@fullcalendar/interaction', () => {
  class MockDraggable {
    constructor() {}
    destroy() {}
  }
  return { __esModule: true, Draggable: MockDraggable };
});

jest.mock('../../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

// UnifiedScheduleComponent — onMonthChange / consultantCounts 를 외부 캡처
var mockUnifiedScheduleProps = { onMonthChange: null, consultantCounts: null };
jest.mock('../../../schedule/UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: (props) => {
    mockUnifiedScheduleProps.onMonthChange = props.onMonthChange;
    mockUnifiedScheduleProps.consultantCounts = props.consultantCounts;
    return <div data-testid="unified-schedule" />;
  }
}));

jest.mock('../../../schedule/ScheduleModal', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../../MappingCreationModal', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../../mapping/MappingPaymentModal', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../../mapping/MappingDepositModal', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../../mapping/CheckoutSameDayModal', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../molecules/MappingCancelModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));
jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ actions }) => <div>{actions}</div>
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mock-erp-class',
  ERP_MG_BUTTON_LOADING_TEXT: 'loading...'
}));

jest.mock('../../../common/ActionBarButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

jest.mock('../integrated-schedule/organisms/MappingScheduleCard', () => ({
  __esModule: true,
  default: ({ mapping }) => <div>{mapping?.clientName ?? ''}</div>
}));

import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';
import StandardizedApi from '../../../../utils/standardizedApi';
import notificationManager from '../../../../utils/notification';
import { useSession } from '../../../../contexts/SessionContext';

const FIXED_DATE_ISO = '2026-06-15T09:00:00.000Z';
const FIXED_TS = new Date(FIXED_DATE_ISO).getTime();
const RealDate = global.Date;

class FixedDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) {
      super(FIXED_TS);
    } else {
      super(...args);
    }
  }
  static now() {
    return FIXED_TS;
  }
  static parse(...args) {
    return RealDate.parse(...args);
  }
  static UTC(...args) {
    return RealDate.UTC(...args);
  }
}

const buildMonthlyResponse = (counts, { wrap = false, year = 2026, month = 6 } = {}) => {
  const payload = { year, month, counts };
  return wrap ? { success: true, data: payload } : payload;
};

const setupApiResponses = ({ monthly = buildMonthlyResponse([]) } = {}) => {
  StandardizedApi.get.mockImplementation((endpoint) => {
    if (endpoint && endpoint.includes('/monthly-consultant-counts')) {
      return Promise.resolve(monthly);
    }
    // 기본 매핑 목록 응답 (loadMappings 가 호출).
    return Promise.resolve({ mappings: [] });
  });
};

const monthlyCallCount = () =>
  StandardizedApi.get.mock.calls.filter(
    (call) => call[0] && String(call[0]).includes('/monthly-consultant-counts')
  ).length;

const lastMonthlyCallParams = () => {
  const calls = StandardizedApi.get.mock.calls.filter(
    (call) => call[0] && String(call[0]).includes('/monthly-consultant-counts')
  );
  return calls.length ? calls[calls.length - 1][1] : null;
};

beforeAll(() => {
  // 시간 고정: jest.useFakeTimers 는 Promise/microtask 도 가로채 waitFor 가 멈춘다.
  // Date constructor 만 교체하여 mount 시 currentYear/Month 산출만 안정화한다.
  global.Date = FixedDate;
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  StandardizedApi.get.mockReset();
  StandardizedApi.post.mockReset();
  StandardizedApi.post.mockResolvedValue({});
  Object.values(notificationManager).forEach((fn) => fn.mockClear?.());
  useSession.mockImplementation(() => ({
    user: { id: 1, name: 'Admin', role: 'ADMIN', tenantId: 'tenant-A' }
  }));
  mockUnifiedScheduleProps.onMonthChange = null;
  mockUnifiedScheduleProps.consultantCounts = null;
});

afterEach(() => {
  cleanup();
});

describe('IntegratedMatchingSchedule — 월별 상담사 COMPLETED 카운트 캐시·트리거', () => {
  // ─── F10 ───────────────────────────────────────────────────────────
  test('F10: 마운트 시 monthly-consultant-counts API 1회 호출 + Map 보관', async() => {
    setupApiResponses({
      monthly: buildMonthlyResponse([
        { consultantId: 11, consultantName: 'A', count: 5 },
        { consultantId: 12, consultantName: 'B', count: 0 }
      ])
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(monthlyCallCount()).toBe(1));

    expect(lastMonthlyCallParams()).toEqual({
      year: 2026,
      month: 6
    });

    await waitFor(() => {
      expect(mockUnifiedScheduleProps.consultantCounts).toBeInstanceOf(Map);
      expect(mockUnifiedScheduleProps.consultantCounts.size).toBe(2);
    });
    expect(mockUnifiedScheduleProps.consultantCounts.get(11)).toBe(5);
    expect(mockUnifiedScheduleProps.consultantCounts.get(12)).toBe(0);
  });

  // ─── F11 ───────────────────────────────────────────────────────────
  test('F11: 동일 tenantId/year/month onMonthChange 재호출 → 추가 API 호출 없음 (캐시 hit)', async() => {
    setupApiResponses({
      monthly: buildMonthlyResponse([{ consultantId: 11, consultantName: 'A', count: 5 }])
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(monthlyCallCount()).toBe(1));
    expect(typeof mockUnifiedScheduleProps.onMonthChange).toBe('function');

    // 동일 6월(15일 mid) 으로 재트리거 → setCurrentYear/Month 가 동일값이라 setter no-op,
    // 그러나 useEffect deps 변경 없음 → API 추가 호출 없음 (캐시 hit + setter dedup).
    await act(async() => {
      mockUnifiedScheduleProps.onMonthChange({
        start: new Date('2026-06-01T00:00:00.000Z'),
        end: new Date('2026-07-05T00:00:00.000Z'),
        view: 'dayGridMonth'
      });
    });

    // microtask flush 후에도 추가 호출이 없는지 확인
    await Promise.resolve();
    expect(monthlyCallCount()).toBe(1);
  });

  // ─── F12 ───────────────────────────────────────────────────────────
  test('F12: currentMonth 변경 → 새 API 호출', async() => {
    setupApiResponses({
      monthly: buildMonthlyResponse([{ consultantId: 11, consultantName: 'A', count: 5 }])
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(monthlyCallCount()).toBe(1));

    // 7월로 이동 — start 의 year/month 의 15일이 mid 이므로 start 가 7월이면 month=7.
    await act(async() => {
      mockUnifiedScheduleProps.onMonthChange({
        start: new Date('2026-07-01T00:00:00.000Z'),
        end: new Date('2026-08-09T00:00:00.000Z'),
        view: 'dayGridMonth'
      });
    });

    await waitFor(() => expect(monthlyCallCount()).toBe(2));
    expect(lastMonthlyCallParams()).toEqual({ year: 2026, month: 7 });
  });

  // ─── F13 ───────────────────────────────────────────────────────────
  test('F13: user.tenantId 변경 → 캐시 리셋 → 동일 year/month 라도 재호출', async() => {
    setupApiResponses({
      monthly: buildMonthlyResponse([{ consultantId: 11, consultantName: 'A', count: 5 }])
    });

    let view;
    await act(async() => {
      view = render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(monthlyCallCount()).toBe(1));

    // user.tenantId 변경 → SessionContext mock 변경 + rerender
    useSession.mockImplementation(() => ({
      user: { id: 1, name: 'Admin', role: 'ADMIN', tenantId: 'tenant-B' }
    }));
    await act(async() => {
      view.rerender(<IntegratedMatchingSchedule />);
    });

    // 같은 month 지만 tenantId 가 바뀌어 캐시 리셋 → 새 API 호출 발생.
    await waitFor(() => expect(monthlyCallCount()).toBeGreaterThanOrEqual(2));
  });

  // ─── F14 ───────────────────────────────────────────────────────────
  test('F14: API 실패 → consultantCounts 빈 Map + 토스트 없음 (조용한 실패)', async() => {
    StandardizedApi.get.mockImplementation((endpoint) => {
      if (endpoint && endpoint.includes('/monthly-consultant-counts')) {
        return Promise.reject(new Error('boom'));
      }
      return Promise.resolve({ mappings: [] });
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(monthlyCallCount()).toBe(1));

    await waitFor(() => {
      expect(mockUnifiedScheduleProps.consultantCounts).toBeInstanceOf(Map);
      expect(mockUnifiedScheduleProps.consultantCounts.size).toBe(0);
    });

    // 조용한 실패 — 토스트 미노출
    expect(notificationManager.error).not.toHaveBeenCalled();
    expect(notificationManager.warning).not.toHaveBeenCalled();
    expect(notificationManager.info).not.toHaveBeenCalled();
  });

  // ─── F15 ───────────────────────────────────────────────────────────
  test('F15: { success: true, data: { counts: [...] } } 형태 응답도 정상 unwrap', async() => {
    setupApiResponses({
      monthly: buildMonthlyResponse(
        [
          { consultantId: 11, consultantName: 'A', count: 5 },
          { consultantId: 12, consultantName: 'B', count: 3 }
        ],
        { wrap: true }
      )
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => {
      expect(mockUnifiedScheduleProps.consultantCounts).toBeInstanceOf(Map);
      expect(mockUnifiedScheduleProps.consultantCounts.size).toBe(2);
    });
    expect(mockUnifiedScheduleProps.consultantCounts.get(11)).toBe(5);
    expect(mockUnifiedScheduleProps.consultantCounts.get(12)).toBe(3);
  });
});
