/**
 * IntegratedMatchingSchedule — 월별 상담일지 누락 일자 캐시·트리거 회귀 테스트.
 *
 * 검증 매트릭스 (G1~G6):
 *  - G1: 마운트 시 StandardizedApi.get('/api/v1/schedules/monthly-missing-consultation-logs',
 *        { year, month }) 1회 호출 + missingConsultationLogs 정규화 결과 전달
 *  - G2: 동일 tenantId/year/month onMonthChange 재호출 → 추가 API 호출 없음 (캐시 hit)
 *  - G3: currentMonth 변경 → 새 API 호출 (activeStart 우선 SSOT)
 *  - G4: user.tenantId 변경 → 캐시 리셋 → 동일 year/month 라도 재호출
 *  - G5: API 실패 → missingConsultationLogs null + 토스트 없음 (조용한 실패)
 *  - G6: { success: true, data: { items: [...] } } 형태 응답도 정상 unwrap
 *
 * 전략: UnifiedScheduleComponent 를 mock 해 props.missingConsultationLogs / onMonthChange 를
 * 외부 캡처 → 외부에서 onMonthChange 트리거 + missingConsultationLogs 검증.
 *
 * SSOT: frontend/src/components/admin/mapping-management/IntegratedMatchingSchedule.js
 *       src/main/java/com/coresolution/consultation/dto/MonthlyMissingConsultationLogsResponse.java
 *
 * @author MindGarden core-tester
 * @since 2026-06-09
 */

import React from 'react';
import { render, act, waitFor, cleanup } from '@testing-library/react';

const MISSING_LOGS_ENDPOINT = '/api/v1/schedules/monthly-missing-consultation-logs';

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

