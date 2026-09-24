/**
 * checkSessionAndRedirect — shell soft-fail URL, justLoggedIn TTL, definitive kick
 */
import {
  JUST_LOGGED_IN_AT_KEY,
  JUST_LOGGED_IN_KEY,
  JUST_LOGGED_IN_TTL_MS,
  SESSION_KEYS
} from '../../constants/session';
import { markJustLoggedIn, clearJustLoggedIn } from '../sessionAuthPolicy';

jest.mock('../sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn().mockReturnValue(true)
}));

jest.mock('../authTokenRefresh', () => ({
  refreshAccessTokenPair: jest.fn().mockResolvedValue(null),
  shouldSkipTokenRefreshOn401: jest.fn().mockReturnValue(false)
}));

jest.mock('../apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' }))
}));

jest.mock('../networkErrorUtils', () => ({
  isTransientNetworkError: jest.fn(() => false),
  notifyTransientNetworkIssue: jest.fn()
}));

jest.mock('../csrfTokenManager', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    getToken: jest.fn()
  }
}));

describe('checkSessionAndRedirect', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    clearJustLoggedIn();
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
    delete window.location;
    window.location = {
      ...originalLocation,
      hostname: 'tenant.example.com',
      pathname: '/admin/dashboard',
      origin: 'https://tenant.example.com',
      href: 'https://tenant.example.com/admin/dashboard'
    };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
    clearJustLoggedIn();
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
  });

  async function loadCheck() {
    const mod = await import('../ajax');
    return mod.checkSessionAndRedirect;
  }

  it('soft-fail branding URL 은 401 이어도 redirect 하지 않음', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      'https://tenant.example.com/api/v1/admin/branding'
    );
    expect(redirected).toBe(false);
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });

  it('soft-fail LNB·common-codes URL 도 redirect 스킵 (query 무시)', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const checkSessionAndRedirect = await loadCheck();

    const lnb = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/menus/lnb?role=ADMIN'
    );
    const codes = await checkSessionAndRedirect(
      { status: 403 },
      'https://x.example/api/v1/common-codes?codeGroup=NOTIFICATION_TYPE'
    );
    expect(lnb).toBe(false);
    expect(codes).toBe(false);
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });

  it('justLoggedIn TTL 창 — 병렬 두 번째 401 도 remove 없이 스킵', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const checkSessionAndRedirect = await loadCheck();
    markJustLoggedIn();

    const first = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/consultants'
    );
    const second = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/clients'
    );

    expect(first).toBe(false);
    expect(second).toBe(false);
    expect(sessionStorage.getItem(JUST_LOGGED_IN_KEY)).toBe('true');
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });

  it('토큰 없음 + TTL 밖 + current-user 401 이면 확정 redirect', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
    sessionStorage.setItem(
      JUST_LOGGED_IN_AT_KEY,
      String(Date.now() - JUST_LOGGED_IN_TTL_MS - 1000)
    );
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);

    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false
    });

    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/consultants'
    );

    expect(redirected).toBe(true);
    expect(redirectToLoginPageOnce).toHaveBeenCalled();
  });

  it('accessToken 보유 + TTL 안이면 verify 전에 soft skip', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    markJustLoggedIn();
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'tok-abc');
    global.fetch = jest.fn();

    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/consultants'
    );

    expect(redirected).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });
});
