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
import { buildPostLogoutLoginSearch } from '../sessionManager';
import sessionManager from '../sessionManager';

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
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    jest.spyOn(sessionManager, 'setPostLogoutGateBeforeRedirect').mockImplementation(() => {});
    jest.spyOn(sessionManager, 'applyClientLogoutCleanupPreserveSubdomain')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.location = originalLocation;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('수동 logout() 은 redirect 없이 /login?logout=success', async() => {
    await sessionManager.logout();
    expect(window.location.replace).toHaveBeenCalledWith(
      `${ORIGIN}/login?${LOGOUT_REDIRECT_QUERY.PARAM}=${LOGOUT_REDIRECT_QUERY.SUCCESS}`
    );
  });

  it('세션 만료 logout 은 redirect 를 포함한다', async() => {
    await sessionManager.logout({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY
    });
    const calledUrl = window.location.replace.mock.calls[0][0];
    expect(calledUrl.startsWith(`${ORIGIN}/login?`)).toBe(true);
    const params = new URLSearchParams(calledUrl.slice(`${ORIGIN}/login?`.length));
    expect(params.get(LOGOUT_REDIRECT_QUERY.PARAM)).toBe(LOGOUT_REDIRECT_QUERY.SUCCESS);
    expect(params.get(LOGIN_RETURN_URL_PARAM)).toBe('/admin/clients?tab=2');
  });
});
