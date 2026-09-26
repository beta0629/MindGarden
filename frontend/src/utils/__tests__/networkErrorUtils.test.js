import { API_ERROR_MESSAGES, API_STATUS } from '../../constants/api';
import { isTransientNetworkError } from '../networkErrorUtils';

describe('networkErrorUtils', () => {
  test('isTransientNetworkError: Failed to fetch TypeError', () => {
    const err = new TypeError('Failed to fetch');
    expect(isTransientNetworkError(err)).toBe(true);
  });

  test('isTransientNetworkError: AbortError', () => {
    const err = { name: 'AbortError', message: 'Aborted' };
    expect(isTransientNetworkError(err)).toBe(true);
  });

  test('isTransientNetworkError: AbortSignal.timeout TimeoutError', () => {
    const err = { name: 'TimeoutError', message: 'signal timed out' };
    expect(isTransientNetworkError(err)).toBe(true);
  });

  test('isTransientNetworkError: non-network Error', () => {
    expect(isTransientNetworkError(new Error('parse'))).toBe(false);
    expect(isTransientNetworkError(null)).toBe(false);
  });

  test('isTransientNetworkError: HTTP 5xx 는 transient 아님', () => {
    expect(isTransientNetworkError({
      status: API_STATUS.INTERNAL_SERVER_ERROR,
      message: API_ERROR_MESSAGES.SERVER_ERROR
    })).toBe(false);
    expect(isTransientNetworkError({
      status: 502,
      message: API_ERROR_MESSAGES.NETWORK_ERROR
    })).toBe(false);
    expect(isTransientNetworkError({
      status: 503,
      name: 'TypeError',
      message: 'Failed to fetch'
    })).toBe(false);
  });
});
