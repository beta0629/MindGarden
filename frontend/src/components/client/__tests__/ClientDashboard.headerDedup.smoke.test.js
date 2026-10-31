/**
 * ClientDashboard — Clinic-OS 커버+챕터 홈 smoke
 *
 * @author Core Solution
 * @since 2026-09-17
 */

import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import {
  CLIENT_COVER_CHAPTER_TEST_ID,
  CLIENT_COVER_CTA_PAY,
  CLIENT_COVER_CTA_PICK_SESSION,
  CLIENT_COVER_CTA_VIEW_SCHEDULE,
  CLIENT_COVER_DOCK_HOME,
  CLIENT_COVER_DOCK_ME,
  CLIENT_COVER_DOCK_SCHEDULE,
  CLIENT_COVER_DOCK_TEST_ID,
  CLIENT_COVER_DOCK_WELLNESS,
  CLIENT_COVER_MENU_LOGOUT,
  CLIENT_COVER_MENU_TEST_ID,
  CLIENT_COVER_NEXT_SHEET_TEST_ID,
  CLIENT_COVER_PANEL_ARIA,
  CLIENT_COVER_SHEET_MODE,
  CLIENT_LOBBY_LOGOUT,
  CLIENT_LOBBY_LOGOUT_CANCEL,
  CLIENT_LOBBY_LOGOUT_CONFIRM
} from '../clientDashboard/constants';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import {
  CLIENT_WEB_LOGIN,
  CLIENT_WEB_PAGE_SHELL_TEST_ID,
  CLIENT_WEB_TOP_CHROME_MENU_TEST_ID,
  CLIENT_WEB_TOP_CHROME_TEST_ID
} from '../../../constants/clientWebChromeConstants';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';
import ClientAppShell from '../../layout/ClientAppShell';
import ClientDashboard from '../ClientDashboard';

/**
 * 프로덕션과 동일 — ClientAppShell( hideChrome ) + 커버 홈
 * @param {import('react').ReactNode} ui
 * @returns {import('@testing-library/react').RenderResult}
 */
const renderCoverHome = (ui = <ClientDashboard />) => render(
  <MemoryRouter initialEntries={[CLIENT_DASHBOARD_ROUTES.DASHBOARD]}>
    <ClientAppShell>
      {ui}
    </ClientAppShell>
  </MemoryRouter>
);

const MOCK_TENANT_CENTER = '햇살상담센터';
const MOCK_BRAND_WORD = 'Sunshine Counseling';

const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();
const mockSessionGetUser = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onClose, title, message, confirmText, cancelText }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>{confirmText}</button>
        <button type="button" onClick={onClose}>{cancelText}</button>
      </div>
    ) : null
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    unreadCount: 0,
    unreadMessageCount: 0,
    unreadSystemCount: 0
  })
}));

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: (...args) => mockUseBranding(...args)
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: () => mockSessionGetUser(),
    isLoggedIn: () => true,
    setUser: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn()
  }
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock(
  '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const buildSessionUser = (overrides = {}) => ({
  id: 101,
  name: '이재학',
  role: 'CLIENT',
  tenant: { tenantId: 'tenant-sunshine', name: MOCK_TENANT_CENTER },
  ...overrides
});

const defaultApiImpl = (endpoint) => {
  if (String(endpoint).includes('schedules')) {
    return Promise.resolve([
      {
        id: 1,
        date: '2099-09-20',
        startTime: '14:00',
        endTime: '14:50',
        status: 'CONFIRMED',
        consultantName: '김선희',
        consultationMethod: 'FACE',
        notes: '대기실 10분 전 도착'
      }
    ]);
  }
  if (String(endpoint).includes('mappings/client')) {
    return Promise.resolve([
      {
        id: 10,
        status: 'ACTIVE',
        totalSessions: 10,
        usedSessions: 6,
        remainingSessions: 4,
        packageName: '마음돌봄 패키지',
        paymentDate: '2099-09-12',
        paymentStatus: 'CONFIRMED',
        consultantName: '김선희'
      },
      {
        id: 11,
        status: 'ACTIVE',
        totalSessions: 1,
        usedSessions: 0,
        remainingSessions: 2,
        packageName: '단회기',
        paymentDate: '2099-09-12',
        paymentStatus: 'CONFIRMED'
      }
    ]);
  }
  if (String(endpoint).includes('unread-count')) {
    return Promise.resolve({ unreadCount: 0 });
  }
  return Promise.resolve(null);
};

