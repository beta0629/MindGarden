/**
 * useClientShopAuth — ClientRouteGuard 정렬
 * hasCheckedSession 만 대기 · isLoading 무시 · /login soft-kick 없음
 *
 * @author CoreSolution
 * @since 2026-10-28
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useClientShopAuth } from '../useClientShopAuth';

const mockUseSession = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const wrapper = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('useClientShopAuth', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUseSession.mockReturnValue({
      isLoggedIn: true,
      isLoading: false,
      hasCheckedSession: true,
      user: { id: 7, role: 'CLIENT' }
    });
  });

  test('sessionLoading 은 !hasCheckedSession 만 반영한다 (isLoading 무시)', () => {
    mockUseSession.mockReturnValue({
      isLoggedIn: true,
      isLoading: true,
      hasCheckedSession: true,
      user: { id: 7, role: 'CLIENT' }
    });

    const { result } = renderHook(() => useClientShopAuth(), { wrapper });

    expect(result.current.sessionLoading).toBe(false);
    expect(result.current.isAwaitingSession).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('hasCheckedSession=false 이면 sessionLoading true', () => {
    mockUseSession.mockReturnValue({
      isLoggedIn: false,
      isLoading: false,
      hasCheckedSession: false,
      user: null
    });

    const { result } = renderHook(() => useClientShopAuth(), { wrapper });

    expect(result.current.sessionLoading).toBe(true);
    expect(result.current.isAwaitingSession).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('로그인 불필요 경로에서도 /login 으로 navigate 하지 않는다', () => {
    mockUseSession.mockReturnValue({
      isLoggedIn: false,
      isLoading: true,
      hasCheckedSession: true,
      user: null
    });

    const { result } = renderHook(
      () => useClientShopAuth({ requireLogin: false }),
      { wrapper }
    );

    expect(result.current.sessionLoading).toBe(false);
    expect(result.current.isAwaitingSession).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('requireLogin true 이고 미로그인이어도 soft-kick navigate 하지 않는다 (가드 SSOT)', () => {
    mockUseSession.mockReturnValue({
      isLoggedIn: false,
      isLoading: false,
      hasCheckedSession: true,
      user: null
    });

    const { result } = renderHook(
      () => useClientShopAuth({
        requireLogin: true,
        loginRedirectPath: '/client/shop/cart'
      }),
      { wrapper }
    );

    expect(result.current.sessionLoading).toBe(false);
    expect(result.current.isAwaitingSession).toBe(true);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
