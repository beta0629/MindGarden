/**
 * SessionContext + ProtectedRoute — sessionManager 가 사용자를 유지한 채 false 를 돌려주면
 * (auth grace·백그라운드 401) Context 도 사용자를 유지해 /login 소프트 킥이 나지 않는다.
 * sessionManager 가 사용자를 비운 확정 만료는 기존대로 /login.
 *
 * @author CoreSolution
 * @since 2026-09-24
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';

import { SessionProvider, useSession } from '../SessionContext';
import ProtectedRoute from '../../components/common/ProtectedRoute';
import { sessionManager } from '../../utils/sessionManager';
import { USER_ROLES } from '../../constants/roles';

jest.mock('../../utils/sessionManager', () => ({
  sessionManager: {
    checkSession: jest.fn(() => Promise.resolve(false)),
    getUser: jest.fn(() => null),
    getSessionInfo: jest.fn(() => null),
    isLoggedIn: jest.fn(() => false),
    getLastCheckTime: jest.fn(() => 0),
    consumePostLogoutGate: jest.fn(() => false),
    logout: jest.fn(() => Promise.resolve()),
    applyClientLogoutCleanupPreserveSubdomain: jest.fn()
  }
}));

jest.mock('../../utils/ajax', () => ({
  authAPI: { login: jest.fn() },
  apiGet: jest.fn(),
  apiPost: jest.fn()
}));

jest.mock('../../components/common/UnifiedLoading', () => function MockUnifiedLoading() {
  return <div data-testid="loading">Loading</div>;
});

const ADMIN_USER = Object.freeze({ id: 11, role: USER_ROLES.ADMIN, tenantId: 'tenant-a' });
const DASHBOARD_PATH = '/admin/dashboard';
const LOGIN_PATH = '/login';

let sessionApi = null;

function SessionProbe() {
  sessionApi = useSession();
  return <div data-testid="dashboard">Admin Dashboard</div>;
}

const renderDashboard = () => render(
  <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
    <SessionProvider>
      <Routes>
        <Route
          path={DASHBOARD_PATH}
          element={(
            <ProtectedRoute requiredRoles={[USER_ROLES.ADMIN]}>
              <SessionProbe />
            </ProtectedRoute>
          )}
        />
        <Route path={LOGIN_PATH} element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </SessionProvider>
  </MemoryRouter>
);

describe('SessionContext — sessionManager 가 유지한 사용자는 Context 도 유지', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionApi = null;
    sessionManager.checkSession.mockResolvedValue(false);
    sessionManager.getUser.mockReturnValue(null);
    sessionManager.getSessionInfo.mockReturnValue(null);
  });

  it('마운트 확인이 false 여도 sessionManager 에 사용자가 있으면 대시보드 유지', async() => {
    sessionManager.getUser.mockReturnValue(ADMIN_USER);

    renderDashboard();

    expect(await screen.findByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('마운트 확인 false + sessionManager 사용자 없음이면 /login', async() => {
    renderDashboard();

    expect(await screen.findByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('silent 확인은 background 로 위임되고 401(false)이어도 대시보드 유지', async() => {
    sessionManager.checkSession.mockResolvedValueOnce(true);
    sessionManager.getUser.mockReturnValue(ADMIN_USER);
    renderDashboard();
    await screen.findByTestId('dashboard');

    sessionManager.checkSession.mockResolvedValueOnce(false);
    let result;
    await act(async() => {
      result = await sessionApi.checkSession(false, { silent: true });
    });

    expect(result).toBe(false);
    expect(sessionManager.checkSession).toHaveBeenLastCalledWith(false, {
      background: true,
      idleExpiry: false,
      skipAuthGrace: false
    });
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('idleExpiry 확인은 silent 여도 background 로 올리지 않는다', async() => {
    sessionManager.checkSession.mockResolvedValue(true);
    sessionManager.getUser.mockReturnValue(ADMIN_USER);
    renderDashboard();
    await screen.findByTestId('dashboard');

    await act(async() => {
      await sessionApi.checkSession(true, { silent: true, idleExpiry: true });
    });

    expect(sessionManager.checkSession).toHaveBeenLastCalledWith(true, {
      background: false,
      idleExpiry: true,
      skipAuthGrace: false
    });
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('비 silent 확인은 foreground 로 위임', async() => {
    sessionManager.checkSession.mockResolvedValue(true);
    sessionManager.getUser.mockReturnValue(ADMIN_USER);
    renderDashboard();
    await screen.findByTestId('dashboard');

    await act(async() => {
      await sessionApi.checkSession(true);
    });

    expect(sessionManager.checkSession).toHaveBeenLastCalledWith(true, {
      background: false,
      idleExpiry: false,
      skipAuthGrace: false
    });
  });

  it('sessionManager 가 사용자를 비운 확정 만료는 /login 으로 이동', async() => {
    sessionManager.checkSession.mockResolvedValueOnce(true);
    sessionManager.getUser.mockReturnValue(ADMIN_USER);
    renderDashboard();
    await screen.findByTestId('dashboard');

    sessionManager.checkSession.mockResolvedValueOnce(false);
    sessionManager.getUser.mockReturnValue(null);
    await act(async() => {
      await sessionApi.checkSession(true);
    });

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });
});
