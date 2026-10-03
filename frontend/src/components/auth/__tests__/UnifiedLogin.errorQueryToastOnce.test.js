/**
 * UnifiedLogin — /login?error=<메시지> 진입 시 토스트가 한 번만 뜬다
 *
 * 마운트 effect 와 [location.search] effect 가 둘 다 checkOAuthCallback 을 부르면
 * (replaceState 는 router location 을 바꾸지 않음) 같은 오류 토스트가 두 번 떴다.
 *
 * @author CoreSolution
 * @since 2026-10-04
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

const ERROR_TEXT = '소셜 로그인 오류 테스트';

describe('UnifiedLogin ?error= 토스트 1회', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async() => ({}) });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('error 쿼리로 들어오면 notificationManager.show 는 한 번만 호출', async() => {
    await act(async() => {
      render(
        <MemoryRouter initialEntries={[`/login?error=${encodeURIComponent(ERROR_TEXT)}`]}>
          <UnifiedLogin />
        </MemoryRouter>
      );
    });
    const errorCalls = notificationManager.show.mock.calls.filter(
      ([message, type]) => message === ERROR_TEXT && type === 'error'
    );
    expect(errorCalls).toHaveLength(1);
  });
});
