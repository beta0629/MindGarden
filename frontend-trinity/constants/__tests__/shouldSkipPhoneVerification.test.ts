import {
  isTrinityDevPhoneSkipHostname,
  shouldSkipPhoneVerification,
} from '../trinity';

describe('shouldSkipPhoneVerification', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SKIP_PHONE_VERIFICATION;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SKIP_PHONE_VERIFICATION;
    } else {
      process.env.NEXT_PUBLIC_SKIP_PHONE_VERIFICATION = originalEnv;
    }
  });

  it('dev hostnames are always skip targets', () => {
    expect(isTrinityDevPhoneSkipHostname('dev.e-trinity.co.kr')).toBe(true);
    expect(isTrinityDevPhoneSkipHostname('apply.dev.e-trinity.co.kr')).toBe(true);
    expect(isTrinityDevPhoneSkipHostname('localhost')).toBe(true);
    expect(isTrinityDevPhoneSkipHostname('apply.e-trinity.co.kr')).toBe(false);
  });

  it('returns true when env is true (build-time skip)', () => {
    process.env.NEXT_PUBLIC_SKIP_PHONE_VERIFICATION = 'true';
    expect(shouldSkipPhoneVerification()).toBe(true);
  });

  it('returns false when env is false and no dev hostname (node test env)', () => {
    process.env.NEXT_PUBLIC_SKIP_PHONE_VERIFICATION = 'false';
    expect(shouldSkipPhoneVerification()).toBe(false);
  });
});
