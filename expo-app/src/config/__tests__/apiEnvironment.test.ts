/**
 * shouldShowApiEnvironmentBanner — HIDE_ENV_BANNER 플래그·기존 호스트 규칙
 *
 * @author MindGarden
 * @since 2026-11-10
 */
import { getApiBaseUrl } from '@/config/apiBaseUrl';
import { shouldShowApiEnvironmentBanner } from '@/config/apiEnvironment';

jest.mock('@/config/apiBaseUrl', () => ({
  getApiBaseUrl: jest.fn(() => 'https://app.core-solution.co.kr'),
}));

const mockGetApiBaseUrl = getApiBaseUrl as jest.MockedFunction<typeof getApiBaseUrl>;

describe('shouldShowApiEnvironmentBanner', () => {
  const originalHideEnvBanner = process.env.EXPO_PUBLIC_HIDE_ENV_BANNER;
  const originalDev = (globalThis as unknown as { __DEV__?: boolean }).__DEV__;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_HIDE_ENV_BANNER;
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    mockGetApiBaseUrl.mockReset();
    mockGetApiBaseUrl.mockReturnValue('https://app.core-solution.co.kr');
  });

  afterEach(() => {
    if (originalHideEnvBanner === undefined) {
      delete process.env.EXPO_PUBLIC_HIDE_ENV_BANNER;
    } else {
      process.env.EXPO_PUBLIC_HIDE_ENV_BANNER = originalHideEnvBanner;
    }
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = Boolean(originalDev);
  });

  it('EXPO_PUBLIC_HIDE_ENV_BANNER=1 + __DEV__=true → false (OFF)', () => {
    process.env.EXPO_PUBLIC_HIDE_ENV_BANNER = '1';
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;
    expect(shouldShowApiEnvironmentBanner()).toBe(false);
  });

  it('EXPO_PUBLIC_HIDE_ENV_BANNER=1 + __DEV__=false + 비운영 호스트 → false (OFF)', () => {
    process.env.EXPO_PUBLIC_HIDE_ENV_BANNER = '1';
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    mockGetApiBaseUrl.mockReturnValue('https://dev.core-solution.co.kr');
    expect(shouldShowApiEnvironmentBanner()).toBe(false);
  });

  it('플래그 미설정 + __DEV__=true → true (기존)', () => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;
    expect(shouldShowApiEnvironmentBanner()).toBe(true);
  });

  it('플래그 0 + __DEV__=false + 비운영 호스트 → true (기존)', () => {
    process.env.EXPO_PUBLIC_HIDE_ENV_BANNER = '0';
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    mockGetApiBaseUrl.mockReturnValue('https://dev.core-solution.co.kr');
    expect(shouldShowApiEnvironmentBanner()).toBe(true);
  });

  it('플래그 미설정 + __DEV__=false + 운영 호스트 → false (기존)', () => {
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = false;
    mockGetApiBaseUrl.mockReturnValue('https://app.core-solution.co.kr');
    expect(shouldShowApiEnvironmentBanner()).toBe(false);
  });
});
