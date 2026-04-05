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

  test('isTransientNetworkError: non-network Error', () => {
    expect(isTransientNetworkError(new Error('parse'))).toBe(false);
    expect(isTransientNetworkError(null)).toBe(false);
  });
});
