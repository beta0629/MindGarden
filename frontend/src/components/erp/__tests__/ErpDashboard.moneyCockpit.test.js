/**
 * ErpDashboard 머니 콕핏 — hero / 차트 / 금지 요소 / won·0원 스모크
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  OFD_CHART,
  OFD_HERO,
  OFD_PAGE_TITLE,
  OFD_WORKBENCH
} from '../../../constants/operatorFinanceDashboardStrings';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children, ariaLabel }) => (
    <div data-testid="content-area" data-aria-label={ariaLabel}>
      {children}
    </div>
  ),
  ContentHeader: ({ title }) => <header data-testid="content-header">{title}</header>,
  ContentKpiRow: ({ items }) => (
    <div data-testid="content-kpi-row">
      {(items || []).map((item) => (
        <span key={item.id}>{item.label}</span>
      ))}
    </div>
  )
}));

jest.mock('../../common/MGChart', () => ({
  __esModule: true,
  default: function MockMGChart({ data }) {
    return (
      <div
        data-testid="mock-mg-chart"
        data-labels={data?.labels?.join(',')}
      />
    );
  }
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="unified-loading">{text}</div>
}));

jest.mock('../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options, value, onChange, 'aria-label': ariaLabel }) => (
    <div data-testid="badge-select" aria-label={ariaLabel} data-value={value}>
      {(options || []).map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}));

jest.mock('../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title }) => <div data-testid="empty-state">{title}</div>
}));

jest.mock('../../dashboard-v2/atoms/KpiNumeral', () => ({
  __esModule: true,
  default: ({ value, unit }) => (
    <span data-testid="kpi-numeral" data-unit={unit || ''}>
      {`${value}${unit || ''}`}
    </span>
  )
}));

jest.mock('../shell/ErpPageShell', () => ({
  __esModule: true,
  default: ({ children, mainAriaLabel }) => (
    <div data-testid="erp-page-shell" aria-label={mainAriaLabel}>
      {children}
    </div>
  )
}));

const mockHasPermission = jest.fn(async() => true);
const mockSessionUser = { id: 1, name: '운영자', role: 'ADMIN', tenantId: 't1' };

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: mockSessionUser,
    isLoggedIn: true,
    isLoading: false,
    hasPermission: mockHasPermission
  })
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: () => mockSessionUser,
    getSessionInfo: () => ({ tenantId: 't1' }),
    isLoggedIn: () => true
  }
}));

jest.mock('../../../utils/permissionUtils', () => ({
  fetchUserPermissions: jest.fn(async(setter) => {
    const perms = ['ERP_ACCESS', 'ERP_DASHBOARD_VIEW', 'INTEGRATED_FINANCE_VIEW'];
    if (typeof setter === 'function') setter(perms);
    return perms;
  }),
  PermissionChecks: {
    canAccessERP: () => true,
    canViewIntegratedFinance: () => true
  },
  PERMISSIONS: {
    ERP_ACCESS: 'ERP_ACCESS',
    ERP_DASHBOARD_VIEW: 'ERP_DASHBOARD_VIEW',
    INTEGRATED_FINANCE_VIEW: 'INTEGRATED_FINANCE_VIEW',
    SALARY_MANAGE: 'SALARY_MANAGE'
  }
}));

jest.mock('../../../constants/roles', () => ({
  RoleUtils: {
    isAdmin: () => true
  }
}));

const mockGet = jest.fn();

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockGet(...args),
    post: jest.fn()
  }
}));

import ErpDashboard from '../ErpDashboard';

describe('ErpDashboard money cockpit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation((url) => {
      const path = String(url);
      if (
        path.includes('/auth/')
        || path.includes('current-user')
        || /\/me(?:\?|$)/.test(path)
      ) {
        return Promise.resolve({ id: 1, role: 'ADMIN', tenantId: 't1' });
      }
      if (path.includes('/finance/dashboard')) {
        return Promise.resolve({
          financialData: {
            summary: {
              totalRevenue: 1000000,
              totalExpenses: 400000,
              netProfit: 600000
            },
            transactions: [
              {
                id: 1,
                date: '2026-08-01',
                type: 'INCOME',
                category: 'CONSULTATION',
                description: '상담료',
                amount: 500000,
                relatedEntityType: 'CONSULTANT_CLIENT_MAPPING'
              },
              {
                id: 2,
                date: '2026-08-02',
                type: 'EXPENSE',
                category: 'SALARY',
                description: '급여',
                amount: 200000
              }
            ],
            categoryBreakdown: {
              CONSULTATION: 1000000,
              SALARY: 200000,
              RENT: 100000
            }
          }
        });
      }
      if (path.includes('/finance/monthly-report')) {
        return Promise.resolve({
          monthlyIncome: { total: 100000 },
          monthlyExpenses: { total: 50000 }
        });
      }
      if (path.includes('pending-payment')) {
        return Promise.resolve([]);
      }
      if (path.includes('salary/calculations/period')) {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    });
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ErpDashboard />
      </MemoryRouter>
    );

  test('hero band에 들어온 돈·나간 돈·남은 돈이 있다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-hero-band')).toBeInTheDocument();
    });

    expect(screen.getByText('들어온 돈')).toBeInTheDocument();
    expect(screen.getByText('나간 돈')).toBeInTheDocument();
    expect(screen.getByText('남은 돈')).toBeInTheDocument();
    expect(screen.getByText(OFD_HERO.INCOME_LABEL)).toBeInTheDocument();
    expect(screen.getByText(OFD_HERO.EXPENSE_LABEL)).toBeInTheDocument();
    expect(screen.getByText(OFD_HERO.REMAINING_LABEL)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: OFD_PAGE_TITLE })).toBeInTheDocument();
  });

  test('hero·ledger 금액이 1,000,000원 형식이면 raw 1000000은 없다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-hero-band')).toBeInTheDocument();
    });

    await waitFor(() => {
      const numerals = screen.getAllByTestId('kpi-numeral');
      expect(numerals.some((el) => el.textContent === '1,000,000원')).toBe(true);
    });

    const hero = screen.getByTestId('money-hero-band');
    expect(within(hero).queryByText(/^1000000$/)).not.toBeInTheDocument();
    expect(within(hero).queryByText(/1000000원/)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('money-ledger-strip')).toBeInTheDocument();
    });
    const ledger = screen.getByTestId('money-ledger-strip');
    expect(within(ledger).getByText('500,000원')).toBeInTheDocument();
    expect(within(ledger).getByText('200,000원')).toBeInTheDocument();
    expect(ledger.textContent).not.toMatch(/(?<![,\d])1000000(?![,\d])/);
  });

  test('hero KpiNumeral unit은 원이며 KPI unit 건이 없다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-hero-band')).toBeInTheDocument();
    });

    await waitFor(() => {
      const numerals = screen.getAllByTestId('kpi-numeral');
      expect(numerals.length).toBeGreaterThan(0);
      numerals.forEach((el) => {
        expect(el).toHaveAttribute('data-unit', '원');
      });
    });

    const cockpit = screen.getByTestId('money-cockpit');
    const kpiWithGeon = within(cockpit)
      .queryAllByTestId('kpi-numeral')
      .filter((el) => el.getAttribute('data-unit') === '건');
    expect(kpiWithGeon).toHaveLength(0);
  });

  test('hollow captions(상담료 위주·급여·임대·지난달 대비)가 없다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-hero-band')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('상담료 위주')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('급여·임대')).not.toBeInTheDocument();
    expect(screen.queryByText('지난달 대비')).not.toBeInTheDocument();
  });

  test('fetch 성공 시 todo 3행이 0원으로 보인다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(OFD_WORKBENCH.PENDING_CONSULTATION)).toBeInTheDocument();
    });
    expect(screen.getByText(OFD_WORKBENCH.PENDING_SALARY)).toBeInTheDocument();
    expect(screen.getByText(OFD_WORKBENCH.REFUND)).toBeInTheDocument();

    const todo = screen.getByTestId('money-todo-list');
    const zeroAmounts = within(todo).getAllByText('0원');
    expect(zeroAmounts.length).toBeGreaterThanOrEqual(3);
  });

  test('수입 믹스·지출 믹스가 있다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-income-mix')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByTestId('money-outflow-mix')).toBeInTheDocument();
    });

    expect(screen.getByText(OFD_WORKBENCH.INCOME_MIX_TITLE)).toBeInTheDocument();
    expect(screen.getByText(OFD_WORKBENCH.EXPENSE_MIX_TITLE)).toBeInTheDocument();
    expect(within(screen.getByTestId('money-income-mix')).getByText('상담료')).toBeInTheDocument();
    expect(within(screen.getByTestId('money-outflow-mix')).getByText('급여')).toBeInTheDocument();
  });

  test('조달 KPI(총 아이템/승인 대기/총 주문/예산 사용률)가 없다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-cockpit')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('content-kpi-row')).not.toBeInTheDocument();
    expect(screen.queryByText(/총 아이템/)).not.toBeInTheDocument();
    expect(screen.queryByText(/승인 대기/)).not.toBeInTheDocument();
    expect(screen.queryByText(/총 주문/)).not.toBeInTheDocument();
    expect(screen.queryByText('예산 사용률')).not.toBeInTheDocument();
  });

  test('12개월 차트 또는 empty 문구가 있다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-flow-stage')).toBeInTheDocument();
    });

    await waitFor(() => {
      const chart = screen.queryByTestId('mock-mg-chart');
      const empty = screen.queryByText('최근 12개월에 등록된 수입·지출이 없습니다.');
      const emptyConst = screen.queryByText(OFD_CHART.EMPTY);
      expect(chart || empty || emptyConst).toBeTruthy();
    });
  });

  test('sync card·순이익 히어로 라벨이 없다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-hero-band')).toBeInTheDocument();
    });

    expect(screen.queryByText('분개 초기화')).not.toBeInTheDocument();
    expect(screen.queryByText('백필')).not.toBeInTheDocument();
    expect(screen.queryByText(/ErpFinanceAdminSyncCard/i)).not.toBeInTheDocument();
    expect(screen.queryByText('순이익')).not.toBeInTheDocument();
    expect(screen.queryByText('데이터 새로고침')).not.toBeInTheDocument();
  });

  test('레거시 툴바·퀵액션·터넌트 서브타이틀이 없다', async() => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('money-cockpit')).toBeInTheDocument();
    });

    expect(screen.queryByText('데이터 새로고침')).not.toBeInTheDocument();
    expect(document.querySelector('.erp-filter-toolbar')).toBeNull();
    expect(document.querySelector('.mg-v2-ad-b0kla__admin-card')).toBeNull();
    expect(screen.queryByText('조달')).not.toBeInTheDocument();
    expect(screen.queryByText('품목')).not.toBeInTheDocument();
    expect(screen.queryByText('거래·정산')).not.toBeInTheDocument();
    expect(screen.queryByText('승인센터')).not.toBeInTheDocument();
    expect(screen.queryByText(/\(터넌트:/)).not.toBeInTheDocument();
  });
});
