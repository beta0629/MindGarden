/**
 * sessionManager.checkSession — background 401:
 * keep-user=false(기본) → user clear + 리다이렉트(foreground 와 동일 킥 경로).
 * keep-user=true → 사용자 유지·리다이렉트 없음.
 * 중복 로그인 종료 401·foreground 확정 401 은 항상 킥.
 *
 * @author CoreSolution
 * @since 2026-09-24
 */
import { sessionManager } from '../sessionManager';
import {
  DUPLICATE_LOGIN_REDIRECT_SEARCH,
  JUST_LOGGED_IN_AT_KEY,
  JUST_LOGGED_IN_KEY,
  JUST_LOGGED_IN_TTL_MS,
  SESSION_KEYS,
  SESSION_TERMINATED_DUPLICATE_ERROR_CODE
} from '../../constants/session';
import { AUTH_API } from '../../constants/api';
import { clearJustLoggedIn, clearJustRefreshed } from '../sessionAuthPolicy';
import { resetSessionSecurityFlagsCacheForTests } from '../sessionSecurityFlags';

jest.mock('../sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn().mockReturnValue(true)
}));

jest.mock('../authTokenRefresh', () => ({
  refreshAccessTokenPair: jest.fn().mockResolvedValue(null)
}));

jest.mock('../apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({})),
  getDefaultApiHeadersWithCsrf: jest.fn(() => ({}))
}));

jest.mock('../networkErrorUtils', () => ({
  isTransientNetworkError: jest.fn(() => false),
  notifyTransientNetworkIssue: jest.fn()
}));

/** load 가 API 를 치지 않고 캐시(테스트용 reset)만 쓰게 한다 */
jest.mock('../sessionSecurityFlags', () => {
  const actual = jest.requireActual('../sessionSecurityFlags');
  return {
    ...actual,
    loadSessionSecurityFlags: jest.fn(async() => actual.getCachedSessionSecurityFlags())
  };
});
const LOGGED_IN_USER = Object.freeze({ id: 7, role: 'ADMIN', tenantId: 'tenant-a' });
const TENANT_HOST = 'tenant.example.com';
const DASHBOARD_PATH = '/admin/dashboard';
const CLOCK_BASE_MS = 1_800_000_000_000;
const CLOCK_SKEW_MS = 1;

const unauthorizedResponse = (data = null) => ({
  status: 401,
  ok: false,
  json: async() => ({ success: false, message: '인증이 필요합니다.', data })
});

const duplicateTerminatedResponse = () => ({
  status: 401,
  ok: false,
  json: async() => ({
    success: false,
    message: '다른 곳에서 로그인하여 현재 세션이 종료되었습니다.',
    data: { errorCode: SESSION_TERMINATED_DUPLICATE_ERROR_CODE }
  })
});

