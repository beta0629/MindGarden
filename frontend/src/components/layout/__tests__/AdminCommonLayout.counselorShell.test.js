/**
 * AdminCommonLayout — 상담사·관리자 soft-sheet 햄버거 셸
 * 상담사·운영자·사무원: 전 폭 MobileLayout + soft-sheet (Desktop LNB 폐기)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockGetLnbMenus = jest.fn();
const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();
const mockUseResponsive = jest.fn();
const mockUseTenantComponentFlags = jest.fn();
const mockUseMediaQuery = jest.fn();

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: () => mockUseBranding()
}));

jest.mock('../../../hooks/useResponsive', () => ({
  useResponsive: () => mockUseResponsive()
}));

jest.mock('../../../hooks/useMediaQuery', () => ({
  __esModule: true,
  default: (query) => mockUseMediaQuery(query)
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
  MobileLayout: ({
    children,
    drawerVariant,
    drawerActiveTone,
    drawerTitle,
    shellTone,
    menuItems,
    headerTitle,
    logoHomePath
  }) => (
    <div
      data-testid="mobile-layout"
      data-drawer-variant={drawerVariant || ''}
      data-drawer-active-tone={drawerActiveTone || ''}
      data-drawer-title={drawerTitle || ''}
      data-shell-tone={shellTone || ''}
      data-header-title={headerTitle}
      data-logo-home={logoHomePath}
      data-menu-labels={(menuItems || []).map((m) => m.label).join('|')}
    >
      <button type="button" className="mg-v2-mobile-gnb__menu" aria-label="메뉴">
        메뉴
      </button>
      {children}
    </div>
  )
}));

import AdminCommonLayout from '../AdminCommonLayout';
import { MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER } from '../../dashboard-v2/constants/menuItems';

const COUNSELOR_SOFT_SHEET_WIDTHS = [820, 1024, 1180, 1280, 1440, 1920];
const ADMIN_SOFT_SHEET_WIDTHS = [820, 1024, 1280, 1440, 1920];

const expectCounselorMobileSoftSheet = async() => {
  await waitFor(() => {
    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
  });
  expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
  expect(screen.getByTestId('mobile-layout')).toHaveAttribute('data-drawer-variant', 'soft-sheet');
  expect(screen.getByTestId('mobile-layout')).toHaveAttribute('data-drawer-active-tone', 'primary');
  expect(document.querySelectorAll('.mg-v2-mobile-gnb__menu')).toHaveLength(1);
  expect(document.querySelectorAll('.consultant-cover-chapter__menu-btn')).toHaveLength(0);
  expect(document.querySelectorAll('.mg-v2-desktop-lnb')).toHaveLength(0);
};

const expectAdminMobileSoftSheet = async() => {
  await waitFor(() => {
    expect(screen.getByTestId('mobile-layout')).toBeInTheDocument();
  });
  expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
  const layout = screen.getByTestId('mobile-layout');
  expect(layout).toHaveAttribute('data-drawer-variant', 'soft-sheet');
  expect(layout).toHaveAttribute('data-drawer-active-tone', 'slate');
  expect(layout).toHaveAttribute('data-drawer-title', '메뉴');
  expect(layout).toHaveAttribute('data-shell-tone', 'admin');
  expect(document.querySelectorAll('.mg-v2-mobile-gnb__menu')).toHaveLength(1);
  expect(document.querySelectorAll('.mg-v2-desktop-lnb')).toHaveLength(0);
};

describe('AdminCommonLayout counselor Clinic-OS shell', () => {
  beforeEach(() => {
    mockUseBranding.mockReturnValue({ brandingInfo: null, isLoading: false });
    mockUseResponsive.mockReturnValue({ windowSize: { width: 1280, height: 800 } });
    mockUseMediaQuery.mockImplementation(
      (query) => query === MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER
    );
    mockUseTenantComponentFlags.mockReturnValue({
      adminShopCatalogEnabled: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    });
    mockUseSession.mockReturnValue({
      user: { id: 1, role: 'CONSULTANT', name: '김상담' },
      logout: jest.fn()
    });
    mockGetLnbMenus.mockResolvedValue({
      success: true,
      data: [
        { menuName: '시스템·설정', menuPath: '/tenant/profile', menuCode: 'ADM_SETTINGS', children: [] },
        { menuName: '운영·재무', menuPath: '/erp/dashboard', menuCode: 'ADM_ERP', children: [] }
      ]
    });
  });

  test('상담사-only: LNB 제목 상담, CONSULTANT 메뉴, logoHome /consultant/dashboard, API ops LNB 무시', async() => {
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
    expect(layout).toHaveAttribute('data-header-title', '상담');
    expect(layout).toHaveAttribute('data-logo-home', '/consultant/dashboard');
    expect(layout).toHaveAttribute('data-drawer-variant', 'soft-sheet');
    const labels = layout.getAttribute('data-menu-labels') || '';
    expect(labels.length).toBeGreaterThan(0);
    expect(labels).toContain('대시보드');
    expect(labels).toContain('일정 관리');
    expect(labels).toContain('내담자 조회');
    expect(labels).toContain('상담 기록');
    expect(labels).toContain('급여 정산');
    expect(labels).not.toContain('시스템·설정');
    expect(labels).not.toContain('운영·재무');
    expect(mockGetLnbMenus).not.toHaveBeenCalled();
    expect(screen.queryByTestId('desktop-layout')).not.toBeInTheDocument();
  });

  test.each(COUNSELOR_SOFT_SHEET_WIDTHS)(
    '상담사 폭 %i(+fine-pointer): MobileLayout + soft-sheet, Desktop LNB 없음',
    async(width) => {
      mockUseResponsive.mockReturnValue({ windowSize: { width, height: 900 } });
      mockUseMediaQuery.mockImplementation(
        (query) => query === MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER
      );

      render(
        <MemoryRouter>
          <AdminCommonLayout>
            <span>본문</span>
          </AdminCommonLayout>
        </MemoryRouter>
      );

      await expectCounselorMobileSoftSheet();
    }
  );

  test('상담사 Android-like(1366) coarse pointer: MobileLayout + soft-sheet', async() => {
    mockUseResponsive.mockReturnValue({ windowSize: { width: 1366, height: 768 } });
    mockUseMediaQuery.mockReturnValue(false);

    render(
      <MemoryRouter>
        <AdminCommonLayout>
          <span>본문</span>
        </AdminCommonLayout>
      </MemoryRouter>
    );

    await expectCounselorMobileSoftSheet();
  });

  test('상담사 데스크톱(1280+) fine-pointer: MobileLayout + soft-sheet (DesktopLayout 아님)', async() => {
    mockUseResponsive.mockReturnValue({ windowSize: { width: 1280, height: 800 } });
    mockUseMediaQuery.mockImplementation(
      (query) => query === MEDIA_QUERY_CONSULTANT_DESKTOP_FINE_POINTER
    );

    render(
      <MemoryRouter>
        <AdminCommonLayout>
          <span>본문</span>
        </AdminCommonLayout>
      </MemoryRouter>
    );

    await expectCounselorMobileSoftSheet();
  });

  test.each(ADMIN_SOFT_SHEET_WIDTHS)(
    '운영자 폭 %i: MobileLayout + soft-sheet slate (DesktopLnb 없음)',
    async(width) => {
      mockUseSession.mockReturnValue({
        user: { id: 2, role: 'ADMIN', name: '관리자' },
        logout: jest.fn()
      });
      mockUseResponsive.mockReturnValue({ windowSize: { width, height: 900 } });

      render(
        <MemoryRouter>
          <AdminCommonLayout>
            <span>본문</span>
          </AdminCommonLayout>
        </MemoryRouter>
      );

      await expectAdminMobileSoftSheet();
    }
  );
});
