/**
 * googleSignIn — `@react-native-google-signin/google-signin` Native SDK 래퍼 단위 테스트.
 *
 * <p>**Build #16 (2026-06-10) — Native SDK 마이그레이션 (P0)**: 기존 PKCE / `useAuthRequest`
 * 흐름 제거 후 본 테스트는 다음을 검증한다:</p>
 *
 *  - `resolveGoogleClientIdConfig()` — env > extra 우선순위 (web/ios)
 *  - `isGoogleNativeConfigured()` — webClientId 가 usable 일 때만 true
 *  - `signInWithGoogle()` — success / cancelled / error / play-services / token-fallback
 *  - `mapNativeUser` 분기 (이름·이메일·photo 정규화) — signInWithGoogle 결과로 간접 검증
 *
 * @author MindGarden
 * @since 2026-06-10
 */

import Constants from 'expo-constants';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import {
  __resetGoogleSignInConfiguredForTests,
  isGoogleNativeConfigured,
  resolveGoogleClientIdConfig,
  signInWithGoogle,
} from '../googleSignIn';

jest.mock('@react-native-google-signin/google-signin', () => {
  const fakeStatusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
  };
  return {
    __esModule: true,
    GoogleSignin: {
      configure: jest.fn(),
      hasPlayServices: jest.fn().mockResolvedValue(true),
      signIn: jest.fn(),
      getTokens: jest.fn(),
      signOut: jest.fn().mockResolvedValue(null),
    },
    statusCodes: fakeStatusCodes,
    isSuccessResponse: jest.fn((res: { type?: string }) => res?.type === 'success'),
    isCancelledResponse: jest.fn((res: { type?: string }) => res?.type === 'cancelled'),
    isErrorWithCode: jest.fn((e: unknown): e is { code: string } =>
      Boolean(e && typeof e === 'object' && 'code' in (e as Record<string, unknown>)),
    ),
  };
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

type MutableConstants = {
  expoConfig: { extra: { googleClientId?: { web?: string; ios?: string; android?: string } } };
};

const REAL_WEB_CLIENT_ID = '1111111111-webwebweb.apps.googleusercontent.com';
const REAL_IOS_CLIENT_ID = '1234567890-abcdefgh.apps.googleusercontent.com';

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

const signInMock = GoogleSignin.signIn as unknown as jest.Mock;
const getTokensMock = GoogleSignin.getTokens as unknown as jest.Mock;
const hasPlayServicesMock = GoogleSignin.hasPlayServices as unknown as jest.Mock;
const configureMock = GoogleSignin.configure as unknown as jest.Mock;
const isSuccessResponseMock = isSuccessResponse as unknown as jest.Mock;
const isCancelledResponseMock = isCancelledResponse as unknown as jest.Mock;
const isErrorWithCodeMock = isErrorWithCode as unknown as jest.Mock;

describe('resolveGoogleClientIdConfig — Native SDK 시점 env > extra 우선순위', () => {
  beforeEach(() => {
    clearEnv();
    clearExtra();
    __resetGoogleSignInConfiguredForTests();
  });

  test('env / extra 모두 비면 null', () => {
    expect(resolveGoogleClientIdConfig()).toBeNull();
  });

  test('env 만 있으면 env 값을 반환 (web)', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = REAL_WEB_CLIENT_ID;
    expect(resolveGoogleClientIdConfig()).toEqual({
      webClientId: REAL_WEB_CLIENT_ID,
      iosClientId: undefined,
    });
  });

  test('extra 만 있으면 extra 값을 반환', () => {
    setExtra({ web: REAL_WEB_CLIENT_ID, ios: REAL_IOS_CLIENT_ID });
    expect(resolveGoogleClientIdConfig()).toEqual({
      webClientId: REAL_WEB_CLIENT_ID,
      iosClientId: REAL_IOS_CLIENT_ID,
    });
  });

  test('env 와 extra 동시 존재 → env 가 우선', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = REAL_WEB_CLIENT_ID;
    setExtra({ web: 'fallback.web.apps.googleusercontent.com' });
    expect(resolveGoogleClientIdConfig()?.webClientId).toBe(REAL_WEB_CLIENT_ID);
  });

  test('env 공백 문자열은 미설정으로 처리 → extra 폴백', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = '   ';
    setExtra({ web: REAL_WEB_CLIENT_ID });
    expect(resolveGoogleClientIdConfig()?.webClientId).toBe(REAL_WEB_CLIENT_ID);
  });

  test('OTA env 누락 시나리오: extra 가 빈 값이어도 env 폴백으로 회복', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = REAL_WEB_CLIENT_ID;
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = REAL_IOS_CLIENT_ID;
    setExtra({ web: '', ios: '' });
    const result = resolveGoogleClientIdConfig();
    expect(result?.webClientId).toBe(REAL_WEB_CLIENT_ID);
    expect(result?.iosClientId).toBe(REAL_IOS_CLIENT_ID);
  });
});

