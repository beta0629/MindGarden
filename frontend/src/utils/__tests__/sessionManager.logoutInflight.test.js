/**
 * sessionManager — 서버 logout POST in-flight / 사이클 멱등.
 * logout() 성공 후 postLogoutInvalidateServerSession 이 두 번째 POST 를 내지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-22
 */

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
    getCurrentLocationReturnUrl: jest.fn(() => '/admin/clients')
  };
});

import { SESSION_LOGOUT_REASON } from '../../constants/session';
import sessionManager from '../sessionManager';

const ORIGIN = 'http://localhost';
const LOGOUT_URL_SNIPPET = '/api/v1/auth/logout';

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

const countLogoutFetches = (fetchMock) => fetchMock.mock.calls.filter((call) => {
  const url = typeof call[0] === 'string' ? call[0] : (call[0]?.url || '');
  return typeof url === 'string' && url.includes(LOGOUT_URL_SNIPPET);
}).length;

describe('sessionManager logout in-flight / 사이클 멱등', () => {
  beforeEach(() => {
    originalLocation = window.location;
    originalFetch = global.fetch;
    setLocation('/admin/dashboard');
    window.sessionStorage.clear();
    sessionManager._resetServerLogoutCycle();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, statusText: 'OK' });
    jest.spyOn(sessionManager, 'setPostLogoutGateBeforeRedirect').mockImplementation(() => {
      try {
        window.sessionStorage.setItem('mg_post_logout', '1');
        if (sessionManager._logoutCompletedOk) {
          window.sessionStorage.setItem('mg_logout_server_ok', '1');
        }
      } catch {
        /* noop */
      }
    });
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

  it('A) 수동 logout() 성공 후 invalidate → logout POST 총 1회', async() => {
    await sessionManager.logout();
    await sessionManager.postLogoutInvalidateServerSession();
    expect(countLogoutFetches(global.fetch)).toBe(1);
  });

  it('B) SESSION_EXPIRY logout 성공 후 invalidate → logout POST 총 1회', async() => {
    await sessionManager.logout({
      preserveReturnPath: true,
      reason: SESSION_LOGOUT_REASON.SESSION_EXPIRY
    });
    await sessionManager.postLogoutInvalidateServerSession();
    expect(countLogoutFetches(global.fetch)).toBe(1);
  });

  it('C) logout() 실패(!ok) 후 invalidate → 추가 POST 1회(총 2)', async() => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Error' })
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' });

    await sessionManager.logout();
    await sessionManager.postLogoutInvalidateServerSession();
    expect(countLogoutFetches(global.fetch)).toBe(2);
  });

  it('C2) logout() fetch reject 후 invalidate → 추가 POST 1회(총 2)', async() => {
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK' });

    await sessionManager.logout();
    await sessionManager.postLogoutInvalidateServerSession();
    expect(countLogoutFetches(global.fetch)).toBe(2);
  });

  it('D) 동시 logout() 이중 호출 → in-flight 로 POST 1회', async() => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    global.fetch = jest.fn().mockReturnValue(fetchPromise);

    const p1 = sessionManager.logout();
    const p2 = sessionManager.logout();

    // purge await 후 fetch 가 걸린 뒤에, 아직 resolve 전(완료 플래그 없음)인지 확인
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (countLogoutFetches(global.fetch) >= 1 || Date.now() - started > 2000) {
          resolve();
          return;
        }
        setTimeout(tick, 0);
      };
      tick();
    });
    expect(countLogoutFetches(global.fetch)).toBe(1);
    expect(sessionManager._logoutCompletedOk).toBe(false);
    expect(sessionManager._logoutInFlight).not.toBeNull();

    resolveFetch({ ok: true, status: 200, statusText: 'OK' });
    await Promise.all([p1, p2]);
    expect(countLogoutFetches(global.fetch)).toBe(1);
    expect(sessionManager._logoutCompletedOk).toBe(true);
  });

  it('리다이렉트 후 싱글톤 재생성 시에도 persisted OK 로 invalidate POST 스킵', async() => {
    await sessionManager.logout();
    expect(sessionManager._logoutCompletedOk).toBe(true);
    expect(window.sessionStorage.getItem('mg_logout_server_ok')).toBe('1');

    // location.replace 이후 모듈 재생성과 동일하게 메모리만 리셋하고 storage 는 유지
    sessionManager._logoutCompletedOk = false;
    sessionManager._logoutInFlight = null;
    sessionManager._logoutCompletedOk = sessionManager._readPersistedLogoutServerOk();

    await sessionManager.postLogoutInvalidateServerSession();
    expect(countLogoutFetches(global.fetch)).toBe(1);
  });

  it('setUser 성공 시 사이클 리셋 → 다음 logout 이 다시 POST', async() => {
    await sessionManager.logout();
    expect(countLogoutFetches(global.fetch)).toBe(1);

    sessionManager.setUser({ id: 1, name: 'u' });
    expect(sessionManager._logoutCompletedOk).toBe(false);

    await sessionManager.logout();
    expect(countLogoutFetches(global.fetch)).toBe(2);
  });
});