describe('ClientDashboard 커버+챕터 홈', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockImplementation(defaultApiImpl);
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(true);
    const sessionUser = buildSessionUser();
    mockUseSession.mockReturnValue({
      user: sessionUser,
      isLoggedIn: true,
      isLoading: false,
      checkSession: jest.fn(),
      logout: mockLogout,
      setModalOpen: jest.fn()
    });
    mockSessionGetUser.mockReturnValue(sessionUser);
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: MOCK_TENANT_CENTER,
        companyNameEn: MOCK_BRAND_WORD
      },
      isLoading: false
    });
  });

  test('has: 커버+챕터 · 상담 일정 보기 · 직접예약 없음 · 독 라우트', async() => {
    const { container } = renderCoverHome();

    expect(screen.getByTestId(CLIENT_COVER_CHAPTER_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId('client-lobby')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
    expect(container.querySelector('.mg-v2-ad-b0kla')).toBeNull();
    expect(container.querySelector('.client-dashboard__kpi-row')).toBeNull();
    // 셸은 존재하되 hideChrome+fullBleed — TopChrome은 커버 안 1개만
    expect(screen.getByTestId(CLIENT_WEB_PAGE_SHELL_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_PAGE_SHELL_TEST_ID)).toHaveAttribute('data-hide-chrome', 'true');
    expect(screen.getByTestId(CLIENT_WEB_PAGE_SHELL_TEST_ID)).toHaveAttribute('data-full-bleed', 'true');
    expect(container.querySelectorAll('.client-cover__menu-btn')).toHaveLength(0);
    expect(container.querySelectorAll(`[data-testid="${CLIENT_WEB_TOP_CHROME_TEST_ID}"]`)).toHaveLength(1);
    expect(container.querySelectorAll(`[data-testid="${CLIENT_WEB_TOP_CHROME_MENU_TEST_ID}"]`)).toHaveLength(1);
    expect(container.querySelector('.client-cover__chrome')).not.toBeNull();
    expect(container.querySelectorAll('.mg-v2-mobile-gnb__menu')).toHaveLength(0);
    expect(container.querySelector('.client-cover__brand-chip')).toBeNull();

    expect(screen.getByText(MOCK_TENANT_CENTER)).toBeInTheDocument();
    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.queryByText('마인드가든')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID)).toBeInTheDocument();
    });

    const sheet = screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID);
    expect(sheet).toHaveAttribute('data-sheet-mode', CLIENT_COVER_SHEET_MODE.HAS);
    expect(within(sheet).getByRole('button', { name: CLIENT_COVER_CTA_VIEW_SCHEDULE }))
      .toBeInTheDocument();
    expect(within(sheet).queryByRole('button', { name: CLIENT_COVER_CTA_PICK_SESSION }))
      .not.toBeInTheDocument();

    const dock = screen.getByTestId(CLIENT_COVER_DOCK_TEST_ID);
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_HOME) }))
      .toHaveAttribute('href', CLIENT_DASHBOARD_ROUTES.DASHBOARD);
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_SCHEDULE) }))
      .toHaveAttribute('href', CLIENT_DASHBOARD_ROUTES.SCHEDULE);
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_WELLNESS) }))
      .toHaveAttribute('href', CLIENT_DASHBOARD_ROUTES.WELLNESS);
    expect(within(dock).getByRole('link', { name: new RegExp(CLIENT_COVER_DOCK_ME) }))
      .toHaveAttribute('href', CLIENT_DASHBOARD_ROUTES.MYPAGE);

    // TopChrome + CoverPanel 둘 다 userName 노출 (헤더 SSOT + 커버 인사)
    const chrome = screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID);
    const cover = screen.getByRole('region', { name: CLIENT_COVER_PANEL_ARIA });
    expect(within(chrome).getByText(/이재학/)).toBeInTheDocument();
    expect(within(cover).getByText(/이재학/)).toBeInTheDocument();
    expect(screen.getAllByText(/이재학/).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole('link', { name: CLIENT_WEB_LOGIN })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '회기' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '안내' })).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /예약하기|새 예약|일정에 담기/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /예약하기|새 예약|일정에 담기/ })).not.toBeInTheDocument();
    const bodyText = container.textContent || '';
    expect(bodyText).not.toMatch(/\/client\/booking/);
  });

  test('zero: 회기 고르기 + 결제하기 · 직접예약 없음', async() => {
    StandardizedApi.get.mockImplementation((endpoint) => {
      if (String(endpoint).includes('schedules')) {
        return Promise.resolve([]);
      }
      if (String(endpoint).includes('mappings/client')) {
        return Promise.resolve([
          {
            id: 10,
            status: 'ACTIVE',
            totalSessions: 4,
            usedSessions: 4,
            remainingSessions: 0,
            packageName: '패키지',
            consultantName: '김선희'
          }
        ]);
      }
      if (String(endpoint).includes('unread-count')) {
        return Promise.resolve({ unreadCount: 0 });
      }
      return Promise.resolve(null);
    });

    const { container } = renderCoverHome();

    await waitFor(() => {
      expect(screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID)).toHaveAttribute(
        'data-sheet-mode',
        CLIENT_COVER_SHEET_MODE.ZERO
      );
    });

    const sheet = screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID);
    expect(within(sheet).getByRole('button', { name: CLIENT_COVER_CTA_PICK_SESSION }))
      .toBeInTheDocument();
    expect(within(sheet).getByRole('button', { name: CLIENT_COVER_CTA_PAY }))
      .toBeInTheDocument();
    expect(within(sheet).queryByRole('button', { name: CLIENT_COVER_CTA_VIEW_SCHEDULE }))
      .not.toBeInTheDocument();

    fireEvent.click(within(sheet).getByRole('button', { name: CLIENT_COVER_CTA_PICK_SESSION }));
    expect(screen.queryByRole('button', { name: /예약하기|새 예약|일정에 담기/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /예약하기|새 예약|일정에 담기/ })).not.toBeInTheDocument();
    expect(container.textContent || '').not.toMatch(/\/client\/booking/);
  });

  test('커버 메뉴 · 로그아웃 ConfirmModal', async() => {
    renderCoverHome();

    fireEvent.click(screen.getByTestId(CLIENT_WEB_TOP_CHROME_MENU_TEST_ID));
    const coverMenu = screen.getByTestId(CLIENT_COVER_MENU_TEST_ID);
    expect(coverMenu).toBeInTheDocument();

    // 헤더 TopChrome에도 「로그아웃」이 있으므로 커버 메뉴 경로만 스코프
    fireEvent.click(
      within(coverMenu).getByRole('button', { name: CLIENT_COVER_MENU_LOGOUT })
    );

    const dialog = await screen.findByRole('dialog', { name: CLIENT_LOBBY_LOGOUT });
    expect(within(dialog).getByText(CLIENT_LOBBY_LOGOUT_CONFIRM)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: CLIENT_LOBBY_LOGOUT_CANCEL }))
      .toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: CLIENT_LOBBY_LOGOUT }));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test('브랜딩 없으면 MindGarden/마인드가든·플랫폼 기본 라벨 없음', () => {
    const sessionUser = buildSessionUser({
      tenant: { tenantId: 'tenant-empty', name: '' },
      tenantName: '',
      branchName: ''
    });
    mockUseSession.mockReturnValue({
      user: sessionUser,
      isLoggedIn: true,
      isLoading: false,
      checkSession: jest.fn(),
      logout: mockLogout,
      setModalOpen: jest.fn()
    });
    mockSessionGetUser.mockReturnValue(sessionUser);
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: 'CoreSolution',
        companyNameEn: 'Core Solution'
      },
      isLoading: false
    });

    renderCoverHome();

    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.queryByText('마인드가든')).not.toBeInTheDocument();
    expect(screen.queryByText('CoreSolution')).not.toBeInTheDocument();
    expect(screen.queryByText('Core Solution')).not.toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_COVER_CHAPTER_TEST_ID)).toBeInTheDocument();
  });

  test('zero CTA는 CATALOG · PAYMENT_HISTORY 로 이동', async() => {
    StandardizedApi.get.mockImplementation((endpoint) => {
      if (String(endpoint).includes('schedules')) {
        return Promise.resolve([]);
      }
      if (String(endpoint).includes('mappings/client')) {
        return Promise.resolve([
          {
            id: 10,
            status: 'PENDING_PAYMENT',
            totalSessions: 4,
            usedSessions: 0,
            remainingSessions: 0,
            packageName: '패키지',
            paymentStatus: 'PENDING'
          }
        ]);
      }
      if (String(endpoint).includes('unread-count')) {
        return Promise.resolve({ unreadCount: 0 });
      }
      return Promise.resolve(null);
    });

    renderCoverHome();

    await waitFor(() => {
      expect(screen.getByTestId(CLIENT_COVER_NEXT_SHEET_TEST_ID)).toHaveAttribute(
        'data-sheet-mode',
        CLIENT_COVER_SHEET_MODE.ZERO
      );
    });

    expect(CLIENT_SHOP_ROUTES.CATALOG).toBe('/client/shop');
    expect(CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY).toBe('/client/payment-history');
    expect(screen.getByRole('button', { name: CLIENT_COVER_CTA_PICK_SESSION })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CLIENT_COVER_CTA_PAY })).toBeInTheDocument();
  });
});
