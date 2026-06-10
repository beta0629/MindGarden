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

import {
  diagnoseGoogleAuthResult,
  exchangeGooglePkceCode,
  extractGoogleAuthTokens,
  formatGoogleAuthDiagnostics,
  isGoogleConfiguredForPlatform,
  resolveGoogleClientIdConfig,
} from '../googleSignIn';
import { exchangeCodeAsync } from 'expo-auth-session';
import type { AuthSessionResult } from 'expo-auth-session';

// `Platform.OS` 를 테스트 사이에 mutable 하게 바꾸기 위해 jest.mock factory 내부에 상태를 둔다.
// 외부 선언(const/let/var) 으로 둘 경우 jest.mock 호이스트로 인한 TDZ 또는 undefined 캡처가 발생한다.
// factory 안에서 만든 객체를 그대로 Platform 으로 노출하면, 테스트가 `platformRef.OS = ...` 로
// 바꿔도 동일 참조가 유지된다.
jest.mock('react-native', () => {
  const state: { OS: 'ios' | 'android' | 'web' } = { OS: 'ios' };
  return { Platform: state };
});

// Platform mock 의 내부 상태에 대한 참조 — factory 가 만든 동일 객체를 그대로 받아 mutation 가능.
const platformRef = (
  jest.requireMock('react-native') as { Platform: { OS: 'ios' | 'android' | 'web' } }
).Platform;

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session/providers/google', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

// `expo-auth-session` 본체는 ESM 으로 publish 되어 Jest 가 transform 하지 않는다.
// `requireActual` 을 호출하면 `Unexpected token 'export'` 가 발생하므로, 사용하는 export 만
// 명시적으로 정의한 stub 으로 대체한다. exchangeCodeAsync 만 jest.fn 으로 두고 시나리오별로
// mockImplementation 한다. AccessTokenRequestConfig / TokenResponse / DiscoveryDocument 등
// 타입 export 는 런타임에는 필요하지 않다.
jest.mock('expo-auth-session', () => ({
  __esModule: true,
  exchangeCodeAsync: jest.fn(),
}));

const exchangeCodeAsyncMock = exchangeCodeAsync as unknown as jest.Mock;

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