describe('isGoogleNativeConfigured — Web Client ID 게이트', () => {
  beforeEach(() => {
    clearEnv();
    clearExtra();
    __resetGoogleSignInConfiguredForTests();
  });

  test('webClientId 미설정 → false', () => {
    expect(isGoogleNativeConfigured()).toBe(false);
  });

  test('webClientId 설정 → true', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = REAL_WEB_CLIENT_ID;
    expect(isGoogleNativeConfigured()).toBe(true);
  });

  test('webClientId placeholder → false', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'placeholder-web.apps.googleusercontent.com';
    expect(isGoogleNativeConfigured()).toBe(false);
  });

  test('webClientId your_ 템플릿 → false', () => {
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = 'your_google_web_client_id';
    expect(isGoogleNativeConfigured()).toBe(false);
  });

  test('iosClientId 만 있고 webClientId 가 없으면 false (Native SDK 는 web 필수)', () => {
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = REAL_IOS_CLIENT_ID;
    expect(isGoogleNativeConfigured()).toBe(false);
  });

  test('extra 폴백으로도 web 만 있으면 true', () => {
    setExtra({ web: REAL_WEB_CLIENT_ID });
    expect(isGoogleNativeConfigured()).toBe(true);
  });
});

describe('signInWithGoogle — Native SDK 정상 흐름', () => {
  const SAMPLE_ID_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.SampleIdToken.signature';
  const SAMPLE_ACCESS_TOKEN = 'ya29.SampleAccessToken_abcdefghij';
  const SAMPLE_USER = {
    id: 'google-user-12345',
    email: 'test@example.com',
    name: 'Test User',
    givenName: 'Test',
    familyName: 'User',
    photo: 'https://lh3.googleusercontent.com/sample',
  };

  beforeEach(() => {
    clearEnv();
    clearExtra();
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID = REAL_WEB_CLIENT_ID;
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = REAL_IOS_CLIENT_ID;
    __resetGoogleSignInConfiguredForTests();

    signInMock.mockReset();
    getTokensMock.mockReset();
    hasPlayServicesMock.mockReset().mockResolvedValue(true);
    configureMock.mockReset();
    isSuccessResponseMock
      .mockReset()
      .mockImplementation((r: { type?: string }) => r?.type === 'success');
    isCancelledResponseMock
      .mockReset()
      .mockImplementation((r: { type?: string }) => r?.type === 'cancelled');
    isErrorWithCodeMock
      .mockReset()
      .mockImplementation((e: unknown): e is { code: string } =>
        Boolean(e && typeof e === 'object' && 'code' in (e as Record<string, unknown>)),
      );
  });

  test('success 응답 + idToken 포함 → success outcome 반환 + getTokens 호출', async () => {
    signInMock.mockResolvedValueOnce({
      type: 'success',
      data: {
        idToken: SAMPLE_ID_TOKEN,
        serverAuthCode: null,
        scopes: [],
        user: SAMPLE_USER,
      },
    });
    getTokensMock.mockResolvedValueOnce({
      accessToken: SAMPLE_ACCESS_TOKEN,
      idToken: SAMPLE_ID_TOKEN,
    });

    const outcome = await signInWithGoogle();

    expect(outcome.kind).toBe('success');
    if (outcome.kind === 'success') {
      expect(outcome.result.idToken).toBe(SAMPLE_ID_TOKEN);
      expect(outcome.result.accessToken).toBe(SAMPLE_ACCESS_TOKEN);
      expect(outcome.result.user.email).toBe(SAMPLE_USER.email);
      expect(outcome.result.user.name).toBe(SAMPLE_USER.name);
      expect(outcome.result.user.id).toBe(SAMPLE_USER.id);
    }
    expect(configureMock).toHaveBeenCalledTimes(1);
    expect(configureMock).toHaveBeenCalledWith(
      expect.objectContaining({ webClientId: REAL_WEB_CLIENT_ID, iosClientId: REAL_IOS_CLIENT_ID }),
    );
  });

  test('idToken 누락 → getTokens 가 idToken 보강 시 success', async () => {
    signInMock.mockResolvedValueOnce({
      type: 'success',
      data: {
        idToken: null,
        serverAuthCode: null,
        scopes: [],
        user: SAMPLE_USER,
      },
    });
    getTokensMock.mockResolvedValueOnce({
      accessToken: SAMPLE_ACCESS_TOKEN,
      idToken: SAMPLE_ID_TOKEN,
    });

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('success');
    if (outcome.kind === 'success') {
      expect(outcome.result.idToken).toBe(SAMPLE_ID_TOKEN);
      expect(outcome.result.accessToken).toBe(SAMPLE_ACCESS_TOKEN);
    }
  });

  test('idToken 누락 + getTokens 도 idToken 미반환 → error outcome', async () => {
    signInMock.mockResolvedValueOnce({
      type: 'success',
      data: {
        idToken: null,
        serverAuthCode: null,
        scopes: [],
        user: SAMPLE_USER,
      },
    });
    getTokensMock.mockResolvedValueOnce({
      accessToken: SAMPLE_ACCESS_TOKEN,
      idToken: '',
    });

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('error');
    if (outcome.kind === 'error') {
      expect(outcome.message).toMatch(/idToken/);
    }
  });

  test('getTokens 실패해도 SDK idToken 이 있으면 success (accessToken 만 null)', async () => {
    signInMock.mockResolvedValueOnce({
      type: 'success',
      data: {
        idToken: SAMPLE_ID_TOKEN,
        serverAuthCode: null,
        scopes: [],
        user: SAMPLE_USER,
      },
    });
    getTokensMock.mockRejectedValueOnce(new Error('network'));

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('success');
    if (outcome.kind === 'success') {
      expect(outcome.result.idToken).toBe(SAMPLE_ID_TOKEN);
      expect(outcome.result.accessToken).toBeNull();
    }
  });

  test('cancelled 응답 → cancel outcome', async () => {
    signInMock.mockResolvedValueOnce({ type: 'cancelled', data: null });

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('cancel');
  });

  test('SDK 가 SIGN_IN_CANCELLED 코드로 throw → cancel outcome', async () => {
    signInMock.mockRejectedValueOnce({ code: statusCodes.SIGN_IN_CANCELLED });

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('cancel');
  });

  test('SDK 가 IN_PROGRESS 코드로 throw → error outcome (debounce 안내)', async () => {
    signInMock.mockRejectedValueOnce({ code: statusCodes.IN_PROGRESS });

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('error');
    if (outcome.kind === 'error') {
      expect(outcome.message).toMatch(/이미 진행 중/);
    }
  });

  test('hasPlayServices 가 PLAY_SERVICES_NOT_AVAILABLE 으로 throw → error outcome', async () => {
    hasPlayServicesMock.mockRejectedValueOnce({
      code: statusCodes.PLAY_SERVICES_NOT_AVAILABLE,
    });

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('error');
    if (outcome.kind === 'error') {
      expect(outcome.message).toMatch(/Play/);
    }
    // Play Services 검사가 실패하면 signIn 은 호출되지 않는다.
    expect(signInMock).not.toHaveBeenCalled();
  });

  test('webClientId 가 비어 있으면 notConfigured outcome (signIn 호출 없음)', async () => {
    delete process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    __resetGoogleSignInConfiguredForTests();

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('notConfigured');
    expect(signInMock).not.toHaveBeenCalled();
    expect(configureMock).not.toHaveBeenCalled();
  });

  test('configure 는 한 번만 호출 (가드)', async () => {
    signInMock.mockResolvedValue({
      type: 'success',
      data: {
        idToken: SAMPLE_ID_TOKEN,
        serverAuthCode: null,
        scopes: [],
        user: SAMPLE_USER,
      },
    });
    getTokensMock.mockResolvedValue({
      accessToken: SAMPLE_ACCESS_TOKEN,
      idToken: SAMPLE_ID_TOKEN,
    });

    await signInWithGoogle();
    await signInWithGoogle();
    await signInWithGoogle();

    expect(configureMock).toHaveBeenCalledTimes(1);
  });

  test('user.name 이 null 이면 givenName + familyName 합성', async () => {
    signInMock.mockResolvedValueOnce({
      type: 'success',
      data: {
        idToken: SAMPLE_ID_TOKEN,
        serverAuthCode: null,
        scopes: [],
        user: {
          id: 'gid',
          email: 'a@b.com',
          name: null,
          givenName: 'Hong',
          familyName: 'Gildong',
          photo: null,
        },
      },
    });
    getTokensMock.mockResolvedValueOnce({
      accessToken: SAMPLE_ACCESS_TOKEN,
      idToken: SAMPLE_ID_TOKEN,
    });

    const outcome = await signInWithGoogle();
    expect(outcome.kind).toBe('success');
    if (outcome.kind === 'success') {
      expect(outcome.result.user.name).toBe('Hong Gildong');
    }
  });
});
