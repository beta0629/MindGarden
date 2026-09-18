/**
 * ClientCommunityPage — v4 lobby shell smoke
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
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';

const MOCK_BRAND_WORD = 'Sunshine Counseling';
const MOCK_TENANT_CENTER = '햇살상담센터';
const mockLogout = jest.fn();

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: { id: 1, name: '테스트', tenant: { name: MOCK_TENANT_CENTER } },
    logout: mockLogout
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

describe('ClientCommunityPage', () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(true);
  });

  test('renders lobby chrome with brand · community nav · logout', () => {
    render(
      <MemoryRouter initialEntries={[CLIENT_DASHBOARD_ROUTES.COMMUNITY]}>
        <ClientCommunityPage>
          <div data-testid="community-child">feed</div>
        </ClientCommunityPage>
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_COMMUNITY_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId('community-child')).toBeInTheDocument();

    expect(screen.getByText(MOCK_BRAND_WORD)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TENANT_CENTER)).toBeInTheDocument();

    const communityNav = CLIENT_LOBBY_NAV.find((item) => item.id === 'community');
    expect(communityNav).toBeDefined();
    expect(communityNav.routeKey).toBe('COMMUNITY');

    const link = screen.getByRole('link', { name: communityNav.label });
    expect(link).toHaveAttribute('href', CLIENT_DASHBOARD_ROUTES.COMMUNITY);
    expect(link).toHaveAttribute('aria-current', 'page');

    expect(screen.getByRole('button', { name: CLIENT_LOBBY_LOGOUT })).toBeInTheDocument();
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
