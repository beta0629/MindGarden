/**
 * ProtectedRoute 단위 테스트 — 레거시 role(HQ_ADMIN/TENANT_ADMIN) SSOT 매핑 후 접근 허용.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

import ProtectedRoute from '../ProtectedRoute';
import { USER_ROLES } from '../../../constants/roles';

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: jest.fn()
}));

jest.mock('../UnifiedLoading', () => function MockUnifiedLoading() {
  return <div data-testid="loading">Loading</div>;
});

import { useSession } from '../../../contexts/SessionContext';

const renderProtectedRoute = (sessionOverrides, routeProps = {}) => render(
  <MemoryRouter initialEntries={['/admin/dashboard']}>
    <ProtectedRoute
      requiredRoles={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}
      {...routeProps}
    >
      <div data-testid="protected-content">Admin Dashboard</div>
    </ProtectedRoute>
  </MemoryRouter>
);

describe('ProtectedRoute legacy role SSOT', () => {
  beforeEach(() => {
    useSession.mockReset();
  });

  test('HQ_ADMIN 사용자는 requiredRoles ADMIN/STAFF 에서 children 을 렌더한다', () => {
    useSession.mockReturnValue({
      user: { id: 1, role: 'HQ_ADMIN' },
      isLoading: false,
      hasCheckedSession: true,
      hasPermissionGroup: () => false
    });

    renderProtectedRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  test('TENANT_ADMIN 사용자는 requiredRoles ADMIN/STAFF 에서 children 을 렌더한다', () => {
    useSession.mockReturnValue({
      user: { id: 2, role: 'TENANT_ADMIN' },
      isLoading: false,
      hasCheckedSession: true,
      hasPermissionGroup: () => false
    });

    renderProtectedRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('CLIENT 사용자는 admin 경로에서 자신의 대시보드로 리다이렉트된다', () => {
    useSession.mockReturnValue({
      user: { id: 3, role: 'CLIENT' },
      isLoading: false,
      hasCheckedSession: true,
      hasPermissionGroup: () => false
    });

    renderProtectedRoute();

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
