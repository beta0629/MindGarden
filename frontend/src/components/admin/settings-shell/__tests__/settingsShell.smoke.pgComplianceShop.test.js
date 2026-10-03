/**
 * 설정 공통 셸 스모크 — 결제 연결 목록·상세 · 패키지 요금(상품) · 컴플라이언스 메뉴·대시보드
 * 실제 페이지를 렌더해 SettingsPageShell / SettingsSectionPanel 계약을 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key, defOrOpts) => (typeof defOrOpts === 'string' ? defOrOpts : key)
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../../utils/pgApi', () => ({
  __esModule: true,
  getPgConfigurations: jest.fn(),
  getPgConfigurationDetail: jest.fn(),
  deletePgConfiguration: jest.fn(),
  testPgConnection: jest.fn(),
  decryptPgKeys: jest.fn(),
  getPortOneClientConfig: jest.fn(),
  patchPgConfigurationWebhookSecret: jest.fn()
}));

jest.mock('../../../../utils/portonePayment', () => ({
  __esModule: true,
  requestPortOnePayment: jest.fn()
}));

jest.mock('../../../../services/adminShopProductService', () => ({
  __esModule: true,
  listAdminShopProducts: jest.fn(),
  setAdminShopProductHomePublic: jest.fn(),
  setAdminShopProductMallVisible: jest.fn(),
  setAdminShopProductSaleStatus: jest.fn()
}));

jest.mock('../../../compliance/useComplianceDashboardData', () => ({
  __esModule: true,
  API_ADMIN_COMPLIANCE_POLICY: '/api/v1/admin/compliance/policy',
  useComplianceDashboardData: jest.fn()
}));

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn(), show: jest.fn() },
  showNotification: jest.fn()
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading, loadingText }) => (
    <div data-testid="admin-layout">
      {loading ? <div role="status">{loadingText}</div> : children}
    </div>
  )
}));

jest.mock('../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, children, actions }) => (
    isOpen ? (
      <div role="dialog">
        {children}
        <div>{actions}</div>
      </div>
    ) : null
  )
}));

const mockSessionState = {
  user: { id: 'admin-1', role: 'ADMIN', tenantId: 'tenant-test' },
  isLoggedIn: true,
  isLoading: false
};
jest.mock('../../../../contexts/SessionContext', () => ({
  __esModule: true,
  useSession: () => mockSessionState
}));

/* eslint-disable import/first -- jest.mock 이후 import */
import StandardizedApi from '../../../../utils/standardizedApi';
import { getPgConfigurationDetail, getPgConfigurations } from '../../../../utils/pgApi';
import { listAdminShopProducts } from '../../../../services/adminShopProductService';
import { useComplianceDashboardData } from '../../../compliance/useComplianceDashboardData';
import {
  ADMIN_SHOP_PG_COPY,
  ADMIN_SHOP_PRODUCTS_COPY,
  ADMIN_SHOP_SUITE_TEST_IDS
} from '../../../../constants/adminShopSuite';
import PgConfigurationList from '../../../tenant/PgConfigurationList';
import PgConfigurationDetail from '../../../tenant/PgConfigurationDetail';
import AdminShopProductsPage from '../../AdminShopProductsPage';
import ComplianceMenu from '../../../compliance/ComplianceMenu';
import ComplianceDashboard from '../../../compliance/ComplianceDashboard';
/* eslint-enable import/first */

const PG_CONFIG = {
  configId: 101,
  pgProvider: 'TOSS',
  pgName: '토스 결제',
  status: 'APPROVED',
  approvalStatus: 'APPROVED',
  testMode: false,
  history: [
    { id: 1, changeType: 'CREATED', changedAt: '2026-10-01T10:00:00', changedBy: 'admin', newStatus: 'PENDING' }
  ]
};

const renderAt = async(element, path = '/', routePath = '/') => {
  let result;
  await act(async() => {
    result = render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MemoryRouter>
    );
  });
  return result;
};

const expectSettingsShell = (container, title) => {
  const shell = container.querySelector('section.mg-v2-erp-shell.mg-v2-settings-shell');
  expect(shell).not.toBeNull();
  const h1 = shell.querySelector('h1');
  expect(h1).not.toBeNull();
  expect(h1).toHaveTextContent(title);
  expect(container.querySelector('.mg-v2-content-header')).toBeNull();
  expect(container.querySelector('[class*="mg-v2-ad-b0kla"]')).toBeNull();
  expect(container.querySelectorAll('.mg-v2-settings-panel').length).toBeGreaterThan(0);
  return shell;
};

