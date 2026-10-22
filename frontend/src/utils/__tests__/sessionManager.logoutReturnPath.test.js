/**
 * sessionManager.logout — 유휴 만료 시에만 redirect 복귀 경로를 붙인다.
 * 수동 로그아웃은 ?logout=success 만 사용한다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

const mockGetCurrentLocationReturnUrl = jest.fn(() => '/admin/clients?tab=1');

jest.mock('../consultationLogLocalDraft', () => ({
  purgeAllLegacyConsultationLogLocalDrafts: jest.fn()
}));
jest.mock('../consultationLogDraftBackupStore', () => ({
  purgeAllDraftBackups: jest.fn().mockResolvedValue(undefined),
  purgeRescueBackupsOfOtherUsers: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../sessionRedirect', () => {
  const actual = jest.requireActual('../sessionRedirect');
  return {
    ...actual,
    getCurrentLocationReturnUrl: (...args) => mockGetCurrentLocationReturnUrl(...args)
  };
});

import { LOGIN_RETURN_URL_PARAM } from '../../constants/consultationLogAutosaveConstants';
import { LOGOUT_REDIRECT_QUERY, SESSION_LOGOUT_REASON } from '../../constants/session';
import { LOGIN_RETURN_PATH_STORAGE_KEY } from '../loginReturnPath';
import sessionManager, { buildPostLogoutLoginSearch } from '../sessionManager';

/** isLocalhost() 가 true 가 되도록 localhost origin 사용 */
const ORIGIN = 'http://localhost';
let originalLocation;
let originalFetch;

const setLocation = (pathname, search = '') => {
  delete window.location;
  window.location = {
    origin: ORIGIN,
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    pathname,
    search,
    hash: '',
    href: `${ORIGIN}${pathname}${search}`,
    replace: jest.fn()
  };
};

describe('buildPostLogoutLoginSearch', () => {
  beforeEach(() => {
    originalLocation = window.location;
    setLocation('/admin/clients', '?tab=1');
    mockGetCurrentLocationReturnUrl.mockReset();
    mockGetCurrentLocationReturnUrl.mockReturnValue('/admin/clients?tab=1');
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('기본(수동)은 logout=success 만', () => {
    const search = buildPostLogoutLoginSearch();
    expect(search).toBe(`?${LOGOUT_REDIRECT_QUERY.PARAM}=${LOGOUT_REDIRECT_QUERY.SUCCESS}`);
    expect(search).not.toContain(LOGIN_RETURN_URL_PARAM);
    expect(mockGetCurrentLocationReturnUrl).not.toHaveBeenCalled();
  });

  it('세션 만료 옵션이면 현재 경로를 redirect 로 붙인다', () => {
    const search = buildPostLogoutLoginSearch({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY
    });
    const params = new URLSearchParams(search.slice(1));
    expect(params.get(LOGOUT_REDIRECT_QUERY.PARAM)).toBe(LOGOUT_REDIRECT_QUERY.SUCCESS);
    expect(params.get(LOGIN_RETURN_URL_PARAM)).toBe('/admin/clients?tab=1');
  });

  it.each([
    ['스킴', 'javascript:alert(1)'],
    ['프로토콜 상대', '//evil.com'],
    ['외부 URL', 'https://evil.com/phish'],
    ['로그인 자기참조', '/login']
  ])('위험한 현재 경로(%s)는 redirect 를 붙이지 않는다', (_label, unsafePath) => {
    mockGetCurrentLocationReturnUrl.mockReturnValue(unsafePath);
    const search = buildPostLogoutLoginSearch({ preserveReturnPath: true });
    expect(search).toBe(`?${LOGOUT_REDIRECT_QUERY.PARAM}=${LOGOUT_REDIRECT_QUERY.SUCCESS}`);
    expect(search).not.toContain(`${LOGIN_RETURN_URL_PARAM}=`);
  });
});

describe('sessionManager.logout — redirect 쿼리', () => {
  beforeEach(() => {
    originalLocation = window.location;
    originalFetch = global.fetch;
    setLocation('/admin/clients', '?tab=2');
    mockGetCurrentLocationReturnUrl.mockReset();
    mockGetCurrentLocationReturnUrl.mockReturnValue('/admin/clients?tab=2');
    window.sessionStorage.clear();
    // 싱글톤 로그아웃 사이클(성공/in-flight)이 이전 케이스에 남지 않게
    sessionManager._resetServerLogoutCycle();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    jest.spyOn(sessionManager, 'setPostLogoutGateBeforeRedirect').mockImplementation(() => {});
    // clear 가 저장보다 먼저면 복귀 경로가 사라진다. 구현은 clear 이후에 맡겨야 한다.
    jest.spyOn(sessionManager, 'applyClientLogoutCleanupPreserveSubdomain')
      .mockImplementation(async() => {
        window.sessionStorage.clear();
      });
  });

  afterEach(() => {
    window.location = originalLocation;
    global.fetch = originalFetch;
    sessionManager._resetServerLogoutCycle();
    jest.restoreAllMocks();
  });

  it('수동 logout() 은 redirect 없이 /login?logout=success 이고 저장소에 맡기지 않는다', async() => {
    await sessionManager.logout();
    expect(window.location.replace).toHaveBeenCalledWith(
      `${ORIGIN}/login?${LOGOUT_REDIRECT_QUERY.PARAM}=${LOGOUT_REDIRECT_QUERY.SUCCESS}`
    );
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
  });

  it('세션 만료 logout 은 redirect 쿼리와 mg.loginReturnPath 를 남긴다', async() => {
    await sessionManager.logout({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY
    });
    const calledUrl = window.location.replace.mock.calls[0][0];
    expect(calledUrl.startsWith(`${ORIGIN}/login?`)).toBe(true);
    const params = new URLSearchParams(calledUrl.slice(`${ORIGIN}/login?`.length));
    expect(params.get(LOGOUT_REDIRECT_QUERY.PARAM)).toBe(LOGOUT_REDIRECT_QUERY.SUCCESS);
    expect(params.get(LOGIN_RETURN_URL_PARAM)).toBe('/admin/clients?tab=2');
    const stored = JSON.parse(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY));
    expect(stored.path).toBe('/admin/clients?tab=2');
  });

  it('이미 /login 이어도 잡아 둔 returnPath 를 쿼리와 저장소에 싣는다', async() => {
    setLocation('/login', '?logout=success');
    mockGetCurrentLocationReturnUrl.mockReturnValue('/login?logout=success');
    await sessionManager.logout({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY,
      returnPath: '/admin/clients?tab=2'
    });
    const calledUrl = window.location.replace.mock.calls[0][0];
    const params = new URLSearchParams(calledUrl.slice(`${ORIGIN}/login?`.length));
    expect(params.get(LOGIN_RETURN_URL_PARAM)).toBe('/admin/clients?tab=2');
    const stored = JSON.parse(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY));
    expect(stored.path).toBe('/admin/clients?tab=2');
  });

  it.each([
    ['스킴', 'javascript:alert(1)'],
    ['프로토콜 상대', '//evil.com'],
    ['외부 URL', 'https://evil.com/phish'],
    ['로그인 자기참조', '/login']
  ])('위험한 returnPath(%s)는 redirect 와 저장소를 남기지 않는다', async(_label, unsafePath) => {
    await sessionManager.logout({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY,
      returnPath: unsafePath
    });
    const calledUrl = window.location.replace.mock.calls[0][0];
    expect(calledUrl).toBe(
      `${ORIGIN}/login?${LOGOUT_REDIRECT_QUERY.PARAM}=${LOGOUT_REDIRECT_QUERY.SUCCESS}`
    );
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
  });
});
