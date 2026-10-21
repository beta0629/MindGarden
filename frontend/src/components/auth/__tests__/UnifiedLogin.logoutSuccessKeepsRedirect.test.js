/**
 * UnifiedLogin — logout=success 처리 후 redirect 쿼리 유지
 *
 * 유휴 만료 등 /login?logout=success&redirect=... 진입 시
 * replaceState 가 bare /login 으로 덮어쓰면 재로그인 복귀가 깨진다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

import React from 'react';
import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import notificationManager from '../../../utils/notification';

const mockCheckSession = jest.fn();
const mockLogin = jest.fn();
const mockRedirectToDynamicDashboard = jest.fn();

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'ko' } }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  SessionContext: jest.requireActual('react').createContext(null),
  useSession: () => ({
    checkSession: mockCheckSession,
    setDuplicateLoginModal: jest.fn(),
    duplicateLoginModal: { isOpen: false },
    user: null
  })
}));

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  authAPI: { login: (...args) => mockLogin(...args) }
}));

jest.mock('../../../utils/sessionManager', () => ({
  __esModule: true,
  sessionManager: {
    setUser: jest.fn(),
    getUser: jest.fn(() => null)
  }
}));

jest.mock('../../../utils/sessionAuthPolicy', () => ({
  __esModule: true,
  markJustLoggedIn: jest.fn()
}));

jest.mock('../../../utils/socialLogin', () => ({
  __esModule: true,
  appleLogin: jest.fn(),
  googleLogin: jest.fn(),
  kakaoLogin: jest.fn(),
  naverLogin: jest.fn()
}));

jest.mock('../../../services/oauth2/googleWebOAuth2Service', () => ({
  __esModule: true,
  requestGoogleSocialLogin: jest.fn()
}));

jest.mock('../../../services/clientShopService', () => ({
  __esModule: true,
  mergeGuestShopCartIntoServer: jest.fn().mockResolvedValue({ merged: false, lines: [] })
}));

jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  __esModule: true,
  fetchTenantPublicHomeMeta: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../../utils/dashboardUtils', () => ({
  __esModule: true,
  redirectToDynamicDashboard: (...args) => mockRedirectToDynamicDashboard(...args)
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

// eslint-disable-next-line import/first
import UnifiedLogin from '../UnifiedLogin';

const REDIRECT_PATH = '/admin/integrated-schedule';
const REDIRECT_ENCODED = encodeURIComponent(REDIRECT_PATH);

describe('UnifiedLogin logout=success keeps redirect', () => {
  const originalFetch = global.fetch;
  let replaceStateSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async() => ({}) });
    replaceStateSpy = jest.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    replaceStateSpy.mockRestore();
    global.fetch = originalFetch;
  });

  test('logout=success 처리 후 replaceState URL 에 redirect 유지·logout 제거', async() => {
    await act(async() => {
      render(
        <MemoryRouter
          initialEntries={[`/login?logout=success&redirect=${REDIRECT_ENCODED}`]}
        >
          <UnifiedLogin />
        </MemoryRouter>
      );
    });

    expect(notificationManager.show).toHaveBeenCalledWith(
      'auth:unifiedLogin.msg.logoutSuccess',
      'success'
    );

    const replaceUrls = replaceStateSpy.mock.calls.map((call) => call[2]);
    const loginReplace = replaceUrls.find(
      (url) => typeof url === 'string' && url.startsWith('/login')
    );
    expect(loginReplace).toBeDefined();
    expect(loginReplace).not.toMatch(/(^|[?&])logout=/);
    const params = new URLSearchParams(loginReplace.includes('?') ? loginReplace.split('?')[1] : '');
    expect(params.get('redirect')).toBe(REDIRECT_PATH);
  });

  test('redirect 만 있는 진입은 replaceState 로 /login 을 덮지 않는다', async() => {
    await act(async() => {
      render(
        <MemoryRouter initialEntries={[`/login?redirect=${REDIRECT_ENCODED}`]}>
          <UnifiedLogin />
        </MemoryRouter>
      );
    });

    const bareLoginRewrites = replaceStateSpy.mock.calls.filter((call) => {
      const url = call[2];
      return typeof url === 'string' && (url === '/login' || url.startsWith('/login?'));
    });
    expect(bareLoginRewrites).toHaveLength(0);
  });
});
