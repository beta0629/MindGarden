/**
 * StandardizedApi → ajax 오류 문구 — 응답이 있으면 서버 message(없으면 status 문구),
 * 응답이 없을 때만 네트워크 문구.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { API_ERROR_MESSAGES, API_STATUS } from '../../constants/api';

jest.mock('../sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn().mockReturnValue(true)
}));

jest.mock('../authTokenRefresh', () => ({
  refreshAccessTokenPair: jest.fn().mockResolvedValue(null),
  shouldSkipTokenRefreshOn401: jest.fn().mockReturnValue(true)
}));

jest.mock('../apiHeaders', () => ({
  getDefaultApiHeaders: jest.fn(() => ({ 'Content-Type': 'application/json' })),
  getDefaultApiHeadersAsync: jest.fn(async() => ({ 'Content-Type': 'application/json' }))
}));

jest.mock('../csrfTokenManager', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    getToken: jest.fn()
  }
}));

// eslint-disable-next-line import/first
import csrfTokenManager from '../csrfTokenManager';
// eslint-disable-next-line import/first
import { getDefaultApiHeaders, getDefaultApiHeadersAsync } from '../apiHeaders';
// eslint-disable-next-line import/first
import { shouldSkipTokenRefreshOn401 } from '../authTokenRefresh';
// eslint-disable-next-line import/first
import StandardizedApi from '../standardizedApi';

const SALARY_ENDPOINT = '/api/v1/admin/salary/pre-confirm-warning';
const CONFLICT_MESSAGE = '이미 확정된 급여 계산이 있어 다시 계산할 수 없습니다.';

const jsonResponse = (status, body) => {
  const text = body === undefined ? '' : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    headers: { get: () => 'application/json' },
    text: async() => text,
    json: async() => JSON.parse(text)
  };
};

const htmlResponse = (status) => ({
  ok: false,
  status,
  statusText: '',
  headers: { get: () => 'text/html' },
  text: async() => '<html>bad gateway</html>',
  json: async() => {
    throw new SyntaxError('Unexpected token <');
  }
});

const networkFailure = () => new TypeError('Failed to fetch');

const captureError = async(promise) => {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error('오류가 발생해야 합니다');
};

describe('StandardizedApi 오류 문구 — HTTP 응답 vs 네트워크', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn();
    getDefaultApiHeaders.mockImplementation(() => ({ 'Content-Type': 'application/json' }));
    getDefaultApiHeadersAsync.mockImplementation(async() => ({ 'Content-Type': 'application/json' }));
    shouldSkipTokenRefreshOn401.mockReturnValue(true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('GET 409 + message → 서버 message 를 그대로 보여 준다 (네트워크 문구 아님)', async() => {
    global.fetch.mockResolvedValue(jsonResponse(API_STATUS.CONFLICT, { success: false, message: CONFLICT_MESSAGE }));
    const err = await captureError(StandardizedApi.get(SALARY_ENDPOINT, { consultantId: 7 }));
    expect(err.message).toBe(CONFLICT_MESSAGE);
    expect(err.status).toBe(API_STATUS.CONFLICT);
    expect(err.response.data.message).toBe(CONFLICT_MESSAGE);
    expect(err.message).not.toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('POST 409 + message → 서버 message', async() => {
    csrfTokenManager.post.mockResolvedValue(jsonResponse(API_STATUS.CONFLICT, { success: false, message: CONFLICT_MESSAGE }));
    const err = await captureError(StandardizedApi.post('/api/v1/admin/salary/recalculate', { id: 1 }));
    expect(err.message).toBe(CONFLICT_MESSAGE);
    expect(err.status).toBe(API_STATUS.CONFLICT);
  });

  test('PUT·DELETE 409 + data.message(ApiResponse 래퍼) → 서버 message', async() => {
    const wrapped = { success: false, data: { message: CONFLICT_MESSAGE } };
    csrfTokenManager.put.mockResolvedValue(jsonResponse(API_STATUS.CONFLICT, wrapped));
    csrfTokenManager.delete.mockResolvedValue(jsonResponse(API_STATUS.CONFLICT, wrapped));
    const putErr = await captureError(StandardizedApi.put('/api/v1/admin/x', {}));
    const delErr = await captureError(StandardizedApi.delete('/api/v1/admin/x'));
    expect(putErr.message).toBe(CONFLICT_MESSAGE);
    expect(delErr.message).toBe(CONFLICT_MESSAGE);
  });

  test('GET 500 message 없음 → 서버 오류 문구 (네트워크 문구 아님)', async() => {
    global.fetch.mockResolvedValue(jsonResponse(API_STATUS.INTERNAL_SERVER_ERROR, { success: false }));
    const err = await captureError(StandardizedApi.get(SALARY_ENDPOINT));
    expect(err.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    expect(err.status).toBe(API_STATUS.INTERNAL_SERVER_ERROR);
  });

  test('POST 500 빈 본문 · 502 HTML 본문 → 서버 오류 문구', async() => {
    csrfTokenManager.post.mockResolvedValueOnce(jsonResponse(API_STATUS.INTERNAL_SERVER_ERROR));
    const emptyErr = await captureError(StandardizedApi.post('/api/v1/admin/x', {}));
    expect(emptyErr.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);

    csrfTokenManager.post.mockResolvedValueOnce(htmlResponse(502));
    const htmlErr = await captureError(StandardizedApi.post('/api/v1/admin/x', {}));
    expect(htmlErr.message).toBe(API_ERROR_MESSAGES.SERVER_ERROR);
    expect(htmlErr.status).toBe(502);
  });

  test('GET 400(테넌트 무관) message 없음 → 요청 실패 문구', async() => {
    global.fetch.mockResolvedValue(jsonResponse(API_STATUS.BAD_REQUEST, {}));
    const err = await captureError(StandardizedApi.get('/api/v1/admin/x'));
    expect(err.message).not.toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
    expect(err.status).toBe(API_STATUS.BAD_REQUEST);
  });

  test('응답 없음(fetch 실패) → 네트워크 문구 · status 없음', async() => {
    global.fetch.mockRejectedValue(networkFailure());
    const getErr = await captureError(StandardizedApi.get(SALARY_ENDPOINT));
    expect(getErr.message).toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
    expect(getErr.status).toBeUndefined();
    expect(getErr.isNetworkError).toBe(true);

    csrfTokenManager.post.mockRejectedValue(networkFailure());
    const postErr = await captureError(StandardizedApi.post('/api/v1/admin/x', {}));
    expect(postErr.message).toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
  });

  test('사용자 취소(AbortError)는 네트워크 문구로 바꾸지 않는다', async() => {
    const abort = new Error('The user aborted a request.');
    abort.name = 'AbortError';
    csrfTokenManager.post.mockRejectedValue(abort);
    const err = await captureError(StandardizedApi.post('/api/v1/admin/x', {}));
    expect(err.name).toBe('AbortError');
    expect(err.message).not.toBe(API_ERROR_MESSAGES.NETWORK_ERROR);
  });
});