describe('설정 공통 셸 스모크 — 결제 연결 · 상품 · 컴플라이언스', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getPgConfigurations.mockResolvedValue([PG_CONFIG]);
    getPgConfigurationDetail.mockResolvedValue(PG_CONFIG);
    listAdminShopProducts.mockResolvedValue({ products: [], totalElements: 0, counts: {} });
    StandardizedApi.get.mockResolvedValue({ policyComponents: { basicInfo: {} } });
    useComplianceDashboardData.mockReturnValue({
      overallStatus: { overallScore: null, complianceLevel: null, lastUpdated: null },
      processingStatus: { totalCount: 0, dataTypeStats: {} },
      impactAssessment: null,
      breachResponse: null,
      educationStatus: null,
      policyStatus: null,
      destructionStatus: null,
      loading: false,
      error: null,
      loadComplianceData: jest.fn()
    });
  });

  it('결제 연결 목록: 셸 + 헤더 primary + 패널 + 입력 계약 클래스', async() => {
    const { container } = await renderAt(<PgConfigurationList />);
    await screen.findByText('토스 결제');
    const shell = expectSettingsShell(container, ADMIN_SHOP_PG_COPY.TITLE);
    const headerPrimary = shell.querySelector('.mg-v2-settings-header .mg-v2-settings-button');
    expect(headerPrimary).not.toBeNull();
    shell.querySelectorAll('input[type="text"]').forEach((el) => expect(el).toHaveClass('mg-v2-form-input'));
    expect(shell.querySelectorAll('select').length).toBe(2);
    shell.querySelectorAll('select').forEach((el) => expect(el).toHaveClass('mg-v2-select'));
    expect(shell.querySelector('[data-testid="pg-config-list-summary"]')).not.toBeNull();
  });

  it('결제 연결 상세: 셸 + 수정 primary 헤더 + 패널 · 열쇠 스트립 유지', async() => {
    const { container } = await renderAt(
      <PgConfigurationDetail />,
      '/tenant/pg-configurations/101',
      '/tenant/pg-configurations/:id'
    );
    await screen.findByTestId(ADMIN_SHOP_SUITE_TEST_IDS.PG_DETAIL);
    const shell = expectSettingsShell(container, ADMIN_SHOP_PG_COPY.TITLE);
    const edit = screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.PG_EDIT);
    expect(edit).toHaveClass('mg-v2-settings-button');
    expect(edit.closest('.mg-v2-settings-header')).not.toBeNull();
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.PG_KEYSTRIP)).toBeInTheDocument();
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.PG_HISTORY).closest('.mg-v2-settings-panel')).not.toBeNull();
    expect(shell.querySelector('.admin-shop-suite__card')).toBeNull();
  });

  it('패키지 요금(상품): 셸 + 등록 primary 헤더 + 툴바 패널 + 검색 입력 계약', async() => {
    const { container } = await renderAt(<AdminShopProductsPage />);
    await screen.findByTestId(ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_TABLE);
    const shell = expectSettingsShell(container, ADMIN_SHOP_PRODUCTS_COPY.TITLE);
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_PAGE)).toBeInTheDocument();
    const create = screen.getByRole('button', { name: ADMIN_SHOP_PRODUCTS_COPY.CREATE });
    expect(create).toHaveClass('mg-v2-settings-button');
    expect(create.closest('.mg-v2-settings-header')).not.toBeNull();
    expect(shell.querySelector('input[type="search"]')).toHaveClass('mg-v2-form-input');
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.PRODUCTS_TABLE).closest('.mg-v2-settings-panel')).not.toBeNull();
  });

  it('컴플라이언스 메뉴: 셸 + 하위 메뉴·안내 패널', async() => {
    const { container } = await renderAt(<ComplianceMenu />);
    const shell = expectSettingsShell(container, 'common:compliance.ComplianceMenu.t_77eda937');
    expect(shell.querySelectorAll('.mg-v2-settings-panel').length).toBe(4);
    expect(screen.getByTestId('compliance-menu-contact').closest('.mg-v2-settings-panel')).not.toBeNull();
  });

  it('컴플라이언스 대시보드: 셸 + 새로고침 헤더 버튼 + 카드 패널 (빈 값은 —)', async() => {
    const { container } = await renderAt(<ComplianceDashboard />);
    const shell = expectSettingsShell(container, '컴플라이언스 모니터링');
    const refresh = shell.querySelector('.mg-v2-settings-header .mg-v2-settings-button');
    expect(refresh).not.toBeNull();
    expect(shell.querySelector('.mg-v2-compliance-dashboard__section--overall.mg-v2-settings-panel')).not.toBeNull();
    expect(shell.querySelector('.mg-v2-compliance-dashboard__overall, .mg-v2-content-card')).toBeNull();
    expect(container.textContent).toContain('—');
  });

  it('컴플라이언스 대시보드: 로딩도 셸 안에서 표시', async() => {
    useComplianceDashboardData.mockReturnValue({
      loading: true,
      error: null,
      loadComplianceData: jest.fn()
    });
    const { container } = await renderAt(<ComplianceDashboard />);
    const shell = container.querySelector('section.mg-v2-erp-shell.mg-v2-settings-shell');
    expect(shell).not.toBeNull();
    expect(shell.querySelector('[role="status"]')).not.toBeNull();
  });
});
