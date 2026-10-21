/**
 * sessionManager.checkSession — idleExpiry 재확인은 Bearer 를 보내지 않는다.
 * idleExpiry 가 없으면 current-user·session-info 모두 저장 토큰을 유지한다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
import { sessionManager } from '../sessionManager';
import { HTTP_AUTHORIZATION_HEADER, SESSION_KEYS } from '../../constants/session';
import { clearJustLoggedIn, clearJustRefreshed } from '../sessionAuthPolicy';
import { resetSessionSecurityFlagsCacheForTests } from '../sessionSecurityFlags';
import { getDefaultApiHeaders } from '../apiHeaders';

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

const STORED_BEARER = 'Bearer test-access-token';
const LOGGED_IN_USER = Object.freeze({ id: 7, role: 'ADMIN', tenantId: 'tenant-a' });
const TENANT_HOST = 'tenant.example.com';
const DASHBOARD_PATH = '/admin/dashboard';
const CURRENT_USER_PATH = '/api/v1/auth/current-user';
const SESSION_INFO_PATH = '/api/v1/auth/session-info';
const ACCEPT_JSON = 'application/json';

const unauthorizedResponse = () => ({
  status: 401,
  ok: false,
  json: async() => ({ success: false, message: '인증이 필요합니다.', data: null })
});

const okJson = (data) => ({
  status: 200,
  ok: true,
  json: async() => ({ success: true, data })
});

const callsFor = (fragment) => (
  global.fetch.mock.calls.filter((call) => String(call[0]).includes(fragment))
);

const expectNoBearer = (call) => {
  const headers = call[1].headers;
  expect(headers.Accept).toBe(ACCEPT_JSON);
  expect(headers).not.toHaveProperty(HTTP_AUTHORIZATION_HEADER);
};

const expectStoredBearer = (call) => {
  const headers = call[1].headers;
  expect(headers.Accept).toBe(ACCEPT_JSON);
  expect(headers[HTTP_AUTHORIZATION_HEADER]).toBe(STORED_BEARER);
};

describe('sessionManager.checkSession — idleExpiry Bearer 제거', () => {
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
    getDefaultApiHeaders.mockImplementation(() => ({
      Accept: ACCEPT_JSON,
      [HTTP_AUTHORIZATION_HEADER]: STORED_BEARER
    }));
    originalCleanup = sessionManager.applyClientLogoutCleanupPreserveSubdomain;
    sessionManager.user = { ...LOGGED_IN_USER };
    sessionManager.sessionInfo = { id: 'sess-test', isAuthenticated: true };
    sessionManager.lastCheckTime = 0;
    sessionManager.inflightCheckPromise = null;
    sessionManager.checkInProgress = false;
    sessionManager.isLoading = false;
    sessionManager.isFormSubmitting = false;
    sessionManager.isProfileEditing = false;
    delete window.location;
    window.location = {
      ...originalLocation,
      hostname: TENANT_HOST,
      pathname: DASHBOARD_PATH,
      origin: `https://${TENANT_HOST}`,
      href: `https://${TENANT_HOST}${DASHBOARD_PATH}`
    };
    sessionManager.applyClientLogoutCleanupPreserveSubdomain = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    sessionManager.applyClientLogoutCleanupPreserveSubdomain = originalCleanup;
    global.fetch = originalFetch;
    window.location = originalLocation;
    resetAuthStorage();
    resetSessionSecurityFlagsCacheForTests();
    sessionManager.lastCheckTime = 0;
    sessionManager.inflightCheckPromise = null;
    sessionManager.checkInProgress = false;
  });

  it('idleExpiry 이고 current-user 가 401 이면 Authorization 없이 한 번만 조회하고 refresh 하지 않는다', async() => {
    // Given
    const { refreshAccessTokenPair } = require('../authTokenRefresh');
    global.fetch = jest.fn().mockResolvedValue(unauthorizedResponse());

    // When
    const ok = await sessionManager.checkSession(true, { silent: true, idleExpiry: true });

    // Then
    expect(ok).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const currentUserCalls = callsFor(CURRENT_USER_PATH);
    expect(currentUserCalls).toHaveLength(1);
    expectNoBearer(currentUserCalls[0]);
    expect(callsFor(SESSION_INFO_PATH)).toHaveLength(0);
    expect(refreshAccessTokenPair).not.toHaveBeenCalled();
  });

  it('idleExpiry 이고 current-user·session-info 가 200 이면 두 호출 모두 Authorization 이 없다', async() => {
    // Given
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ id: 7, role: 'ADMIN', tenantId: 'tenant-a' }))
      .mockResolvedValueOnce(okJson({
        isAuthenticated: true,
        maxInactiveInterval: 1800,
        lastAccessedTime: Date.now(),
        serverNow: Date.now()
      }));

    // When
    const ok = await sessionManager.checkSession(true, { idleExpiry: true });

    // Then
    expect(ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const currentUserCalls = callsFor(CURRENT_USER_PATH);
    const sessionInfoCalls = callsFor(SESSION_INFO_PATH);
    expect(currentUserCalls).toHaveLength(1);
    expect(sessionInfoCalls).toHaveLength(1);
    expectNoBearer(currentUserCalls[0]);
    expectNoBearer(sessionInfoCalls[0]);
  });

  it('idleExpiry 없는 checkSession(true) 200 이면 current-user 와 session-info 모두 Bearer 를 유지한다', async() => {
    // Given
    global.fetch = jest.fn()
      .mockResolvedValueOnce(okJson({ id: 7, role: 'ADMIN', tenantId: 'tenant-a' }))
      .mockResolvedValueOnce(okJson({
        isAuthenticated: true,
        maxInactiveInterval: 1800,
        lastAccessedTime: Date.now(),
        serverNow: Date.now()
      }));

    // When
    const ok = await sessionManager.checkSession(true);

    // Then
    expect(ok).toBe(true);
    const currentUserCalls = callsFor(CURRENT_USER_PATH);
    const sessionInfoCalls = callsFor(SESSION_INFO_PATH);
    expect(currentUserCalls).toHaveLength(1);
    expect(sessionInfoCalls).toHaveLength(1);
    expectStoredBearer(currentUserCalls[0]);
    expectStoredBearer(sessionInfoCalls[0]);
  });
});
