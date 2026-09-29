/**
 * IntegratedMatchingSchedule — 신규 배정·오늘 처리 배정은 mappings GetAll.
 *
 * page size 20 단일 조회(adminMappingsListGet)로 목록을 끝내지 않는다.
 * total 21 이상이면 사이드바 건수도 21 이상이고, 기간이 지난 과거 건은 기존 필터로 빠진다.
 *
 * @author CoreSolution
 * @since 2026-09-23
 */

import React from 'react';
import { render, act, waitFor, cleanup } from '@testing-library/react';

const MONTHLY_COUNTS_PATH = '/api/v1/schedules/monthly-consultant-counts';
const MONTHLY_MISSING_PATH = '/api/v1/schedules/monthly-missing-consultation-logs';

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
  toDisplayString: (v) => (v == null ? '' : String(v)),
  toSafeNumber: (v, fallback = 0) => {
    if (v == null || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  },
  toErrorMessage: (err, fallback = '') => (
    err && err.message ? String(err.message) : fallback
  )
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

jest.mock('../../../schedule/UnifiedScheduleComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-schedule" />
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

jest.mock('../../../../api/adminListFetch', () => ({
  __esModule: true,
  adminMappingsListGet: jest.fn(),
  adminMappingsListGetAll: jest.fn(),
  adminSchedulesListGetAll: jest.fn(),
  adminClientsWithMappingGetAll: jest.fn()
}));

import IntegratedMatchingSchedule from '../IntegratedMatchingSchedule';
import StandardizedApi from '../../../../utils/standardizedApi';
import { useSession } from '../../../../contexts/SessionContext';
import {
  adminMappingsListGet,
  adminMappingsListGetAll,
  adminSchedulesListGetAll,
  adminClientsWithMappingGetAll
} from '../../../../api/adminListFetch';

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

let idleHandleSeq = 0;
let callOrder = [];

const pushOrder = (label) => {
  callOrder.push(label);
};

const endpointLabel = (endpoint) => {
  const path = String(endpoint || '');
  if (path.includes('/monthly-consultant-counts')) {
    return 'monthly-consultant-counts';
  }
  if (path.includes('/monthly-missing-consultation-logs')) {
    return 'monthly-missing-consultation-logs';
  }
  if (path.includes('/pending-payment-dirty')) {
    return 'pending-payment-dirty';
  }
  if (path.includes('/pending-payment')) {
    return 'pending-payment';
  }
  if (path.includes('/mappings/stats')) {
    return 'mappings-stats';
  }
  if (path.includes('/session-extensions')) {
    return 'session-extensions-pending';
  }
  return `api:${path}`;
};

beforeAll(() => {
  global.Date = FixedDate;
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  callOrder = [];
  idleHandleSeq = 0;

  window.requestIdleCallback = jest.fn(() => {
    idleHandleSeq += 1;
    return idleHandleSeq;
  });
  window.cancelIdleCallback = jest.fn();

  StandardizedApi.get.mockReset();
  StandardizedApi.post.mockReset();
  StandardizedApi.post.mockResolvedValue({});

  StandardizedApi.get.mockImplementation((endpoint) => {
    pushOrder(endpointLabel(endpoint));
    if (endpoint && String(endpoint).includes('/monthly-consultant-counts')) {
      return Promise.resolve({ year: 2026, month: 6, counts: [] });
    }
    if (endpoint && String(endpoint).includes('/monthly-missing-consultation-logs')) {
      return Promise.resolve({ year: 2026, month: 6, items: [] });
    }
    if (endpoint && String(endpoint).includes('/mappings/stats')) {
      return Promise.resolve({ totalMappings: 0, activeMappings: 0 });
    }
    return Promise.resolve({ mappings: [], content: [], items: [] });
  });

  adminMappingsListGet.mockReset();
  adminMappingsListGetAll.mockReset();
  adminSchedulesListGetAll.mockReset();
  adminClientsWithMappingGetAll.mockReset();

  adminMappingsListGet.mockImplementation(() => {
    pushOrder('adminMappingsListGet');
    return Promise.resolve({ mappings: [] });
  });
  adminMappingsListGetAll.mockImplementation(() => {
    pushOrder('adminMappingsListGetAll');
    return Promise.resolve({ mappings: [] });
  });
  adminSchedulesListGetAll.mockImplementation(() => {
    pushOrder('adminSchedulesListGetAll');
    return Promise.resolve({ schedules: [] });
  });
  adminClientsWithMappingGetAll.mockImplementation(() => {
    pushOrder('adminClientsWithMappingGetAll');
    return Promise.resolve({ clients: [] });
  });

  useSession.mockImplementation(() => ({
    user: { id: 1, name: 'Admin', role: 'ADMIN', tenantId: 'tenant-A' }
  }));
});

afterEach(() => {
  cleanup();
});

const buildCurrentMapping = (id) => ({
  id,
  clientId: id,
  clientName: `현재${id}`,
  consultantName: '상담사',
  status: 'ACTIVE',
  remainingSessions: 1,
  totalSessions: 8,
  createdAt: FIXED_DATE_ISO
});

describe('IntegratedMatchingSchedule — assignment lists drain past page size 20', () => {
  test('loads mappings via GetAll and keeps 21 current rows, dropping a past row', async() => {
    const current = Array.from({ length: 21 }, (_, index) => buildCurrentMapping(index + 1));
    const past = {
      id: 900,
      clientId: 900,
      clientName: '과거건',
      consultantName: '상담사',
      status: 'TERMINATED',
      remainingSessions: 0,
      totalSessions: 8,
      createdAt: '2020-01-01T00:00:00.000Z'
    };
    adminMappingsListGetAll.mockImplementation(() => {
      pushOrder('adminMappingsListGetAll');
      return Promise.resolve({ mappings: [...current, past], count: 22 });
    });

    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });

    await waitFor(() => {
      expect(adminMappingsListGetAll).toHaveBeenCalledTimes(1);
    });
    expect(adminMappingsListGet).not.toHaveBeenCalled();
    expect(adminSchedulesListGetAll).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        StandardizedApi.get.mock.calls.some(
          (c) => c[0] && String(c[0]).includes(MONTHLY_COUNTS_PATH)
        )
      ).toBe(true);
      expect(
        StandardizedApi.get.mock.calls.some(
          (c) => c[0] && String(c[0]).includes(MONTHLY_MISSING_PATH)
        )
      ).toBe(true);
    });

    await waitFor(() => {
      const count = document.querySelector('.integrated-schedule__sidebar-count');
      expect(count).not.toBeNull();
      expect(Number(count.textContent)).toBeGreaterThanOrEqual(21);
    });
    expect(document.body.textContent).not.toContain('과거건');
    expect(document.querySelectorAll('[data-mapping-id]').length).toBeGreaterThanOrEqual(21);
  });
});
