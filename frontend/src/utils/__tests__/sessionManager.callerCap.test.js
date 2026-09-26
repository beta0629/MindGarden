/**
 * current-user 가 끝나지 않아도 checkSession 호출자는 상한 시간 뒤에 풀린다.
 * 로그인 버튼의 '처리중'이 in-flight 세션 확인에 고정되지 않게 하기 위함.
 */
import { sessionManager } from '../sessionManager';
import { SESSION_CHECK_CALLER_CAP_MS } from '../../constants/session';
import { redirectToLoginPageOnce } from '../sessionRedirect';

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

describe('sessionManager.checkSession caller cap', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.useFakeTimers();
    sessionManager.user = { id: 1, role: 'ADMIN', tenantId: 'tenant-a' };
    sessionManager.sessionInfo = null;
    sessionManager.lastCheckTime = 0;
    sessionManager.inflightCheckPromise = null;
    sessionManager.checkInProgress = false;
    sessionManager.isFormSubmitting = false;
    sessionManager.isProfileEditing = false;
    delete window.location;
    window.location = {
      ...originalLocation,
      hostname: 'mindgarden.example.com',
      pathname: '/admin/dashboard',
      origin: 'https://mindgarden.example.com'
    };
    global.fetch = jest.fn(() => new Promise(() => {}));
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
    window.location = originalLocation;
  });

  test('hung current-user releases the caller at the cap and does not redirect', async() => {
    const pending = sessionManager.checkSession(true);
    jest.advanceTimersByTime(SESSION_CHECK_CALLER_CAP_MS);
    // setUser 만으로 true 가 되면 안 됨 — current-user 성공 전엔 false
    await expect(pending).resolves.toBe(false);
    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
    expect(sessionManager.user).toEqual({ id: 1, role: 'ADMIN', tenantId: 'tenant-a' });
  });
});
