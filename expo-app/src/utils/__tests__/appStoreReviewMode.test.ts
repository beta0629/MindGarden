/**
 * appStoreReviewMode — App Store 심사 게이트
 */
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

import {
  isAppStoreReviewMode,
  isCommunityFeatureVisible,
} from '@/config/appStoreReviewMode';
import { APP_STORE_EULA_COPY } from '@/constants/appStoreEulaCopy';

describe('isAppStoreReviewMode', () => {
  const ORIGINAL = process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE;
    } else {
      process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE = ORIGINAL;
    }
  });

  test('env 미설정 → false (커뮤니티 노출)', () => {
    delete process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE;
    expect(isAppStoreReviewMode()).toBe(false);
    expect(isCommunityFeatureVisible()).toBe(true);
  });

  test('env=1 → true (커뮤니티 숨김)', () => {
    process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE = '1';
    expect(isAppStoreReviewMode()).toBe(true);
    expect(isCommunityFeatureVisible()).toBe(false);
  });

  test('env=true → true', () => {
    process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE = 'true';
    expect(isAppStoreReviewMode()).toBe(true);
  });

  test('env=0 → false', () => {
    process.env.EXPO_PUBLIC_APP_STORE_REVIEW_MODE = '0';
    expect(isAppStoreReviewMode()).toBe(false);
    expect(isCommunityFeatureVisible()).toBe(true);
  });
});

describe('APP_STORE_EULA_COPY', () => {
  test('zero tolerance · 18+ 문구 포함', () => {
    expect(APP_STORE_EULA_COPY.AGE_RATING_NOTE).toMatch(/18\+/);
    expect(APP_STORE_EULA_COPY.ZERO_TOLERANCE_BODY.toLowerCase()).toMatch(/zero tolerance/);
    expect(APP_STORE_EULA_COPY.ZERO_TOLERANCE_BODY).toMatch(/무관용/);
    expect(APP_STORE_EULA_COPY.ZERO_TOLERANCE_BODY).toMatch(/불쾌|학대/);
  });
});