describe('extractGoogleAuthTokens — P0 (2026-06-10) 토큰 추출 폴백', () => {
  const SAMPLE_ACCESS_TOKEN = 'ya29.SampleAccessToken_abcdefghij';
  const SAMPLE_ID_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.SampleIdToken.signature';
  const SAMPLE_SCOPE = 'openid profile email';

  function successWithAuthentication(authentication: {
    accessToken?: string;
    idToken?: string;
    scope?: string;
  }): AuthSessionResult {
    return {
      type: 'success',
      authentication: authentication as unknown as AuthSessionResult extends {
        authentication: infer A;
      }
        ? A
        : never,
      params: {},
      errorCode: null,
      error: null,
      url: 'https://auth.expo.io/redirect',
    } as unknown as AuthSessionResult;
  }

  function successWithParams(params: Record<string, string>): AuthSessionResult {
    return {
      type: 'success',
      authentication: null,
      params,
      errorCode: null,
      error: null,
      url: 'https://auth.expo.io/redirect',
    } as unknown as AuthSessionResult;
  }

  test('authentication.accessToken + idToken 둘 다 있으면 모두 반환', () => {
    const result = extractGoogleAuthTokens(
      successWithAuthentication({
        accessToken: SAMPLE_ACCESS_TOKEN,
        idToken: SAMPLE_ID_TOKEN,
        scope: SAMPLE_SCOPE,
      }),
    );
    expect(result.accessToken).toBe(SAMPLE_ACCESS_TOKEN);
    expect(result.idToken).toBe(SAMPLE_ID_TOKEN);
    expect(result.scope).toBe(SAMPLE_SCOPE);
  });

  test('authentication.idToken 만 있고 accessToken 이 없으면 idToken 만 반환 (P0 핵심)', () => {
    const result = extractGoogleAuthTokens(successWithAuthentication({ idToken: SAMPLE_ID_TOKEN }));
    expect(result.accessToken).toBeUndefined();
    expect(result.idToken).toBe(SAMPLE_ID_TOKEN);
  });

  test('authentication 이 null 이고 params.access_token 만 있어도 accessToken 추출', () => {
    const result = extractGoogleAuthTokens(
      successWithParams({ access_token: SAMPLE_ACCESS_TOKEN }),
    );
    expect(result.accessToken).toBe(SAMPLE_ACCESS_TOKEN);
    expect(result.idToken).toBeUndefined();
  });

  test('authentication 이 null 이고 params.id_token 만 있으면 idToken 만 추출 (P0 핵심)', () => {
    const result = extractGoogleAuthTokens(successWithParams({ id_token: SAMPLE_ID_TOKEN }));
    expect(result.accessToken).toBeUndefined();
    expect(result.idToken).toBe(SAMPLE_ID_TOKEN);
  });

  test('authentication 과 params 가 모두 있으면 authentication 우선', () => {
    const result = extractGoogleAuthTokens({
      type: 'success',
      authentication: { accessToken: SAMPLE_ACCESS_TOKEN } as never,
      params: { access_token: 'different-token', id_token: SAMPLE_ID_TOKEN } as Record<
        string,
        string
      >,
      errorCode: null,
      error: null,
      url: 'https://auth.expo.io/redirect',
    } as unknown as AuthSessionResult);
    expect(result.accessToken).toBe(SAMPLE_ACCESS_TOKEN);
    expect(result.idToken).toBe(SAMPLE_ID_TOKEN);
  });

  test('빈 문자열·공백 토큰은 미추출', () => {
    const result = extractGoogleAuthTokens(
      successWithAuthentication({ accessToken: '   ', idToken: '' }),
    );
    expect(result.accessToken).toBeUndefined();
    expect(result.idToken).toBeUndefined();
  });

  test('success 가 아닌 결과(cancel/dismiss/error)는 빈 객체 반환', () => {
    const cancelResult = extractGoogleAuthTokens({
      type: 'cancel',
    } as unknown as AuthSessionResult);
    expect(cancelResult).toEqual({});

    const errorResult = extractGoogleAuthTokens({
      type: 'error',
      error: new Error('OAuth failed'),
    } as unknown as AuthSessionResult);
    expect(errorResult).toEqual({});
  });

  test('토큰이 둘 다 없으면 빈 객체 반환 (호출자가 사용자 메시지 분기)', () => {
    const result = extractGoogleAuthTokens(successWithAuthentication({}));
    expect(result).toEqual({});
  });
});

describe('diagnoseGoogleAuthResult — P0 (2026-06-10) 응답 진단', () => {
  test('success + authentication.{accessToken,idToken,scope} → 키 셋 반환', () => {
    const diag = diagnoseGoogleAuthResult({
      type: 'success',
      authentication: {
        accessToken: 'redacted',
        idToken: 'redacted',
        scope: 'openid email',
      },
      params: { code: 'redacted', state: 'redacted' },
      errorCode: null,
      error: null,
      url: 'https://auth.expo.io/redirect',
    } as unknown as AuthSessionResult);
    expect(diag.type).toBe('success');
    expect([...diag.paramKeys].sort()).toEqual(['code', 'state']);
    expect([...diag.authenticationKeys].sort()).toEqual(['accessToken', 'idToken', 'scope']);
    expect(diag.hasUrl).toBe(true);
    expect(diag.errorCode).toBeUndefined();
  });

  test('success + 빈 params + null authentication → 빈 키 셋 (root cause 케이스)', () => {
    const diag = diagnoseGoogleAuthResult({
      type: 'success',
      authentication: null,
      params: {},
      errorCode: null,
      error: null,
      url: undefined,
    } as unknown as AuthSessionResult);
    expect(diag.type).toBe('success');
    expect(diag.paramKeys).toEqual([]);
    expect(diag.authenticationKeys).toEqual([]);
    expect(diag.hasUrl).toBe(false);
  });

  test('error 응답이면 errorCode 를 함께 반환', () => {
    const diag = diagnoseGoogleAuthResult({
      type: 'error',
      authentication: null,
      params: { error: 'access_denied' },
      errorCode: 'access_denied',
      error: new Error('User denied access'),
      url: null,
    } as unknown as AuthSessionResult);
    expect(diag.type).toBe('error');
    expect(diag.errorCode).toBe('access_denied');
    expect(diag.paramKeys).toEqual(['error']);
  });

  test('cancel 응답: 빈 키 셋 + url 없음', () => {
    const diag = diagnoseGoogleAuthResult({
      type: 'cancel',
    } as unknown as AuthSessionResult);
    expect(diag.type).toBe('cancel');
    expect(diag.paramKeys).toEqual([]);
    expect(diag.authenticationKeys).toEqual([]);
    expect(diag.hasUrl).toBe(false);
  });

  test('토큰 값 자체는 절대 진단 결과에 포함되지 않음 (보안)', () => {
    const diag = diagnoseGoogleAuthResult({
      type: 'success',
      authentication: { accessToken: 'TOP_SECRET_ACCESS', idToken: 'TOP_SECRET_ID' },
      params: { access_token: 'TOP_SECRET_PARAM' },
      errorCode: null,
      error: null,
      url: 'https://auth.expo.io/redirect',
    } as unknown as AuthSessionResult);
    const serialized = JSON.stringify(diag);
    expect(serialized).not.toContain('TOP_SECRET_ACCESS');
    expect(serialized).not.toContain('TOP_SECRET_ID');
    expect(serialized).not.toContain('TOP_SECRET_PARAM');
  });
});

