/**
 * AdminLayout 영속 셸 — 라우트 전환 시 GNB/LNB remount·getLnbMenus 재호출 방지
 *
 * @author Core Solution
 * @since 2026-09-08
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom';

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

jest.mock('../../common/UnifiedLoading', () => ({ text }) => (
  <div data-testid="unified-loading">{text}</div>
));

let desktopLayoutMountCount = 0;

jest.mock('../../dashboard-v2/templates', () => {
  const ReactActual = require('react');
  return {
    DesktopLayout: ({ children, headerTitle }) => {
      ReactActual.useEffect(() => {
        desktopLayoutMountCount += 1;
      }, []);
      return (
        <div data-testid="desktop-layout" data-header-title={headerTitle}>
          {children}
        </div>
      );
    },
    MobileLayout: ({ children }) => <div data-testid="mobile-layout">{children}</div>
  };
});

import AdminLayout from '../AdminLayout';
import AdminCommonLayout from '../AdminCommonLayout';

const PageA = () => (
  <AdminCommonLayout title="페이지A">
    <div data-testid="page-a">A</div>
    <Link to="/admin/b">go-b</Link>
  </AdminCommonLayout>
);

const PageB = () => {
  const location = useLocation();
  return (
    <AdminCommonLayout title="페이지B">
      <div data-testid="page-b">B</div>
      <span data-testid="pathname">{location.pathname}</span>
      <Link to="/admin/a">go-a</Link>
    </AdminCommonLayout>
  );
};

describe('AdminLayout shell persist', () => {
  beforeEach(() => {
    desktopLayoutMountCount = 0;
    mockUseBranding.mockReturnValue({ brandingInfo: null, isLoading: false });
    mockUseResponsive.mockReturnValue({ windowSize: { width: 1280 } });
    mockUseTenantComponentFlags.mockReturnValue({
      adminShopCatalogEnabled: false,
      clientShopEnabled: false,
      clientRewardEnabled: false
    });
    mockUseSession.mockReturnValue({
      user: { id: 1, role: 'ADMIN', name: '관리자', tenantId: 'tenant-1' },
      logout: jest.fn()
    });
    mockGetLnbMenus.mockResolvedValue({
      success: true,
      data: [
        { menuName: '대시보드', menuPath: '/admin/dashboard', menuCode: 'ADM_DASHBOARD', children: [] }
      ]
    });
  });

  test('라우트 전환 시 DesktopLayout 단일 마운트·getLnbMenus 추가 호출 없음·pathname만 변경', async() => {
    render(
      <MemoryRouter initialEntries={['/admin/a']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="a" element={<PageA />} />
            <Route path="b" element={<PageB />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-a')).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockGetLnbMenus).toHaveBeenCalledTimes(1);
    });

    const layoutBefore = screen.getByTestId('desktop-layout');
    expect(desktopLayoutMountCount).toBe(1);
    expect(screen.getAllByTestId('desktop-layout')).toHaveLength(1);

    await act(async() => {
      screen.getByRole('link', { name: 'go-b' }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('page-b')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('page-a')).not.toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/admin/b');
    expect(screen.getByTestId('desktop-layout')).toBe(layoutBefore);
    expect(desktopLayoutMountCount).toBe(1);
    expect(mockGetLnbMenus).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('desktop-layout')).toHaveLength(1);
    await waitFor(() => {
      expect(screen.getByTestId('desktop-layout')).toHaveAttribute('data-header-title', '페이지B');
    });
  });

  test('lazy Outlet suspend 시 DesktopLayout(chrome) 유지·stage fallback만 표시', async() => {
    let resolveLazy;
    const lazyPromise = new Promise((resolve) => {
      resolveLazy = resolve;
    });

    const LazyPage = React.lazy(() => lazyPromise.then(() => ({
      default: () => (
        <AdminCommonLayout title="지연페이지">
          <div data-testid="lazy-page">lazy-ready</div>
        </AdminCommonLayout>
      )
    })));

    render(
      <MemoryRouter initialEntries={['/admin/lazy']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="lazy" element={<LazyPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('desktop-layout')).toBeInTheDocument();
    });
    expect(screen.getByTestId('admin-layout-stage-fallback')).toBeInTheDocument();
    expect(screen.getByTestId('unified-loading')).toHaveTextContent('페이지를 불러오는 중...');
    expect(screen.queryByTestId('lazy-page')).not.toBeInTheDocument();
    expect(desktopLayoutMountCount).toBe(1);

    const layoutDuringSuspend = screen.getByTestId('desktop-layout');

    await act(async() => {
      resolveLazy();
    });

    await waitFor(() => {
      expect(screen.getByTestId('lazy-page')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('admin-layout-stage-fallback')).not.toBeInTheDocument();
    expect(screen.getByTestId('desktop-layout')).toBe(layoutDuringSuspend);
    expect(desktopLayoutMountCount).toBe(1);
    expect(mockGetLnbMenus).toHaveBeenCalledTimes(1);
  });
});
