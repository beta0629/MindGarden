import {
  buildWebReachabilityUrl,
  isReachabilityHttpSuccess,
} from '../webNetInfoReachabilityPolicy';

describe('webNetInfoReachabilityPolicy', () => {
  it('builds API current-user reachability URL (not Metro /)', () => {
    expect(buildWebReachabilityUrl('https://mindgarden.dev.core-solution.co.kr')).toBe(
      'https://mindgarden.dev.core-solution.co.kr/api/v1/auth/current-user',
    );
    expect(buildWebReachabilityUrl('https://example.test/')).toBe(
      'https://example.test/api/v1/auth/current-user',
    );
  });

  it('treats any HTTP status as transport success; rejects non-status', () => {
    expect(isReachabilityHttpSuccess(200)).toBe(true);
    expect(isReachabilityHttpSuccess(401)).toBe(true);
    expect(isReachabilityHttpSuccess(404)).toBe(true);
    expect(isReachabilityHttpSuccess(0)).toBe(false);
    expect(isReachabilityHttpSuccess(Number.NaN)).toBe(false);
  });
});
