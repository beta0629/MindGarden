/**
 * ajax.js `checkSessionAndRedirect` 가 sessionManager.checkSession dedup 을 활용하는지 검증.
 *
 * <p>B6 묶음 A (2026-06-12): 동시 다발 401/403 시 verify 용 `/api/v1/auth/current-user` fetch 가
 * 중복 발사되던 회귀를 막는다. 본 테스트는 ajax.js 가 verify 직접 fetch 를 더 이상 수행하지 않고
 * sessionManager.checkSession(true) 단일 경로로 위임함을 단언한다.</p>
 *
 * <p>대상 행동:
 * <ul>
 *   <li>로컬 환경에서는 sessionManager 호출 없이 401 silent null 반환</li>
 *   <li>비공개 페이지 401: sessionManager.checkSession(true) 1회 호출 (verify 직접 fetch 없음)</li>
 *   <li>동시 다발 401(N=5): verify 용 `/auth/current-user` fetch 가 발생하지 않는다</li>
 * </ul>
 * </p>
 */

jest.mock('../sessionManager', () => {
  const checkSession = jest.fn();
  return {
    sessionManager: {
      checkSession
    },
    __esModule: true
  };
});

jest.mock('../networkErrorUtils', () => ({
  isTransientNetworkError: jest.fn(() => false),
  notifyTransientNetworkIssue: jest.fn()
}));

jest.mock('../sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn()
}));

const setLocation = ({ hostname, pathname = '/dashboard' }) => {
  Object.defineProperty(window, 'location', {
    value: {
      ...window.location,
      hostname,
      pathname
    },
    writable: true,
    configurable: true
  });
};

const build401Response = () => ({
  ok: false,
  status: 401,
  headers: { get: () => 'application/json' },
  text: async() => '{}',
  json: async() => ({})
});

describe('ajax.checkSessionAndRedirect (B6 묶음 A dedup)', () => {
  let sessionManagerMock;
  let ajaxModule;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    sessionManagerMock = require('../sessionManager').sessionManager;
    ajaxModule = require('../ajax');
  });

  it('로컬 환경(127.0.0.1)에서는 sessionManager.checkSession 을 호출하지 않는다', async() => {
    setLocation({ hostname: '127.0.0.1' });
    global.fetch = jest.fn().mockResolvedValueOnce(build401Response());

    const result = await ajaxModule.apiGet('/api/v1/dummy');

    expect(result).toBeNull();
    expect(sessionManagerMock.checkSession).not.toHaveBeenCalled();
    // 또한 verify 용 current-user fetch 도 없어야 한다.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toContain('/api/v1/dummy');
    expect(global.fetch.mock.calls[0][0]).not.toContain('/auth/current-user');
  });

  it('비공개 페이지 401: sessionManager.checkSession(true) 1회 호출 + verify 직접 fetch 없음', async() => {
    setLocation({
      hostname: 'admin.mindgarden.dev.core-solution.co.kr',
      pathname: '/dashboard'
    });
    sessionManagerMock.checkSession.mockResolvedValue(false);
    global.fetch = jest.fn().mockResolvedValueOnce(build401Response());

    const result = await ajaxModule.apiGet('/api/v1/admin/anything');

    expect(result).toBeNull();
    expect(sessionManagerMock.checkSession).toHaveBeenCalledTimes(1);
    expect(sessionManagerMock.checkSession).toHaveBeenCalledWith(true);
    // ajax.js 에서 verify 용 /auth/current-user 직접 fetch 가 발생하지 않아야 한다.
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).not.toContain('/auth/current-user');
  });

  it('비공개 페이지 401 + sessionManager(true=세션 유효) → 권한 분기로 null 반환, 추가 fetch 없음', async() => {
    setLocation({
      hostname: 'admin.mindgarden.dev.core-solution.co.kr',
      pathname: '/dashboard'
    });
    sessionManagerMock.checkSession.mockResolvedValue(true);
    global.fetch = jest.fn().mockResolvedValueOnce(build401Response());

    const result = await ajaxModule.apiGet('/api/v1/admin/anything');

    expect(result).toBeNull();
    expect(sessionManagerMock.checkSession).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('동시 다발 401(N=5): ajax 내부에서 verify 용 current-user fetch 가 추가로 발생하지 않는다', async() => {
    setLocation({
      hostname: 'admin.mindgarden.dev.core-solution.co.kr',
      pathname: '/dashboard'
    });

    let resolveCheck;
    const pending = new Promise((resolve) => {
      resolveCheck = resolve;
    });
    // 동시 호출 시 sessionManager 자체 in-flight promise 공유 모사: 모든 호출이 같은 promise.
    sessionManagerMock.checkSession.mockReturnValue(pending);

    global.fetch = jest.fn().mockImplementation(() => Promise.resolve(build401Response()));

    const calls = [];
    for (let i = 0; i < 5; i += 1) {
      calls.push(ajaxModule.apiGet(`/api/v1/admin/anything-${i}`));
    }
    // 응답이 도착해 checkSessionAndRedirect await 단계로 진입하도록 microtask flush.
    await Promise.resolve();
    await Promise.resolve();
    resolveCheck(false);
    await Promise.all(calls);

    // 핵심: ajax.js 에서 verify 용 /api/v1/auth/current-user fetch 가 더 이상 발생하지 않는다.
    expect(global.fetch).toHaveBeenCalledTimes(5);
    global.fetch.mock.calls.forEach(([url]) => {
      expect(url).not.toContain('/auth/current-user');
    });
    // sessionManager 는 호출되었다 (실제 in-flight dedup 은 sessionManager 내부에서 보장).
    expect(sessionManagerMock.checkSession).toHaveBeenCalled();
  });
});
