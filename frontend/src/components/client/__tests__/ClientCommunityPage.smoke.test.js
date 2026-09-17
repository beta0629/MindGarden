/**
 * ClientCommunityPage — v4 lobby shell smoke
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ClientCommunityPage, {
  ClientCommunityMorePostRedirect
} from '../ClientCommunityPage';
import {
  CLIENT_COMMUNITY_TEST_ID,
  CLIENT_LOBBY_NAV
} from '../clientDashboard/constants';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 1, name: '테스트' } })
}));

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: () => ({ brandingInfo: null })
}));

jest.mock('../clientDashboard/lobbyViewModel', () => ({
  resolveLobbyBrandLabels: () => ({ brandWord: '', brandCenter: '' }),
  resolveNameInitial: () => '테'
}));

describe('ClientCommunityPage', () => {
  test('renders lobby chrome with community nav active', () => {
    render(
      <MemoryRouter initialEntries={[CLIENT_DASHBOARD_ROUTES.COMMUNITY]}>
        <ClientCommunityPage>
          <div data-testid="community-child">feed</div>
        </ClientCommunityPage>
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_COMMUNITY_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId('community-child')).toBeInTheDocument();

    const communityNav = CLIENT_LOBBY_NAV.find((item) => item.id === 'community');
    expect(communityNav).toBeDefined();
    expect(communityNav.routeKey).toBe('COMMUNITY');

    const link = screen.getByRole('link', { name: communityNav.label });
    expect(link).toHaveAttribute('href', CLIENT_DASHBOARD_ROUTES.COMMUNITY);
    expect(link).toHaveAttribute('aria-current', 'page');
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
