/**
 * AdminDashboardV2 매칭 큐 — KPI count 는 with-mapping-info 첫 응답 count,
 * 대기열은 전용 로더(adminClientsWithMappingGetAll)의 전체 목록.
 *
 * @author CoreSolution
 * @since 2026-11-10
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('react-i18next', () => {
  const stableT = (key, fallbackOrOpts) => {
    if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
    if (fallbackOrOpts && typeof fallbackOrOpts === 'object' && fallbackOrOpts.defaultValue) {
      return fallbackOrOpts.defaultValue;
    }
    return key;
  };
  return {
    useTranslation: () => ({
      t: stableT,
      i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
    }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading }) => (
    <div data-testid="admin-common-layout" data-loading={String(loading)}>
      {children}
    </div>
  )
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn(), () => null]
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: { id: 1, role: 'ADMIN', name: 'Admin User' },
    isLoading: false,
    logout: jest.fn(),
    hasRole: () => true
  })
}));

jest.mock('../../../contexts/DarkModeContext', () => ({
  useDarkMode: () => ({
    mode: 'light',
    resolved: 'light',
    toggle: jest.fn()
  }),
  DARK_MODE_VALUES: { AUTO: 'auto', DARK: 'dark', LIGHT: 'light' }
}));

jest.mock('../../../hooks/useCumulativeConsultantCounts', () => ({
  __esModule: true,
  default: () => ({ counts: {} })
}));

jest.mock('../../../hooks/useMonthlyConsultantCounts', () => ({
  __esModule: true,
  default: () => ({ counts: {} })
}));

jest.mock('../../../hooks/useCumulativeMissingConsultationLogs', () => ({
  __esModule: true,
  default: () => ({ items: [] })
}));

jest.mock('../../../utils/permissionUtils', () => ({
  fetchUserPermissions: jest.fn(() => Promise.resolve([])),
  PermissionChecks: { canManageUsers: () => false }
}));

jest.mock('../../../utils/apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({ 'X-Tenant-Id': 'test-tenant' }))
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({
      data: { totalMappings: 0, activeMappings: 0 }
    })),
    post: jest.fn(() => Promise.resolve({}))
  }
}));

jest.mock('../../../api/adminListFetch', () => {
  const actual = jest.requireActual('../../../api/adminListFetch');
  return {
    ...actual,
    adminMappingsListGet: jest.fn(() => Promise.resolve({ mappings: [], count: 0 })),
    adminClientsWithMappingGetAll: jest.fn()
  };
});

jest.mock('../../admin/AdminDashboard/molecules/KpiFlipCard', () => ({
  __esModule: true,
  default: ({ label }) => <div data-testid="kpi-flip-card">{label}</div>
}));

jest.mock('../../admin/AdminDashboard/index', () => {
  const actual = jest.requireActual('../../admin/AdminDashboard/index');
  return {
    ...actual,
    AdminMetricsVisualization: () => null,
    DepositPendingList: () => null,
    SchedulePendingList: () => null
  };
});

jest.mock('../../common/Chart', () => () => null);
jest.mock('../molecules/CumulativeConsultantCountsChart', () => () => null);
jest.mock('../molecules/SessionBurnRateSection', () => () => null);
jest.mock('../../ui/Schedule/ConsultantCountsBadgeList', () => () => null);
jest.mock('../../ui/Schedule/MissingConsultationLogsList', () => () => null);
jest.mock('../../admin/AdminDashboard/AdminDashboardMonitoring', () => () => null);
jest.mock('../../consultant/SpecialtyManagementModal', () => () => null);
jest.mock('../../statistics/PerformanceMetricsModal', () => () => null);
jest.mock('../../finance/RecurringExpenseModal', () => () => null);
jest.mock('../../erp/ErpReportModal', () => () => null);
jest.mock('../../admin/mapping/MappingDepositModal', () => () => null);
jest.mock('../molecules/AdminMgmtGridCard', () => ({
  AdminMgmtNavCard: () => null,
  AdminMgmtActionCard: () => null
}));
jest.mock('../../ui/Card/StatCard', () => () => null);
jest.mock('../../common/SegmentedTabs', () => () => null);
jest.mock('../../common/MGButton', () => ({ children, ...rest }) => (
  <button type="button" {...rest}>{children}</button>
));
jest.mock('../../common/modals/UnifiedModal', () => () => null);
jest.mock('../../ui/Icon/Icon', () => () => null);
jest.mock('../../../utils/csrfTokenManager', () => ({
  __esModule: true,
  default: { post: jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) }
}));
jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    setUser: jest.fn(),
    checkSession: jest.fn()
  }
}));
jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() }
}));

const {
  adminClientsWithMappingGetAll,
  adminMappingsListGet
} = require('../../../api/adminListFetch');

const AdminDashboardV2 = require('../AdminDashboardV2').default;

const KPI_TOTAL_CLIENTS = 80;
const FIRST_PAGE_CLIENT_COUNT = 20;
const ELIGIBLE_COUNT = 21;
const BEYOND_PAGE_NAME = '페이지밖미배정';
const INELIGIBLE_NAME = '배정제외대상';

const jsonOk = (data = {}) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data)
});

function buildAssignedClients(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `assigned-${index + 1}`,
    name: `첫페이지내담자${index + 1}`,
    email: `assigned-${index + 1}@example.com`,
    mappingCount: 1,
    isActive: true
  }));
}

function buildEligibleClients(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `eligible-${index + 1}`,
    name: index === 0 ? BEYOND_PAGE_NAME : `미배정내담자${index + 1}`,
    email: `eligible-${index + 1}@example.com`,
    mappingCount: 0,
    isActive: true
  }));
}

describe('AdminDashboardV2 matching queue full list', () => {
  beforeEach(() => {
    const assigned = buildAssignedClients(FIRST_PAGE_CLIENT_COUNT);
    expect(assigned.some((client) => client.name === BEYOND_PAGE_NAME)).toBe(false);
    global.fetch = jest.fn((url) => {
      const href = String(url);
      if (href.includes('with-mapping-info')) {
        return Promise.resolve(jsonOk({
          count: KPI_TOTAL_CLIENTS,
          clients: assigned
        }));
      }
      return Promise.resolve(jsonOk({ success: true, data: {} }));
    });
    adminMappingsListGet.mockReset();
    adminMappingsListGet.mockResolvedValue({ mappings: [], count: 0 });
    adminClientsWithMappingGetAll.mockReset();
    const eligible = buildEligibleClients(ELIGIBLE_COUNT);
    adminClientsWithMappingGetAll.mockResolvedValue({
      clients: [
        eligible[0],
        {
          id: 'ineligible-1',
          name: INELIGIBLE_NAME,
          email: 'ineligible@example.com',
          mappingCount: 1,
          isActive: true
        },
        ...eligible.slice(1)
      ],
      count: ELIGIBLE_COUNT + 1
    });
  });

  test('매칭 큐는 첫 페이지가 아닌 전체 미배정 목록이고 KPI는 count다', async() => {
    render(
      <MemoryRouter>
        <AdminDashboardV2 />
      </MemoryRouter>
    );

    expect(await screen.findByText(BEYOND_PAGE_NAME)).toBeInTheDocument();
    expect(screen.queryByText(INELIGIBLE_NAME)).not.toBeInTheDocument();
    expect(document.querySelector('.manual-matching-queue__count')).toHaveTextContent('21건');

    const kpi = await screen.findByTestId('viz-total-clients-kpi');
    await waitFor(() => {
      const plaintext = kpi.querySelector('.mg-v2-kpi-numeral__plaintext');
      expect(plaintext).not.toBeNull();
      expect(plaintext.textContent).toBe(String(KPI_TOTAL_CLIENTS));
    });
    const plaintext = kpi.querySelector('.mg-v2-kpi-numeral__plaintext');
    expect(plaintext.textContent).not.toBe(String(ELIGIBLE_COUNT));
    expect(plaintext.textContent).not.toBe(String(FIRST_PAGE_CLIENT_COUNT));
    expect(adminClientsWithMappingGetAll).toHaveBeenCalled();
  });
});