describe('sessionManager.checkSession — background 401', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  const resetAuthStorage = () => {
    clearJustLoggedIn();
    clearJustRefreshed();
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(SESSION_KEYS.REFRESH_TOKEN);
  };

  let originalCleanup;

  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthStorage();
    resetSessionSecurityFlagsCacheForTests();
    originalCleanup = sessionManager.applyClientLogoutCleanupPreserveSubdomain;
    sessionManager.user = { ...LOGGED_IN_USER };
    sessionManager.sessionInfo = { id: 'sess-1', isAuthenticated: true };
    sessionManager.lastCheckTime = 0;
    sessionManager.inflightCheckPromise = null;
    delete window.location;
    window.location = {
      ...originalLocation,
      hostname: TENANT_HOST,
      pathname: DASHBOARD_PATH,
      origin: `https://${TENANT_HOST}`,
      href: `https://${TENANT_HOST}${DASHBOARD_PATH}`
    };
    // 실제 정리는 localStorage·쿠키를 지우므로 인스턴스에서만 대체 (prototype 메서드 유지)
    sessionManager.applyClientLogoutCleanupPreserveSubdomain = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionManager.applyClientLogoutCleanupPreserveSubdomain = originalCleanup;
    global.fetch = originalFetch;
    window.location = originalLocation;
    resetAuthStorage();
    resetSessionSecurityFlagsCacheForTests();
  });

  it('background 401(토큰 없음) 기본(keep-user=false) 은 사용자 클리어 + /login', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    const ok = await sessionManager.checkSession(true, { background: true });

    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toBeNull();
    expect(sessionManager.getSessionInfo()).toBeNull();
    expect(sessionManager.applyClientLogoutCleanupPreserveSubdomain).toHaveBeenCalled();
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith();
  });

  it('background 401 → refresh 실패여도 토큰 보유 시(keep-user=false) 킥하지 않음', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'old-access');
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'old-refresh');
    refreshAccessTokenPair.mockResolvedValue(null);
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    const ok = await sessionManager.checkSession(true, { background: true });

    expect(refreshAccessTokenPair).toHaveBeenCalled();
    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toEqual(LOGGED_IN_USER);
    expect(sessionManager.applyClientLogoutCleanupPreserveSubdomain).not.toHaveBeenCalled();
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });

  it('keep-user=true 이면 background 401(토큰 없음) 은 사용자 유지 + 리다이렉트 없음', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    resetSessionSecurityFlagsCacheForTests({ background401KeepUser: true });
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    const ok = await sessionManager.checkSession(true, { background: true });

    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toEqual(LOGGED_IN_USER);
    expect(sessionManager.getSessionInfo()).not.toBeNull();
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
    expect(sessionManager.applyClientLogoutCleanupPreserveSubdomain).not.toHaveBeenCalled();
  });

  it('keep-user=true 이면 background 401 → refresh 실패여도 사용자 유지 + 리다이렉트 없음', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    resetSessionSecurityFlagsCacheForTests({ background401KeepUser: true });
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'old-access');
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'old-refresh');
    refreshAccessTokenPair.mockResolvedValue(null);
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    const ok = await sessionManager.checkSession(true, { background: true });

    expect(refreshAccessTokenPair).toHaveBeenCalled();
    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toEqual(LOGGED_IN_USER);
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
    expect(sessionManager.applyClientLogoutCleanupPreserveSubdomain).not.toHaveBeenCalled();
  });
  it('background 이어도 중복 로그인 종료 401 은 reason=duplicate-login 으로 이동', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    global.fetch = jest.fn().mockResolvedValue(duplicateTerminatedResponse());

    const ok = await sessionManager.checkSession(true, { background: true });

    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toBeNull();
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith({
      search: DUPLICATE_LOGIN_REDIRECT_SEARCH
    });
  });

  it('foreground 확정 401 은 기존대로 사용자 정리 후 /login', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    const ok = await sessionManager.checkSession(true);

    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toBeNull();
    expect(sessionManager.applyClientLogoutCleanupPreserveSubdomain).toHaveBeenCalled();
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith();
  });

  it('요청 시작 시 grace 안이면 응답이 TTL 뒤에 와도 foreground 401 킥 스킵', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    let clock = CLOCK_BASE_MS;
    jest.spyOn(Date, 'now').mockImplementation(() => clock);
    sessionStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
    sessionStorage.setItem(JUST_LOGGED_IN_AT_KEY, String(CLOCK_BASE_MS - CLOCK_SKEW_MS));
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'refresh-tok');
    global.fetch = jest.fn().mockImplementation(async() => {
      // DB 풀 대기 등으로 응답이 grace TTL 을 넘겨 도착
      clock = CLOCK_BASE_MS + JUST_LOGGED_IN_TTL_MS + CLOCK_SKEW_MS;
      return unauthorizedResponse();
    });

    const ok = await sessionManager.checkSession(true);

    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toEqual(LOGGED_IN_USER);
    expect(refreshAccessTokenPair).not.toHaveBeenCalled();
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
  });

  it('grace 창이어도 중복 로그인 종료 401 은 킥한다', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { markJustLoggedIn } = require('../sessionAuthPolicy');
    markJustLoggedIn();
    global.fetch = jest.fn().mockResolvedValue(duplicateTerminatedResponse());

    const ok = await sessionManager.checkSession(true, { background: true });

    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toBeNull();
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith({
      search: DUPLICATE_LOGIN_REDIRECT_SEARCH
    });
  });

  it('current-user 200 이어도 justLoggedIn TTL 은 유지한다', async() => {
    const { markJustLoggedIn } = require('../sessionAuthPolicy');
    markJustLoggedIn();
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async() => ({ success: true, data: { id: 7, role: 'ADMIN', tenantId: 'tenant-a' } })
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async() => ({ success: true, data: { isAuthenticated: true, maxInactiveInterval: 1800, lastAccessedTime: Date.now(), serverNow: Date.now() } })
      });

    const ok = await sessionManager.checkSession(true);

    expect(ok).toBe(true);
    expect(sessionStorage.getItem(JUST_LOGGED_IN_KEY)).toBe('true');
  });

  it('idleExpiry 401 은 grace·refresh·background 유지와 리다이렉트를 하지 않는다', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    const { markJustLoggedIn } = require('../sessionAuthPolicy');
    markJustLoggedIn();
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'old-access');
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'old-refresh');
    refreshAccessTokenPair.mockResolvedValue({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    const ok = await sessionManager.checkSession(true, { background: true, idleExpiry: true });

    expect(ok).toBe(false);
    expect(refreshAccessTokenPair).not.toHaveBeenCalled();
    expect(sessionManager.getUser()).toEqual(LOGGED_IN_USER);
    expect(sessionManager.getSessionInfo()).not.toBeNull();
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
    expect(sessionManager.applyClientLogoutCleanupPreserveSubdomain).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('idleExpiry 여도 중복 로그인 종료 401 은 reason=duplicate-login 으로 이동', async() => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    localStorage.setItem(SESSION_KEYS.REFRESH_TOKEN, 'old-refresh');
    global.fetch = jest.fn().mockResolvedValue(duplicateTerminatedResponse());

    const ok = await sessionManager.checkSession(true, { idleExpiry: true });

    expect(ok).toBe(false);
    expect(refreshAccessTokenPair).not.toHaveBeenCalled();
    expect(sessionManager.getUser()).toBeNull();
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith({
      search: DUPLICATE_LOGIN_REDIRECT_SEARCH
    });
  });

  it('idleExpiry 는 진행 중인 background 확인 promise 에 합류하지 않는다', async() => {
    let releaseBackground;
    const backgroundPromise = new Promise((resolve) => {
      releaseBackground = () => resolve(false);
    });
    sessionManager.inflightCheckPromise = backgroundPromise;
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    const idlePromise = sessionManager.checkSession(true, { idleExpiry: true });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    releaseBackground();
    const ok = await idlePromise;

    expect(ok).toBe(false);
    expect(sessionManager.getUser()).toEqual(LOGGED_IN_USER);
  });

  it('endFormSubmit 은 background 확인을 건다', () => {
    const checkSpy = jest.spyOn(sessionManager, 'checkSession').mockResolvedValue(true);
    sessionManager.formSubmitCount = 1;

    sessionManager.endFormSubmit();

    expect(checkSpy).toHaveBeenCalledWith(true, { background: true });
  });
});

