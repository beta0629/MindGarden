/**
 * AdminDashboardV2 회기 소진율 — loadStats가 mappings 첫 페이지(adminMappingsListGet, size 상한) 목록을 집계에 넣는다.
 * 대시보드는 전체 drain(adminMappingsListGetAll) 금지.
 * mappings/stats 건수 KPI는 유지. page size로 목록을 자르지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-28
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import {
  ADMIN_DASHBOARD_LIST_PAGE_SIZE,
  MAPPING_STATUS_ACTIVE
} from '../../../constants/adminDashboardWidgetConstants';

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
    adminMappingsListGetAll: jest.fn(() => Promise.resolve({ mappings: [], count: 0 }))
  };
});

jest.mock('../../admin/AdminDashboard/molecules/KpiFlipCard', () => ({
  __esModule: true,
  default: ({ label }) => <div data-testid="kpi-flip-card">{label}</div>
}));

jest.mock('../../admin/AdminDashboard/index', () => ({
  AdminMetricsVisualization: () => <div data-testid="admin-metrics-viz" />,
  ManualMatchingQueue: () => null,
  DepositPendingList: () => null,
  SchedulePendingList: () => null
}));

jest.mock('../../common/Chart', () => () => null);
jest.mock('../molecules/CumulativeConsultantCountsChart', () => () => null);
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

const fs = require('fs');
const path = require('path');

const {
  adminMappingsListGet,
  adminMappingsListGetAll,
  ADMIN_LIST_DRAIN_PAGE_SIZE
} = require('../../../api/adminListFetch');

const FIRST_PAGE_QUERY = { page: 0, size: ADMIN_LIST_DRAIN_PAGE_SIZE };
const AdminDashboardV2 = require('../AdminDashboardV2').default;

const SESSION_BURN_EMPTY = '활성 배정의 회기 소진 데이터가 없습니다';

const jsonOk = (data = {}) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data)
});

function buildActiveMapping(consultantId, usedSessions) {
  return {
    status: MAPPING_STATUS_ACTIVE,
    consultantId,
    consultantName: `상담사${consultantId}`,
    usedSessions,
    totalSessions: usedSessions + 10,
    remainingSessions: 10
  };
}

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AdminDashboardV2 />
    </MemoryRouter>
  );
}

async function sessionBurnSection() {
  return waitFor(() => screen.getByRole('region', {
    name: '회기 소진율, 순위는 사용 회기 합산 기준'
  }));
}

describe('AdminDashboardV2 session burn mappings', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve(jsonOk({ success: true, data: {} })));
    adminMappingsListGet.mockReset();
    adminMappingsListGet.mockResolvedValue({ mappings: [], count: 0 });
    adminMappingsListGetAll.mockReset();
  });

  test('loadStats는 빈 배열을 고정하지 않고 mappings 첫 페이지만 호출한다 (전체 drain 금지)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'AdminDashboardV2.js'),
      'utf8'
    );
    const loadStatsMatch = src.match(
      /const loadStats = useCallback\(async\(options = \{\}\) => \{[\s\S]*?\}, \[showToast\]\);/
    );
    expect(loadStatsMatch).not.toBeNull();
    const loadStatsSrc = loadStatsMatch[0];
    expect(loadStatsSrc).toMatch(/adminMappingsListGet\(ADMIN_DASHBOARD_SESSION_BURN_MAPPINGS_QUERY\)/);
    expect(loadStatsSrc).not.toMatch(/GetAll\(/);
    expect(loadStatsSrc).not.toMatch(/size:\s*total/);
    expect(loadStatsSrc).toMatch(/resolveSessionBurnMappingList\(mappingsListPayload\)/);
    expect(loadStatsSrc).toMatch(/API_ENDPOINTS\.ADMIN\.MAPPINGS\.STATS/);
    expect(loadStatsSrc).not.toMatch(/setMappingsListForSessionBurn\(\s*\[\s*\]\s*\)/);
    expect(loadStatsSrc).not.toMatch(/ADMIN_DASHBOARD_LIST_PAGE_SIZE/);
    expect(loadStatsSrc).not.toMatch(/\.slice\(\s*0\s*,/);
  });

  test('배정이 없으면 빈 문구만 보인다', async() => {
    adminMappingsListGet.mockResolvedValue({ mappings: [], count: 0 });
    renderDashboard();

    const section = await sessionBurnSection();
    expect(within(section).getByText(SESSION_BURN_EMPTY)).toBeInTheDocument();
    expect(adminMappingsListGet).toHaveBeenCalledWith(FIRST_PAGE_QUERY);
    expect(adminMappingsListGetAll).not.toHaveBeenCalled();
  });

  test('활성 배정이 있으면 소진률 행이 1건 이상이고 빈 문구는 없다', async() => {
    adminMappingsListGet.mockResolvedValue({
      mappings: [buildActiveMapping(1, 4)],
      count: 1
    });
    renderDashboard();

    const section = await sessionBurnSection();
    await waitFor(() => {
      expect(within(section).getByText('상담사1')).toBeInTheDocument();
    });
    expect(within(section).queryByText(SESSION_BURN_EMPTY)).not.toBeInTheDocument();
    expect(within(section).getByText('1위')).toBeInTheDocument();
  });

  test('page size보다 많은 배정도 사용 회기가 가장 큰 상담사가 1위다', async() => {
    const count = ADMIN_DASHBOARD_LIST_PAGE_SIZE + 1;
    const mappings = [];
    for (let id = 1; id <= count; id += 1) {
      mappings.push(buildActiveMapping(id, id));
    }
    adminMappingsListGet.mockResolvedValue({ mappings, count });
    renderDashboard();

    const section = await sessionBurnSection();
    await waitFor(() => {
      expect(within(section).getByText(`상담사${count}`)).toBeInTheDocument();
    });
    const names = within(section).getAllByText(/^상담사\d+$/);
    expect(names[0]).toHaveTextContent(`상담사${count}`);
    expect(within(section).queryByText(SESSION_BURN_EMPTY)).not.toBeInTheDocument();
    expect(adminMappingsListGet).toHaveBeenCalledWith(FIRST_PAGE_QUERY);
    expect(adminMappingsListGetAll).not.toHaveBeenCalled();
  });
});
