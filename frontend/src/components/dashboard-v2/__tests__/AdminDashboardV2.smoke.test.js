/**
 * AdminDashboardV2 — AdminCommonLayout 스모크 테스트 (G-14 Pilot 1).
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('react-i18next', () => {
  const stableT = (key, fallbackOrOpts) => {
    if (typeof fallbackOrOpts === 'string') return fallbackOrOpts;
    if (fallbackOrOpts && typeof fallbackOrOpts === 'object' && fallbackOrOpts.defaultValue) {
      return fallbackOrOpts.defaultValue;
    }
    if (key === 'admin:dashboard.v2.title') return '대시보드';
    if (key === 'admin:dashboard.subtitle') return '운영 현황을 한눈에 확인하세요';
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
  default: ({ children, title, loading }) => (
    <div data-testid="admin-common-layout" data-title={title} data-loading={String(loading)}>
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

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ clients: [], consultants: [], mappings: [] })),
    post: jest.fn(() => Promise.resolve({}))
  }
}));

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

const jsonOk = (data = {}) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data)
});

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve(jsonOk({ success: true, data: {} })));
});

import { MemoryRouter } from 'react-router-dom';
import AdminDashboardV2 from '../AdminDashboardV2';

const renderDashboard = () => render(
  <MemoryRouter>
    <AdminDashboardV2 />
  </MemoryRouter>
);

describe('AdminDashboardV2 AdminCommonLayout 스모크', () => {
  test('mount 시 ContentHeader title 및 본문 data-testid 렌더 (ACL title dedup)', async() => {
    renderDashboard();

    expect(screen.getByTestId('admin-common-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-common-layout')).not.toHaveAttribute('data-title', '대시보드');
    expect(screen.getByRole('heading', { level: 1, name: '대시보드' })).toBeInTheDocument();
    expect(screen.getByTestId('admin-dashboard-v2-page')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    });
  });

  test('KPI zone 3종 카드가 로드 후 렌더', async() => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByTestId('kpi-flip-card')).toHaveLength(3);
    });
  });
});
