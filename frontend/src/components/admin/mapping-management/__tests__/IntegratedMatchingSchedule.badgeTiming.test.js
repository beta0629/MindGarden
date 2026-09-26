/**
 * IntegratedMatchingSchedule — badge hook fetch vs mappings GetAll idle order.
 *
 * Measures call order on mount:
 *  1. First paint: monthly-consultant-counts + monthly-missing-consultation-logs fire
 *  2. adminMappingsListGetAll stays idle-deferred (not yet called)
 *  3. After flushing requestIdleCallback: GetAll runs once
 *  4. Call-order log: badge endpoints appear before GetAll
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

/** Captured idle callbacks — flush manually to assert GetAll deferral. */
const idleCallbacks = [];
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

const flushIdleCallbacks = async() => {
  const pending = idleCallbacks.splice(0, idleCallbacks.length);
  for (const cb of pending) {
    // eslint-disable-next-line no-await-in-loop
    await act(async() => {
      cb({ didTimeout: false, timeRemaining: () => 50 });
      await Promise.resolve();
    });
  }
};

beforeAll(() => {
  global.Date = FixedDate;
});

afterAll(() => {
  global.Date = RealDate;
});

beforeEach(() => {
  callOrder = [];
  idleCallbacks.length = 0;
  idleHandleSeq = 0;

  window.requestIdleCallback = jest.fn((cb) => {
    idleCallbacks.push(cb);
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

describe('IntegratedMatchingSchedule — badge fetch vs mappings GetAll idle order', () => {
  test('badge endpoints fire on first paint; GetAll waits until idle flush', async() => {
    await act(async() => {
      render(<IntegratedMatchingSchedule />);
    });

    // 1) Badge hooks request on / shortly after mount (not gated on GetAll)
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

    // First-paint mappings page Get should resolve; GetAll still idle-deferred
    await waitFor(() => {
      expect(adminMappingsListGet).toHaveBeenCalled();
      expect(adminSchedulesListGetAll).toHaveBeenCalled();
    });

    // client-filter idle + post-Promise.all GetAll idle (≥2)
    await waitFor(() => {
      expect(idleCallbacks.length).toBeGreaterThanOrEqual(2);
    });

    // 2) GetAll not called yet — still waiting for idle flush
    expect(adminMappingsListGetAll).not.toHaveBeenCalled();
    expect(callOrder).not.toContain('adminMappingsListGetAll');

    const badgeCountIdx = callOrder.indexOf('monthly-consultant-counts');
    const badgeMissingIdx = callOrder.indexOf('monthly-missing-consultation-logs');
    expect(badgeCountIdx).toBeGreaterThan(-1);
    expect(badgeMissingIdx).toBeGreaterThan(-1);

    // 3) Flush requestIdleCallback → GetAll once
    await flushIdleCallbacks();

    await waitFor(() => {
      expect(adminMappingsListGetAll).toHaveBeenCalledTimes(1);
    });

    // 4) Call-order evidence: badge endpoints before GetAll
    const getAllIdx = callOrder.indexOf('adminMappingsListGetAll');
    expect(getAllIdx).toBeGreaterThan(-1);
    expect(Math.min(badgeCountIdx, badgeMissingIdx)).toBeLessThan(getAllIdx);
    expect(Math.max(badgeCountIdx, badgeMissingIdx)).toBeLessThan(getAllIdx);
  });
});
