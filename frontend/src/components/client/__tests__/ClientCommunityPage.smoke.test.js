/**
 * ClientCommunityPage — v4 ClientWebTopChrome shell smoke (no LNB)
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ClientCommunityPage, {
  ClientCommunityMorePostRedirect
} from '../ClientCommunityPage';
import {
  CLIENT_COMMUNITY_TEST_ID,
  CLIENT_LOBBY_LOGOUT,
  CLIENT_LOBBY_LOGOUT_CANCEL,
  CLIENT_LOBBY_LOGOUT_CONFIRM,
  CLIENT_LOBBY_NAV
} from '../clientDashboard/constants';
import {
  CLIENT_WEB_NAV,
  CLIENT_WEB_NAV_LABELS,
  CLIENT_WEB_TOP_CHROME_TEST_ID,
  CLIENT_WEB_TOP_NAV_TEST_ID
} from '../../../constants/clientWebChromeConstants';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import { CLIENT_SHOP_ROUTES } from '../../../constants/clientShopConstants';

const MOCK_BRAND_WORD = 'Sunshine Counseling';
const MOCK_TENANT_CENTER = '햇살상담센터';
const mockLogout = jest.fn();

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: { id: 1, name: '테스트', tenant: { name: MOCK_TENANT_CENTER } },
    logout: mockLogout
  })
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    unreadCount: 0,
    unreadMessageCount: 0,
    unreadSystemCount: 0
  })
}));

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: () => ({
    brandingInfo: {
      companyName: MOCK_TENANT_CENTER,
      companyNameEn: MOCK_BRAND_WORD
    }
  })
}));

jest.mock('../clientDashboard/lobbyViewModel', () => ({
  resolveLobbyBrandLabels: () => ({
    brandWord: MOCK_BRAND_WORD,
    brandCenter: MOCK_TENANT_CENTER
  }),
  resolveNameInitial: () => '테'
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

jest.mock(
  '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

describe('ClientCommunityPage', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(true);
  });

  test('renders ClientWebTopChrome · CLIENT_WEB_NAV 5 · no LNB/sidebar/ad-dashboard', () => {
    const { container } = render(
      <MemoryRouter initialEntries={[CLIENT_DASHBOARD_ROUTES.COMMUNITY]}>
        <ClientCommunityPage>
          <div data-testid="community-child">feed</div>
        </ClientCommunityPage>
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_COMMUNITY_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId('community-child')).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID)).toBeInTheDocument();

    expect(screen.getByText(MOCK_BRAND_WORD)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TENANT_CENTER)).toBeInTheDocument();

    expect(CLIENT_WEB_NAV).toHaveLength(5);
    expect(CLIENT_LOBBY_NAV).toHaveLength(5);
    expect(CLIENT_WEB_NAV_LABELS).toEqual(['홈', '예정', '회기', '회기 고르기', '결제']);
    expect(CLIENT_LOBBY_NAV.find((item) => item.id === 'community')).toBeUndefined();

    const nav = screen.getByTestId(CLIENT_WEB_TOP_NAV_TEST_ID);
    CLIENT_WEB_NAV.forEach((item) => {
      expect(within(nav).getByRole('link', { name: item.label }))
        .toHaveAttribute('href', item.path);
    });
    expect(within(nav).getByRole('link', { name: '회기 고르기' }))
      .toHaveAttribute('href', CLIENT_SHOP_ROUTES.CATALOG);
    expect(within(nav).queryByRole('link', { name: '커뮤니티' })).not.toBeInTheDocument();
    expect(within(nav).queryByRole('link', { current: 'page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '상담' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '후기' })).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: CLIENT_LOBBY_LOGOUT })).toBeInTheDocument();

    const communityRoot = screen.getByTestId(CLIENT_COMMUNITY_TEST_ID);
    expect(communityRoot.querySelector('.mg-v2-desktop-lnb')).toBeNull();
    expect(communityRoot.querySelector('.mg-app-shell__sidebar')).toBeNull();
    expect(communityRoot.querySelector('.mg-v2-ad-dashboard-v2')).toBeNull();
    expect(document.querySelector('.mg-v2-desktop-lnb')).toBeNull();
    expect(document.querySelector('.mg-app-shell__sidebar')).toBeNull();
    expect(document.querySelector('.mg-v2-ad-dashboard-v2')).toBeNull();
    expect(container.querySelector('.mg-v2-desktop-lnb')).toBeNull();
  });

  test('top chrome 로그아웃 → ConfirmModal → useSession.logout', async() => {
    render(
      <MemoryRouter initialEntries={[CLIENT_DASHBOARD_ROUTES.COMMUNITY]}>
        <ClientCommunityPage>
          <div>feed</div>
        </ClientCommunityPage>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: CLIENT_LOBBY_LOGOUT }));
    const dialog = await screen.findByRole('dialog', { name: CLIENT_LOBBY_LOGOUT });
    expect(within(dialog).getByText(CLIENT_LOBBY_LOGOUT_CONFIRM)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: CLIENT_LOBBY_LOGOUT_CANCEL }))
      .toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: CLIENT_LOBBY_LOGOUT }));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test('ClientCommunityMorePostRedirect maps postId to SSOT path', () => {
    render(
      <MemoryRouter initialEntries={['/client/more/community/42']}>
        <Routes>
          <Route
            path="/client/more/community/:postId"
            element={<ClientCommunityMorePostRedirect />}
          />
          <Route
            path="/client/community/:postId"
            element={<div data-testid="dest">ok</div>}
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('dest')).toBeInTheDocument();
  });
});