describe('sessionManager fetch 훅 — refresh-token 제외', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    window.fetch = originalFetch;
  });

  const loadIsolatedManager = (innerFetch) => {
    window.fetch = innerFetch;
    let isolated;
    jest.isolateModules(() => {
      isolated = require('../sessionManager').sessionManager;
    });
    return isolated;
  };

  it('refresh-token POST 는 폼 훅 세션 확인을 걸지 않는다', async() => {
    const innerFetch = jest.fn().mockResolvedValue({ status: 200, ok: true });
    const isolated = loadIsolatedManager(innerFetch);
    const checkSpy = jest.spyOn(isolated, 'checkSession').mockResolvedValue(true);

    await window.fetch(`https://${TENANT_HOST}${AUTH_API.REFRESH_TOKEN}`, { method: 'POST' });

    expect(innerFetch).toHaveBeenCalledTimes(1);
    expect(checkSpy).not.toHaveBeenCalled();
    expect(isolated.formSubmitCount).toBe(0);
  });

  it('일반 POST 는 완료 후 background 세션 확인', async() => {
    const innerFetch = jest.fn().mockResolvedValue({ status: 200, ok: true });
    const isolated = loadIsolatedManager(innerFetch);
    const checkSpy = jest.spyOn(isolated, 'checkSession').mockResolvedValue(true);

    await window.fetch(`https://${TENANT_HOST}/api/v1/admin/clients`, { method: 'POST' });

    expect(innerFetch).toHaveBeenCalledTimes(1);
    expect(checkSpy).toHaveBeenCalledWith(true, { background: true });
  });
});
