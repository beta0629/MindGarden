/**
 * 사무원 드로어 메뉴 = filterStaffRestrictedLnbItems(+ERP) 파이프라인 동일성
 * 필터 함수 자체는 변경하지 않음.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  filterStaffRestrictedLnbItems,
  normalizeLnbTree
} from '../../../utils/lnbMenuUtils';

const mockGetLnbMenus = jest.fn();
const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();
const mockUseResponsive = jest.fn();
const mockUseTenantComponentFlags = jest.fn();

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: () => mockUseBranding()
}));

jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => mockUseResponsive()
}));

jest.mock('../../../hooks/useTenantComponentFlags', () => ({
  useTenantComponentFlags: () => mockUseTenantComponentFlags()
}));

jest.mock('../../../utils/menuApi', () => ({
  getLnbMenus: (...args) => mockGetLnbMenus(...args)
}));

jest.mock('../../../utils/tenantDisplayName', () => ({
  getTenantGnbLabel: () => '테스트센터'
}));

jest.mock('../../../utils/brandingUtils', () => ({
  getGnbLogoUrl: () => null
}));

jest.mock('../../common/UnifiedLoading', () => () => null);

const flattenLabels = (items = []) => items.flatMap((m) => [
  m.label,
  ...flattenLabels(m.children || [])
]);

jest.mock('../../dashboard-v2/templates', () => ({
  DesktopLayout: () => <div data-testid="desktop-layout" />,
  MobileLayout: ({ children, menuItems, drawerVariant }) => {
    const flat = (items = []) => items.flatMap((m) => [m.label, ...flat(m.children || [])]);
    return (
      <div
        data-testid="mobile-layout"
        data-drawer-variant={drawerVariant || ''}
        data-menu-labels={flat(menuItems || []).join('|')}
      >
        {children}
      </div>
    );
  }
}));

import AdminCommonLayout from '../AdminCommonLayout';

const RAW_TREE = [
  { menuName: '대시보드', menuPath: '/admin/dashboard', menuCode: 'ADM_DASHBOARD', children: [] },
  {
    menuName: '배정·결제·환불',
    menuPath: '/admin/mappings',
    menuCode: 'ADM_MAPPING',
    children: [
      { menuName: '결제/구독 관리', menuPath: '/admin/billing/subscriptions', children: [] },
      { menuName: '결제 수단', menuPath: '/admin/billing/payment-methods', children: [] }
    ]
  },
  {
    menuName: '운영·재무',
    menuPath: '/erp/dashboard',
    menuCode: 'ADM_ERP',
    children: [
      { menuName: '이번 달 돈', menuPath: '/erp/financial', children: [] }
    ]
  },
  {
    menuName: '시스템·설정',
    menuPath: '/tenant/profile',
    menuCode: 'ADM_SETTINGS',
    children: [
      { menuName: '센터 프로필', menuPath: '/tenant/profile', children: [] },
      { menuName: '시스템 설정', menuPath: '/admin/system-config', menuCode: 'ADM_SETTINGS_SYSTEM', children: [] },
      { menuName: '결제 연결', menuPath: '/tenant/pg-configurations', menuCode: 'ADM_SETTINGS_PG', children: [] },
      { menuName: 'AI 프로바이더 관리', menuPath: '/admin/system/ai-providers', menuCode: 'ADM_SETTINGS_AI_PROVIDER', children: [] },
      { menuName: '컴플라이언스', menuPath: '/admin/compliance', menuCode: 'ADM_REPORTS_COMP', children: [] }
    ]
  }
];

describe('AdminCommonLayout STAFF drawer pipeline parity', () => {
  beforeEach(() => {
    mockUseBranding.mockReturnValue({ brandingInfo: null, isLoading: false });
    mockUseResponsive.mockReturnValue({ windowSize: { width: 1440, height: 900 } });
    mockUseTenantComponentFlags.mockReturnValue({
      adminShopCatalogEnabled: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    });
    mockUseSession.mockReturnValue({
      user: { id: 2, role: 'STAFF', name: '김사무' },
      logout: jest.fn()
    });
    mockGetLnbMenus.mockResolvedValue({ success: true, data: RAW_TREE });
  });

  test('드로어 menuItems 라벨 = filterStaffRestrictedLnbItems(normalize) 결과와 동일', async() => {
    render(
      <MemoryRouter>
        <AdminCommonLayout>
          <span>본문</span>
        </AdminCommonLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
    });

    const layout = screen.getByTestId('mobile-layout');
    expect(layout).toHaveAttribute('data-drawer-variant', 'soft-sheet');
    expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();

    await waitFor(() => {
      const labels = layout.getAttribute('data-menu-labels') || '';
      expect(labels).toContain('대시보드');
      expect(labels).not.toContain('운영·재무');
    });

    const labels = layout.getAttribute('data-menu-labels') || '';
    expect(labels).not.toContain('운영·재무');
    expect(labels).not.toContain('이번 달 돈');
    expect(labels).toContain('결제/구독 관리');
    expect(labels).toContain('결제 수단');
    expect(labels).not.toContain('시스템 설정');
    expect(labels).not.toContain('결제 연결');
    expect(labels).not.toContain('AI 프로바이더');
    expect(labels).not.toContain('컴플라이언스');

    /* 동일 필터 함수 결과와 금지/허용 집합이 일치 (함수 자체 변경 없음) */
    const filtered = filterStaffRestrictedLnbItems(
      normalizeLnbTree(RAW_TREE, { userRole: 'STAFF', user: { role: 'STAFF' } })
    );
    const filteredFlat = flattenLabels(filtered).join('|');
    expect(filteredFlat).not.toContain('운영·재무');
    expect(filteredFlat).toContain('결제/구독 관리');
    expect(filteredFlat).toContain('결제 수단');
    expect(filteredFlat).not.toContain('시스템 설정');
    expect(filteredFlat).not.toContain('컴플라이언스');
  });
});
