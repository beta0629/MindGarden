/**
 * ajax getErrorMessage / handleError — HTTP 5xx 는 SERVER_ERROR 이며 Error.status 유지
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { API_ERROR_MESSAGES, API_STATUS } from '../../constants/api';

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

import { getErrorMessage, handleError } from '../ajax';

describe('ajax getErrorMessage / handleError', () => {
  test('getErrorMessage: 500/502/503 모두 SERVER_ERROR (NETWORK_ERROR 아님)', () => {
    expect(getErrorMessage(API_STATUS.INTERNAL_SERVER_ERROR)).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    expect(getErrorMessage(502)).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    expect(getErrorMessage(503)).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    expect(getErrorMessage(API_STATUS.INTERNAL_SERVER_ERROR)).not.toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
    expect(getErrorMessage(502)).not.toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('getErrorMessage: 401/403/404 는 기존 메시지, 그 외 4xx 는 NETWORK_ERROR', () => {
    expect(getErrorMessage(API_STATUS.UNAUTHORIZED)).toBe(API_ERROR_MESSAGES.UNAUTHORIZED);
    expect(getErrorMessage(API_STATUS.FORBIDDEN)).toBe(API_ERROR_MESSAGES.FORBIDDEN);
    expect(getErrorMessage(API_STATUS.NOT_FOUND)).toBe(API_ERROR_MESSAGES.NOT_FOUND);
    expect(getErrorMessage(API_STATUS.BAD_REQUEST)).toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('handleError: throw 한 Error 에 status 가 붙는다', () => {
    expect(() => {
      handleError(new Error('server'), API_STATUS.INTERNAL_SERVER_ERROR);
    }).toThrow(API_ERROR_MESSAGES.SERVER_ERROR);

    try {
      handleError(new Error('bad gateway'), 502);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(502);
      expect(err.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    }

    try {
      handleError(new Error('unavailable'), 503);
    } catch (err) {
      expect(err.status).toBe(503);
      expect(err.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    }
  });
});
