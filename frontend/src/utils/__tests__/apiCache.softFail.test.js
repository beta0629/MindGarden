/**
 * apiCache.cachedApiCall — soft-fail URL 은 401 시 redirect 하지 않음
 */
import { SESSION_KEYS } from '../../constants/session';

jest.mock('../sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn().mockReturnValue(true)
}));

jest.mock('../apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({
    'Content-Type': 'application/json',
    Authorization: 'Bearer test-token'
  }))
}));

jest.mock('../networkErrorUtils', () => ({
  isTransientNetworkError: jest.fn(() => false),
  notifyTransientNetworkIssue: jest.fn()
}));

describe('cachedApiCall soft-fail', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    localStorage.setItem(SESSION_KEYS.ACCESS_TOKEN, 'test-token');
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
    localStorage.removeItem(SESSION_KEYS.ACCESS_TOKEN);
  });

  it('common-codes 401 이면 throw 하되 redirectToLoginPageOnce 호출 안 함', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    const { getDefaultApiHeaders } = require('../apiHeaders');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    const { cachedApiCall, clearAllCache } = await import('../apiCache');
    clearAllCache();

    await expect(
      cachedApiCall('/api/v1/common-codes?codeGroup=NOTIFICATION_TYPE', {}, 1000)
    ).rejects.toThrow(/HTTP 401/);

    expect(redirectToLoginPageOnce).not.toHaveBeenCalled();
    expect(getDefaultApiHeaders).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/common-codes?codeGroup=NOTIFICATION_TYPE',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    );
  });

  it('비 soft-fail URL 401 이면 redirect', async () => {
    const { redirectToLoginPageOnce } = require('../sessionRedirect');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    const { cachedApiCall, clearAllCache } = await import('../apiCache');
    clearAllCache();

    await expect(
      cachedApiCall('/api/v1/admin/consultants', {}, 1000)
    ).rejects.toThrow(/HTTP 401/);

    expect(redirectToLoginPageOnce).toHaveBeenCalled();
  });
});
