/**
 * ClientRouteGuard — 직접 URL·새로고침 시 세션 복원 전 /login·대시보드로 튕기지 않음 (라우터 테스트)
 * App.js 와 같은 모양: 보호 화면은 가드 그룹 안, 레거시 경로는 가드 밖 Redirect → 가드 안 목적지.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ClientRouteGuard from '../ClientRouteGuard';
import {
  CLIENT_DASHBOARD_ROUTES,
  CLIENT_LEGACY_ROUTE_REDIRECTS
} from '../../../constants/clientDashboardRoutes';

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: jest.fn()
}));

jest.mock('../../common/UnifiedLoading', () => function MockUnifiedLoading() {
  return <div data-testid="guard-loading">Loading</div>;
});

import { useSession } from '../../../contexts/SessionContext';

const ACTIVITY_HISTORY = '/client/activity-history';
const MINDFULNESS_GUIDE = '/client/mindfulness-guide';
const RECORDS = '/client/records';

const GUARDED_PATHS = [
  CLIENT_DASHBOARD_ROUTES.DASHBOARD,
  CLIENT_DASHBOARD_ROUTES.SCHEDULE,
  CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT,
  CLIENT_DASHBOARD_ROUTES.PAYMENT_HISTORY,
  CLIENT_DASHBOARD_ROUTES.MESSAGES,
  ACTIVITY_HISTORY,
  CLIENT_DASHBOARD_ROUTES.WELLNESS,
  MINDFULNESS_GUIDE
];

/** [요청 경로, 최종 화면 경로] — 지시서의 직접 URL 튕김 6개 */
const BOUNCING_CASES = [
  [CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT, CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT],
  [RECORDS, CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT],
  ['/client/sessions', CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT],
  [ACTIVITY_HISTORY, ACTIVITY_HISTORY],
  [CLIENT_DASHBOARD_ROUTES.WELLNESS, CLIENT_DASHBOARD_ROUTES.WELLNESS],
  [MINDFULNESS_GUIDE, MINDFULNESS_GUIDE]
];

const mountCounts = {};

const ScreenProbe = ({ path }) => {
  useEffect(() => {
    mountCounts[path] = (mountCounts[path] || 0) + 1;
  }, [path]);
  return <div data-testid="client-screen">{path}</div>;
};

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

const Tree = ({ path }) => (
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route element={<ClientRouteGuard />}>
        {GUARDED_PATHS.map((p) => (
          <Route key={p} path={p} element={<ScreenProbe path={p} />} />
        ))}
      </Route>
      <Route path={RECORDS} element={<Navigate to={CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT} replace />} />
      {CLIENT_LEGACY_ROUTE_REDIRECTS.map(({ from, to }) => (
        <Route key={from} path={from} element={<Navigate to={to} replace />} />
      ))}
      <Route path="/login" element={<div data-testid="login-page" />} />
      <Route path="*" element={<div data-testid="other-page" />} />
    </Routes>
    <LocationProbe />
  </MemoryRouter>
);

let currentSession;

const setSession = (overrides) => {
  currentSession = {
    user: null,
    isLoading: false,
    hasCheckedSession: false,
    hasPermissionGroup: () => false,
    ...overrides
  };
};

const CLIENT_USER = { id: 101, role: 'CLIENT', tenantId: 'tenant-test' };

describe('ClientRouteGuard — direct URL / refresh / re-check', () => {
  beforeEach(() => {
    useSession.mockReset();
    useSession.mockImplementation(() => currentSession);
    Object.keys(mountCounts).forEach((k) => delete mountCounts[k]);
  });

  test.each(BOUNCING_CASES)(
    '%s: 세션 복원 전(isLoading=false · 미확인)에는 대기, 복원 뒤 %s 화면 (로그인·대시보드로 안 튕김)',
    (requestPath, finalPath) => {
      setSession({ isLoading: false, hasCheckedSession: false });
      const view = render(<Tree path={requestPath} />);
      expect(screen.getByTestId('guard-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).toBeNull();
      expect(screen.getByTestId('location')).toHaveTextContent(finalPath);

      setSession({ user: CLIENT_USER, hasCheckedSession: true });
      view.rerender(<Tree path={requestPath} />);
      expect(screen.getByTestId('client-screen')).toHaveTextContent(finalPath);
      expect(screen.getByTestId('location')).toHaveTextContent(finalPath);
    }
  );

  test.each(GUARDED_PATHS)('%s: 복원된 사용자는 재확인(isLoading=true) 중에도 화면을 내리지 않는다', (path) => {
    setSession({ user: CLIENT_USER, hasCheckedSession: true });
    const view = render(<Tree path={path} />);
    expect(mountCounts[path]).toBe(1);

    setSession({ user: CLIENT_USER, hasCheckedSession: true, isLoading: true });
    view.rerender(<Tree path={path} />);
    expect(screen.getByTestId('client-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('guard-loading')).toBeNull();

    setSession({ user: CLIENT_USER, hasCheckedSession: true, isLoading: false });
    view.rerender(<Tree path={path} />);
    expect(mountCounts[path]).toBe(1);
  });

  test('확인 끝 + 사용자 없음 → /login', () => {
    setSession({ hasCheckedSession: true });
    render(<Tree path={CLIENT_DASHBOARD_ROUTES.SESSION_MANAGEMENT} />);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  test('첫 확인 중(isLoading=true · 사용자 없음) → 대기, /login 아님', () => {
    setSession({ hasCheckedSession: true, isLoading: true });
    render(<Tree path={ACTIVITY_HISTORY} />);
    expect(screen.getByTestId('guard-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).toBeNull();
  });

  test('다른 역할(상담사) → 내담자 화면 렌더 안 함', () => {
    setSession({ user: { id: 7, role: 'CONSULTANT', tenantId: 'tenant-test' }, hasCheckedSession: true });
    render(<Tree path={CLIENT_DASHBOARD_ROUTES.WELLNESS} />);
    expect(screen.queryByTestId('client-screen')).toBeNull();
  });

  test.each([
    ['/client/home', CLIENT_DASHBOARD_ROUTES.DASHBOARD],
    ['/client/booking', CLIENT_DASHBOARD_ROUTES.SCHEDULE],
    ['/client/wellness-hub', CLIENT_DASHBOARD_ROUTES.WELLNESS]
  ])('레거시 %s → %s (가드 안 화면)', (from, to) => {
    setSession({ user: CLIENT_USER, hasCheckedSession: true });
    render(<Tree path={from} />);
    expect(screen.getByTestId('location')).toHaveTextContent(to);
    expect(screen.getByTestId('client-screen')).toHaveTextContent(to);
  });
});
