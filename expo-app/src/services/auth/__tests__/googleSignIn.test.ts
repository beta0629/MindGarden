/**
 * googleSignIn — `isGoogleConfiguredForPlatform()` / `resolveGoogleClientIdConfig()`
 * platform 별 가드 단위 테스트.
 *
 * P0 핫픽스 (2026-06-10) — `Google.useAuthRequest` 의 mount throw 회피를 위한 sentinel.
 *
 *  - iOS / Android / Web 각 플랫폼별 client id 존재·placeholder 판정 검증
 *  - resolveGoogleClientIdConfig: env > extra 우선순위, 모두 비면 null
 *  - isGoogleConfiguredForPlatform: 현재 플랫폼 id 가 usable 일 때만 true
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import Constants from 'expo-constants';

import { isGoogleConfiguredForPlatform, resolveGoogleClientIdConfig } from '../googleSignIn';

// `Platform.OS` 를 테스트 사이에 mutable 하게 바꾸기 위한 ref. jest.mock factory 는 hoist 되지만
// factory 실행은 require 시점이라 const 초기화 후이므로 안전하다.
const platformRef: { OS: 'ios' | 'android' | 'web' } = { OS: 'ios' };

jest.mock('react-native', () => ({
  Platform: platformRef,
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

type MutableConstants = {
  expoConfig: { extra: { googleClientId?: { web?: string; ios?: string; android?: string } } };
};

const REAL_IOS_CLIENT_ID = '1234567890-abcdefgh.apps.googleusercontent.com';
const REAL_ANDROID_CLIENT_ID = '0987654321-zyxwvuts.apps.googleusercontent.com';
const REAL_WEB_CLIENT_ID = '1111111111-webwebweb.apps.googleusercontent.com';

const ENV_KEYS = [
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
] as const;

function clearEnv(): void {
  ENV_KEYS.forEach((k) => {
    delete process.env[k];
  });
}

function clearExtra(): void {
  (Constants as unknown as MutableConstants).expoConfig.extra = {};
}

function setExtra(value: { web?: string; ios?: string; android?: string } | undefined): void {
  (Constants as unknown as MutableConstants).expoConfig.extra = value
    ? { googleClientId: value }
    : {};
}

describe('resolveGoogleClientIdConfig — env > extra 우선순위', () => {
  beforeEach(() => {
    clearEnv();
    clearExtra();
    platformRef.OS = 'ios';
  });

  test('env / extra 모두 비면 null', () => {
    expect(resolveGoogleClientIdConfig()).toBeNull();
  });

  test('env 만 있으면 env 값을 반환', () => {
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = REAL_IOS_CLIENT_ID;
    expect(resolveGoogleClientIdConfig()).toEqual({
      webClientId: undefined,
      iosClientId: REAL_IOS_CLIENT_ID,
      androidClientId: undefined,
    });
  });

  test('extra 만 있으면 extra 값을 반환', () => {
    setExtra({ ios: REAL_IOS_CLIENT_ID, android: REAL_ANDROID_CLIENT_ID });
    expect(resolveGoogleClientIdConfig()).toEqual({
      webClientId: undefined,
      iosClientId: REAL_IOS_CLIENT_ID,
      androidClientId: REAL_ANDROID_CLIENT_ID,
    });
  });

  test('env 와 extra 가 동시에 있으면 env 가 우선', () => {
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = REAL_IOS_CLIENT_ID;
    setExtra({ ios: 'fallback.ios.apps.googleusercontent.com' });
    expect(resolveGoogleClientIdConfig()?.iosClientId).toBe(REAL_IOS_CLIENT_ID);
  });

  test('env 공백 문자열은 미설정으로 처리', () => {
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '   ';
    setExtra({ ios: REAL_IOS_CLIENT_ID });
    expect(resolveGoogleClientIdConfig()?.iosClientId).toBe(REAL_IOS_CLIENT_ID);
  });
});

describe('isGoogleConfiguredForPlatform — P0 핫픽스 mount 가드 sentinel', () => {
  beforeEach(() => {
    clearEnv();
    clearExtra();
    platformRef.OS = 'ios';
  });

  test('iOS: iosClientId 없으면 false (현재 베타 빌드 시나리오)', () => {
    platformRef.OS = 'ios';
    expect(isGoogleConfiguredForPlatform()).toBe(false);
  });

  test('iOS: 실제 iosClientId 있으면 true', () => {
    platformRef.OS = 'ios';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = REAL_IOS_CLIENT_ID;
    expect(isGoogleConfiguredForPlatform()).toBe(true);
  });

  test('iOS: androidClientId 만 있고 iosClientId 가 없으면 false', () => {
    platformRef.OS = 'ios';
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = REAL_ANDROID_CLIENT_ID;
    expect(isGoogleConfiguredForPlatform()).toBe(false);
  });

  test('iOS: iosClientId 가 "placeholder..." 형태면 false', () => {
    platformRef.OS = 'ios';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'placeholder-ios.apps.googleusercontent.com';
    expect(isGoogleConfiguredForPlatform()).toBe(false);
  });

  test('iOS: iosClientId 가 "your_..." 템플릿이면 false', () => {
    platformRef.OS = 'ios';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = 'your_google_ios_client_id';
    expect(isGoogleConfiguredForPlatform()).toBe(false);
  });

  test('Android: androidClientId 있으면 true (iosClientId 부재 무관)', () => {
    platformRef.OS = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID = REAL_ANDROID_CLIENT_ID;
    expect(isGoogleConfiguredForPlatform()).toBe(true);
  });

  test('Android: androidClientId 없으면 false', () => {
    platformRef.OS = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = REAL_IOS_CLIENT_ID;
    expect(isGoogleConfiguredForPlatform()).toBe(false);
  });

  test('Android: androidClientId 가 "Placeholder..." 대소문자 혼합이어도 false', () => {
    platformRef.OS = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID =
      'Placeholder-android.apps.googleusercontent.com';
    expect(isGoogleConfiguredForPlatform()).toBe(false);
  });

  test('Web: webClientId 있으면 true', () => {
    platformRef.OS = 'web';
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = REAL_WEB_CLIENT_ID;
    expect(isGoogleConfiguredForPlatform()).toBe(true);
  });

  test('Web: webClientId 없으면 false', () => {
    platformRef.OS = 'web';
    expect(isGoogleConfiguredForPlatform()).toBe(false);
  });

  test('extra 폴백으로도 platform 별 판정이 동작', () => {
    platformRef.OS = 'ios';
    setExtra({ ios: REAL_IOS_CLIENT_ID });
    expect(isGoogleConfiguredForPlatform()).toBe(true);

    platformRef.OS = 'android';
    expect(isGoogleConfiguredForPlatform()).toBe(false);

    platformRef.OS = 'web';
    setExtra({ web: REAL_WEB_CLIENT_ID });
    expect(isGoogleConfiguredForPlatform()).toBe(true);
  });
});
