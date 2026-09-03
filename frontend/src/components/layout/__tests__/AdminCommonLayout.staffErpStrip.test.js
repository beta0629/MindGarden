/**
 * AdminCommonLayout — STAFF LNB ERP strip
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

jest.mock('../../dashboard-v2/templates', () => ({
  DesktopLayout: ({ children, menuItems, headerTitle, logoHomePath }) => (
    <div
      data-testid="desktop-layout"
      data-header-title={headerTitle}
      data-logo-home={logoHomePath}
      data-menu-labels={(menuItems || []).map((m) => m.label).join('|')}
    >
      {children}
    </div>
  ),
  MobileLayout: ({ children }) => <div data-testid="mobile-layout">{children}</div>
}));

import AdminCommonLayout from '../AdminCommonLayout';

describe('AdminCommonLayout STAFF ERP LNB strip', () => {
  beforeEach(() => {
    mockUseBranding.mockReturnValue({ brandingInfo: null, isLoading: false });
    mockUseResponsive.mockReturnValue({ windowSize: { width: 1280 } });
    mockUseTenantComponentFlags.mockReturnValue({
      adminShopCatalogEnabled: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    });
    mockUseSession.mockReturnValue({
      user: { id: 2, role: 'STAFF', name: '김사무' },
      logout: jest.fn()
    });
    mockGetLnbMenus.mockResolvedValue({
      success: true,
      data: [
        { menuName: '대시보드', menuPath: '/admin/dashboard', menuCode: 'ADM_DASHBOARD', children: [] },
        {
          menuName: '운영·재무',
          menuPath: '/erp/dashboard',
          menuCode: 'ADM_ERP',
          children: [
            { menuName: '이번 달 돈', menuPath: '/erp/financial', children: [] }
          ]
        },
        { menuName: '사용자', menuPath: '/admin/users', menuCode: 'ADM_USERS', children: [] }
      ]
    });
  });

  test('STAFF: LNB에서 운영·재무 제거, logoHome /admin/dashboard', async() => {
    render(
      <MemoryRouter>
        <AdminCommonLayout>
          <span>본문</span>
        </AdminCommonLayout>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    });

    const layout = screen.getByTestId('desktop-layout');
    expect(layout).toHaveAttribute('data-logo-home', '/admin/dashboard');
    const labels = layout.getAttribute('data-menu-labels') || '';
    expect(labels).not.toContain('운영·재무');
    expect(labels).not.toContain('이번 달 돈');
  });
});