var mockUnifiedScheduleProps = {
  onMonthChange: null,
  missingConsultationLogs: null
};
jest.mock('../../../schedule/UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: (props) => {
    mockUnifiedScheduleProps.onMonthChange = props.onMonthChange;
    mockUnifiedScheduleProps.missingConsultationLogs = props.missingConsultationLogs;
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

const buildMissingLogsResponse = (items, { wrap = false, year = 2026, month = 6 } = {}) => {
  const payload = { year, month, items };
  return wrap ? { success: true, data: payload } : payload;
};

const setupApiResponses = ({ missingLogs = buildMissingLogsResponse([]) } = {}) => {
  StandardizedApi.get.mockImplementation((endpoint) => {
    if (endpoint && endpoint.includes('/monthly-missing-consultation-logs')) {
      return Promise.resolve(missingLogs);
    }
    // 동일 컴포넌트가 호출하는 카운트 API — 본 테스트는 missing-logs 만 검증, 빈 응답 반환.
    if (endpoint && endpoint.includes('/monthly-consultant-counts')) {
      return Promise.resolve({ year: 2026, month: 6, counts: [] });
    }
    return Promise.resolve({ mappings: [] });
  });
};

const missingLogsCallCount = () =>
  StandardizedApi.get.mock.calls.filter(
    (call) => call[0] && String(call[0]).includes('/monthly-missing-consultation-logs')
  ).length;

const lastMissingLogsCallParams = () => {
  const calls = StandardizedApi.get.mock.calls.filter(
    (call) => call[0] && String(call[0]).includes('/monthly-missing-consultation-logs')
  );
  return calls.length ? calls[calls.length - 1][1] : null;
};

beforeAll(() => {
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
  mockUnifiedScheduleProps.missingConsultationLogs = null;
});

afterEach(() => {
  cleanup();
});

describe('IntegratedMatchingSchedule — 월별 상담일지 누락 일자 캐시·트리거', () => {
  // ─── G1 ────────────────────────────────────────────────────────────
  test('G1: 마운트 시 monthly-missing-consultation-logs API 1회 호출 + 정규화 결과 전달', async() => {
    setupApiResponses({
      missingLogs: buildMissingLogsResponse([
        { consultantId: 3, consultantName: '이혁진', missingDates: ['2026-06-15', '2026-06-22'] },
        { consultantId: 4, consultantName: '김상담', missingDates: ['2026-06-30'] }
      ])
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(missingLogsCallCount()).toBe(1));

    expect(lastMissingLogsCallParams()).toEqual({ year: 2026, month: 6 });

    await waitFor(() => {
      expect(Array.isArray(mockUnifiedScheduleProps.missingConsultationLogs)).toBe(true);
      expect(mockUnifiedScheduleProps.missingConsultationLogs).toHaveLength(2);
    });
    expect(mockUnifiedScheduleProps.missingConsultationLogs[0]).toMatchObject({
      consultantId: 3,
      consultantName: '이혁진'
    });
    expect(mockUnifiedScheduleProps.missingConsultationLogs[0].missingDates).toEqual([
      '2026-06-15',
      '2026-06-22'
    ]);
  });

  // ─── G2 ────────────────────────────────────────────────────────────
  test('G2: 동일 tenantId/year/month onMonthChange 재호출 → 추가 API 호출 없음 (캐시 hit)', async() => {
    setupApiResponses({
      missingLogs: buildMissingLogsResponse([
        { consultantId: 3, consultantName: '이혁진', missingDates: ['2026-06-15'] }
      ])
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(missingLogsCallCount()).toBe(1));
    expect(typeof mockUnifiedScheduleProps.onMonthChange).toBe('function');

    await act(async() => {
      mockUnifiedScheduleProps.onMonthChange({
        start: new Date('2026-05-31T00:00:00.000Z'),
        end: new Date('2026-07-12T00:00:00.000Z'),
        activeStart: new Date('2026-06-01T00:00:00.000Z'),
        view: 'dayGridMonth'
      });
    });

    await Promise.resolve();
    expect(missingLogsCallCount()).toBe(1);
  });

  // ─── G3 ────────────────────────────────────────────────────────────
  test('G3: currentMonth 변경 → 새 API 호출 (activeStart 우선 SSOT)', async() => {
    setupApiResponses({
      missingLogs: buildMissingLogsResponse([])
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(missingLogsCallCount()).toBe(1));

    // 7월로 이동 — activeStart=2026-07-01 이 SSOT 이므로 month=7.
    await act(async() => {
      mockUnifiedScheduleProps.onMonthChange({
        start: new Date('2026-06-28T00:00:00.000Z'),
        end: new Date('2026-08-09T00:00:00.000Z'),
        activeStart: new Date('2026-07-01T00:00:00.000Z'),
        view: 'dayGridMonth'
      });
    });

    await waitFor(() => expect(missingLogsCallCount()).toBe(2));
    expect(lastMissingLogsCallParams()).toEqual({ year: 2026, month: 7 });
  });

  // ─── G4 ────────────────────────────────────────────────────────────
  test('G4: user.tenantId 변경 → 캐시 리셋 → 동일 year/month 라도 재호출', async() => {
    setupApiResponses({
      missingLogs: buildMissingLogsResponse([])
    });

    let view;
    await act(async() => {
      view = render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(missingLogsCallCount()).toBe(1));

    useSession.mockImplementation(() => ({
      user: { id: 1, name: 'Admin', role: 'ADMIN', tenantId: 'tenant-B' }
    }));
    await act(async() => {
      view.rerender(<IntegratedMatchingSchedule />);
    });

    await waitFor(() => expect(missingLogsCallCount()).toBeGreaterThanOrEqual(2));
  });

  // ─── G5 ────────────────────────────────────────────────────────────
  test('G5: API 실패 → missingConsultationLogs null + 토스트 없음 (조용한 실패)', async() => {
    StandardizedApi.get.mockImplementation((endpoint) => {
      if (endpoint && endpoint.includes('/monthly-missing-consultation-logs')) {
        return Promise.reject(new Error('boom'));
      }
      if (endpoint && endpoint.includes('/monthly-consultant-counts')) {
        return Promise.resolve({ year: 2026, month: 6, counts: [] });
      }
      return Promise.resolve({ mappings: [] });
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => expect(missingLogsCallCount()).toBe(1));

    // 조용한 실패 — 토스트 미노출, 섹션 자체 미노출(null)
    expect(notificationManager.error).not.toHaveBeenCalled();
    expect(notificationManager.warning).not.toHaveBeenCalled();
    expect(notificationManager.info).not.toHaveBeenCalled();
    expect(mockUnifiedScheduleProps.missingConsultationLogs).toBeNull();
  });

  // ─── G6 ────────────────────────────────────────────────────────────
  test('G6: { success: true, data: { items: [...] } } 형태 응답도 정상 unwrap', async() => {
    setupApiResponses({
      missingLogs: buildMissingLogsResponse(
        [
          { consultantId: 3, consultantName: '이혁진', missingDates: ['2026-06-15'] }
        ],
        { wrap: true }
      )
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });
    await waitFor(() => {
      expect(Array.isArray(mockUnifiedScheduleProps.missingConsultationLogs)).toBe(true);
      expect(mockUnifiedScheduleProps.missingConsultationLogs).toHaveLength(1);
    });
    expect(mockUnifiedScheduleProps.missingConsultationLogs[0].consultantId).toBe(3);
    expect(mockUnifiedScheduleProps.missingConsultationLogs[0].missingDates).toEqual(['2026-06-15']);
  });
});