describe('formatGoogleAuthDiagnostics — 사용자 메시지 직렬화', () => {
  test('키 모두 있을 때 사람이 읽기 쉬운 한 줄 반환', () => {
    const formatted = formatGoogleAuthDiagnostics({
      type: 'success',
      paramKeys: ['code', 'state'],
      authenticationKeys: ['accessToken', 'idToken'],
      hasUrl: true,
    });
    expect(formatted).toBe(
      'type=success,params=[code,state],auth=[accessToken,idToken],url=true',
    );
  });

  test('빈 키 셋은 ∅ 로 표기 (root cause 케이스)', () => {
    const formatted = formatGoogleAuthDiagnostics({
      type: 'success',
      paramKeys: [],
      authenticationKeys: [],
      hasUrl: false,
    });
    expect(formatted).toBe('type=success,params=∅,auth=∅,url=false');
  });

  test('errorCode 가 있으면 끝에 추가', () => {
    const formatted = formatGoogleAuthDiagnostics({
      type: 'error',
      paramKeys: ['error'],
      authenticationKeys: [],
      hasUrl: false,
      errorCode: 'access_denied',
    });
    expect(formatted).toBe('type=error,params=[error],auth=∅,url=false,errorCode=access_denied');
  });
});

describe('exchangeGooglePkceCode — P0 (2026-06-10) PKCE auth-code flow 토큰 교환', () => {
  const REAL_IOS_CLIENT_ID_FOR_PKCE =
    '1234567890-pkceios.apps.googleusercontent.com';
  const REDIRECT_URI = 'com.googleusercontent.apps.1234567890-pkceios:/oauthredirect';
  const CODE_VERIFIER = 'sample-code-verifier-43chars-min-length-required';
  const AUTH_CODE = '4/0AY0e-g6sample-auth-code';
  const SAMPLE_ACCESS_TOKEN = 'ya29.PKCEExchangedAccessToken';
  const SAMPLE_ID_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.PKCEExchangedIdToken.sig';

  beforeEach(() => {
    exchangeCodeAsyncMock.mockReset();
  });

  function successWithCode(extra?: Record<string, string>): AuthSessionResult {
    return {
      type: 'success',
      authentication: null,
      params: { code: AUTH_CODE, state: 'sample-state', ...(extra ?? {}) },
      errorCode: null,
      error: null,
      url: 'com.googleusercontent.apps.1234567890-pkceios:/oauthredirect?code=...',
    } as unknown as AuthSessionResult;
  }

  function pkceRequestSnapshot(): {
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
  } {
    return {
      clientId: REAL_IOS_CLIENT_ID_FOR_PKCE,
      redirectUri: REDIRECT_URI,
      codeVerifier: CODE_VERIFIER,
    };
  }

  test('PKCE code 응답 + request 완비 → exchangeCodeAsync 호출 후 access/id 토큰 반환', async () => {
    exchangeCodeAsyncMock.mockResolvedValueOnce({
      accessToken: SAMPLE_ACCESS_TOKEN,
      idToken: SAMPLE_ID_TOKEN,
      scope: 'openid profile email',
    });

    const result = await exchangeGooglePkceCode(successWithCode(), pkceRequestSnapshot());

    expect(result).toEqual({
      accessToken: SAMPLE_ACCESS_TOKEN,
      idToken: SAMPLE_ID_TOKEN,
      scope: 'openid profile email',
    });
    expect(exchangeCodeAsyncMock).toHaveBeenCalledTimes(1);
    const [config, discovery] = exchangeCodeAsyncMock.mock.calls[0];
    expect(config).toMatchObject({
      clientId: REAL_IOS_CLIENT_ID_FOR_PKCE,
      redirectUri: REDIRECT_URI,
      code: AUTH_CODE,
      extraParams: { code_verifier: CODE_VERIFIER },
    });
    expect(discovery).toEqual({ tokenEndpoint: 'https://oauth2.googleapis.com/token' });
  });

  test('exchangeCodeAsync 응답에 idToken 만 있어도 idToken 반환 (accessToken 미포함)', async () => {
    exchangeCodeAsyncMock.mockResolvedValueOnce({
      accessToken: '',
      idToken: SAMPLE_ID_TOKEN,
    });

    const result = await exchangeGooglePkceCode(successWithCode(), pkceRequestSnapshot());

    expect(result).toEqual({ idToken: SAMPLE_ID_TOKEN });
  });

  test('result.type !== success → null 반환 (exchangeCodeAsync 호출 안 함)', async () => {
    const result = await exchangeGooglePkceCode(
      { type: 'cancel' } as unknown as AuthSessionResult,
      pkceRequestSnapshot(),
    );
    expect(result).toBeNull();
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });

  test('params.code 가 없으면 null 반환 (implicit/error 케이스)', async () => {
    const result = await exchangeGooglePkceCode(
      {
        type: 'success',
        authentication: null,
        params: { state: 'no-code' },
        errorCode: null,
        error: null,
        url: 'redir',
      } as unknown as AuthSessionResult,
      pkceRequestSnapshot(),
    );
    expect(result).toBeNull();
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });

  test('codeVerifier 누락 → null 반환 (snapshot 부적합)', async () => {
    const result = await exchangeGooglePkceCode(successWithCode(), {
      clientId: REAL_IOS_CLIENT_ID_FOR_PKCE,
      redirectUri: REDIRECT_URI,
      codeVerifier: '',
    });
    expect(result).toBeNull();
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });

  test('request 가 null/undefined → null 반환', async () => {
    expect(await exchangeGooglePkceCode(successWithCode(), null)).toBeNull();
    expect(await exchangeGooglePkceCode(successWithCode(), undefined)).toBeNull();
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });

  test('exchangeCodeAsync 가 throw → 호출자에게 그대로 propagate (호출자가 사용자 메시지 처리)', async () => {
    exchangeCodeAsyncMock.mockRejectedValueOnce(new Error('invalid_grant'));

    await expect(exchangeGooglePkceCode(successWithCode(), pkceRequestSnapshot())).rejects.toThrow(
      /invalid_grant/,
    );
  });

  test('clientId / redirectUri 도 누락이면 null (방어)', async () => {
    expect(
      await exchangeGooglePkceCode(successWithCode(), {
        clientId: '',
        redirectUri: REDIRECT_URI,
        codeVerifier: CODE_VERIFIER,
      }),
    ).toBeNull();
    expect(
      await exchangeGooglePkceCode(successWithCode(), {
        clientId: REAL_IOS_CLIENT_ID_FOR_PKCE,
        redirectUri: '',
        codeVerifier: CODE_VERIFIER,
      }),
    ).toBeNull();
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });
});
