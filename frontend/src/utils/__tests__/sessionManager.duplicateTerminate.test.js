/**
 * current-user 401 — SESSION_TERMINATED_DUPLICATE 시 reason=duplicate-login 리다이렉트
 */
import { sessionManager } from '../sessionManager';
import {
  SESSION_TERMINATED_DUPLICATE_ERROR_CODE,
  DUPLICATE_LOGIN_REDIRECT_SEARCH
} from '../../constants/session';

jest.mock('../sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn().mockReturnValue(true)
}));

jest.mock('../authTokenRefresh', () => ({
  refreshAccessTokenPair: jest.fn().mockResolvedValue(false)
}));

jest.mock('../apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({})),
  getDefaultApiHeadersWithCsrf: jest.fn(() => ({}))
}));

jest.mock('../networkErrorUtils', () => ({
  isTransientNetworkError: jest.fn(() => false),
  notifyTransientNetworkIssue: jest.fn()
}));

describe('sessionManager.checkSession — duplicate terminate 401', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionManager.user = { id: 1 };
    sessionManager.sessionInfo = { id: 'x' };
    sessionManager.lastCheckTime = 0;
    delete window.location;
    window.location = {
      ...originalLocation,
      hostname: 'tenant.example.com',
      pathname: '/admin/dashboard',
      origin: 'https://tenant.example.com',
      href: 'https://tenant.example.com/admin/dashboard'
    };
    sessionStorage.removeItem('justLoggedIn');
    sessionStorage.removeItem('justLoggedInAt');
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
  });

  it('errorCode SESSION_TERMINATED_DUPLICATE 이면 reason=duplicate-login 으로 이동', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({
        success: false,
        message: '다른 곳에서 로그인하여 현재 세션이 종료되었습니다.',
        data: { errorCode: SESSION_TERMINATED_DUPLICATE_ERROR_CODE }
      })
    });

    const ok = await sessionManager.checkSession(true);

    expect(ok).toBe(false);
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith({
      search: DUPLICATE_LOGIN_REDIRECT_SEARCH
    });
  });

  it('일반 401 은 search 없이 로그인 이동', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({
        success: false,
        message: '인증이 필요합니다.',
        data: null
      })
    });

    const ok = await sessionManager.checkSession(true);

    expect(ok).toBe(false);
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith();
  });

  it('justLoggedIn TTL 창 안이면 401 이어도 redirect 스킵 (one-shot remove 없음)', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { markJustLoggedIn } = require('../sessionAuthPolicy');
    markJustLoggedIn();
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({
        success: false,
        message: '인증이 필요합니다.',
        data: null
      })
    });

    const first = await sessionManager.checkSession(true);
    sessionManager.lastCheckTime = 0;
    const second = await sessionManager.checkSession(true);

    expect(first).toBe(false);
    expect(second).toBe(false);
    expect(sessionStorage.getItem('justLoggedIn')).toBe('true');
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });
});
