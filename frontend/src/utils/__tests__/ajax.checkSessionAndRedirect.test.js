/**
 * checkSessionAndRedirect — soft-fail URL, auth grace, refresh+Bearer retry, definitive kick
 */
import {
  JUST_LOGGED_IN_AT_KEY,
  JUST_LOGGED_IN_KEY,
  JUST_LOGGED_IN_TTL_MS,
  SESSION_KEYS
} from '../../constants/session';
import {
  markJustLoggedIn,
  clearJustLoggedIn,
  markJustRefreshed,
  clearJustRefreshed
} from '../sessionAuthPolicy';

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
    clearJustRefreshed();
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
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
    clearJustRefreshed();
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
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

  it('soft-fail unread-count URL 은 401 이어도 redirect 하지 않음', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const checkSessionAndRedirect = await loadCheck();

    const messages = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/consultation-messages/unread-count'
    );
    const notifications = await checkSessionAndRedirect(
      { status: 401 },
      'https://tenant.example.com/api/v1/notifications/unread-count?x=1'
    );

    expect(messages).toBe(false);
    expect(notifications).toBe(false);
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
    localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);

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

  it('refresh 200 → current-user retry 에 새 Bearer → NO redirect', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'old-tok');
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'refresh-tok');
    refreshAccessTokenPair.mockResolvedValue({
      accessToken: 'new-access-tok',
      refreshToken: 'new-refresh-tok'
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true });

    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/consultants'
    );

    expect(redirected).toBe(false);
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
    expect(refreshAccessTokenPair).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const retryCall = global.fetch.mock.calls[1];
    expect(retryCall[1].headers.Authorization).toBe('Bearer new-access-tok');
  });

  it('refresh 실패 → redirect', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'old-tok');
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'refresh-tok');
    refreshAccessTokenPair.mockResolvedValue(null);

    global.fetch = jest.fn().mockResolvedValue({ status: 401, ok: false });

    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/consultants'
    );

    expect(redirected).toBe(true);
    expect(redirectToLoginPageOnce).toHaveBeenCalled();
  });

  it('post-refresh retry 가 여전히 401 → redirect', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'old-tok');
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'refresh-tok');
    refreshAccessTokenPair.mockResolvedValue({
      accessToken: 'new-access-tok',
      refreshToken: 'new-refresh-tok'
    });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockResolvedValueOnce({ status: 401, ok: false });

    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/consultants'
    );

    expect(redirected).toBe(true);
    expect(redirectToLoginPageOnce).toHaveBeenCalled();
    const retryCall = global.fetch.mock.calls[1];
    expect(retryCall[1].headers.Authorization).toBe('Bearer new-access-tok');
  });

  it('justRefreshed TTL 창 — 후속 current-user 401 도 NO redirect', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    markJustRefreshed();
    global.fetch = jest.fn();

    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/auth/current-user'
    );

    expect(redirected).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });

  it('authGraceAtStart=true 이면 TTL 만료 후 판정해도 verify·redirect 없음', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
    sessionStorage.setItem(
      JUST_LOGGED_IN_AT_KEY,
      String(Date.now() - JUST_LOGGED_IN_TTL_MS - 1000)
    );
    global.fetch = jest.fn();

    const checkSessionAndRedirect = await loadCheck();
    const redirected = await checkSessionAndRedirect(
      { status: 401 },
      '/api/v1/admin/consultants',
      { authGraceAtStart: true }
    );

    expect(redirected).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });

  describe('apiGet — 요청 시작 시점 grace', () => {
    const CLOCK_BASE_MS = 1_800_000_000_000;
    const CLOCK_SKEW_MS = 1;

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const unauthorizedGetResponse = () => ({
      status: 401,
      ok: false,
      headers: { get: () => null }
    });

    it('grace 안에서 보낸 요청의 401 이 TTL 뒤에 도착해도 redirect 없음', async () => {
      const { redirectToLoginPageOnce } = require('../sessionRedirect');
      let clock = CLOCK_BASE_MS;
      jest.spyOn(Date, 'now').mockImplementation(() => clock);
      sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
      sessionStorage.setItem(JUST_LOGGED_IN_AT_KEY, String(CLOCK_BASE_MS - CLOCK_SKEW_MS));
      global.fetch = jest.fn().mockImplementation(async () => {
        clock = CLOCK_BASE_MS + JUST_LOGGED_IN_TTL_MS + CLOCK_SKEW_MS;
        return unauthorizedGetResponse();
      });

      const { apiGet } = await import('../ajax');
      const result = await apiGet('/api/v1/admin/consultants');

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
    });

    it('grace 밖에서 보낸 요청의 401 은 current-user 재확인 후 redirect', async () => {
      const { redirectToLoginPageOnce } = require('../sessionRedirect');
      global.fetch = jest.fn().mockResolvedValue(unauthorizedGetResponse());

      const { apiGet } = await import('../ajax');
      const result = await apiGet('/api/v1/admin/consultants');

      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(redirectToLoginPageOnce).toHaveBeenCalled();
    });
  });
});
