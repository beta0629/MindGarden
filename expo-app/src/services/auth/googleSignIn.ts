/**
 * Google OAuth — `expo-auth-session/providers/google` 네이티브 OAuth 헬퍼 (G-1 경로).
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md §I.4 G-1.
 * App Store 4.5.4 정책 안전(in-app browser ASWebAuthenticationSession / Custom Tabs 자동),
 * PKCE 자동, OS 표준 브라우저 위임. WebView in-app browser 폴백(G-2) 은 정책 위반 위험으로 사용 안 함.</p>
 *
 * <p>흐름:
 *  1) `expo-web-browser.maybeCompleteAuthSession()` 모듈 로드 시 호출 (deep link 복귀 처리)
 *  2) `Google.useAuthRequest({ webClientId / iosClientId / androidClientId })` 로 `request` 생성
 *  3) `request.promptAsync()` → ASWebAuthenticationSession (iOS) / Custom Tabs (Android)
 *  4) 응답 type:
 *     - `success` → `authentication.accessToken` + `authentication.idToken`
 *     - `cancel`  → 사용자 취소 (에러 아님)
 *     - `dismiss` → 시스템 dismiss
 *     - `error`   → OAuth provider 에러
 *
 * 클라이언트 ID 우선순위 (env 우선, 없으면 `app.config.ts.extra` 폴백):
 *  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
 *  - 누락 시 `Constants.expoConfig.extra.googleClientId` (web/ios/android 객체)
 *  - 모두 없으면 `null` 반환 → AuthService 가 `error` outcome 으로 분기
 *
 * 본 모듈은 React 훅 (`useGoogleAuthRequest`) 만 export 한다 — `expo-auth-session/providers/google`
 * 의 `useAuthRequest` 가 훅이라 비훅 함수에서 호출할 수 없다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useMemo } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type { AuthRequestPromptOptions, AuthSessionResult } from 'expo-auth-session';

// 모듈 로드 시 1회 — Expo dev client / production 모두에서 OAuth 콜백 자동 처리.
WebBrowser.maybeCompleteAuthSession();

export interface GoogleClientIdConfig {
  readonly webClientId?: string;
  readonly iosClientId?: string;
  readonly androidClientId?: string;
}

/**
 * `expo-auth-session/providers/google` 의 success response 핵심 필드.
 *
 * <p>P0 2026-06-10 수정: 일부 iOS 네이티브 빌드(TestFlight 1.0.7 #14)에서 응답이
 * `authentication.accessToken` 없이 `idToken` 만 포함하거나, 토큰이 `result.params.access_token` /
 * `result.params.id_token` 으로만 전달되는 케이스를 관찰. 따라서 **두 토큰 모두 optional**
 * 로 정의하고, 호출자(`AuthService.loginWithGoogle`) 가 "둘 중 최소 하나"를 검증한다.
 * BE 는 accessToken 우선이고, accessToken 부재 시 idToken 으로 폴백한다.</p>
 */
export interface GoogleAuthResult {
  /** Google `access_token` — BE 가 `userinfo` API 호출에 사용 (선택). */
  readonly accessToken?: string;
  /** Google `id_token` (OpenID Connect) — BE 가 `tokeninfo` 검증·claims 추출에 사용 (선택). */
  readonly idToken?: string;
  /** OAuth scope 문자열 (공백 구분) */
  readonly scope?: string;
}

/** Google OAuth 프롬프트 결과 outcome — BE 호출 직전 단계. */
export type GoogleSignInOutcome =
  | { readonly kind: 'success'; readonly result: GoogleAuthResult }
  | { readonly kind: 'cancel' }
  | { readonly kind: 'dismiss' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'notConfigured'; readonly message: string };

/**
 * `expo-config.extra.googleClientId` 에 객체로 주입된 클라이언트 ID 를 정규화한다.
 *
 * <p>app.config.ts 가 다음 형태로 주입:
 * <pre>{@code extra: { googleClientId: { web: '...', ios: '...', android: '...' } }}</pre>
 * </p>
 */
function readClientIdsFromExtra(): GoogleClientIdConfig {
  const extra = Constants.expoConfig?.extra as
    | { googleClientId?: { web?: string; ios?: string; android?: string } }
    | undefined;
  const cfg = extra?.googleClientId ?? {};
  return {
    webClientId: cfg.web?.trim() || undefined,
    iosClientId: cfg.ios?.trim() || undefined,
    androidClientId: cfg.android?.trim() || undefined,
  };
}

/**
 * Google 클라이언트 ID 를 우선순위 순으로 해석한다.
 * env > extra. 모든 환경이 비면 `null` 반환.
 */
export function resolveGoogleClientIdConfig(): GoogleClientIdConfig | null {
  const fromExtra = readClientIdsFromExtra();
  const merged: GoogleClientIdConfig = {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || fromExtra.webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || fromExtra.iosClientId,
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || fromExtra.androidClientId,
  };
  if (!merged.webClientId && !merged.iosClientId && !merged.androidClientId) {
    return null;
  }
  return merged;
}

/**
 * 현재 플랫폼에서 Google OAuth 가 사용 가능한 client id 가 주입되어 있는지 판별한다.
 *
 * <p>P0 핫픽스 (2026-06-10) — `Google.useAuthRequest` 는 render 중 platform 별 client id
 * 가 비어 있거나 placeholder 형태("...placeholder...", "0.apps.googleusercontent.com" 등)이면
 * **컴포넌트 mount 시점에 throw** 한다(`Client Id property iosClientId must be defined...`).
 * 훅을 안전하게 호출하려면 호출자(컴포넌트)가 본 함수의 반환값으로 mount 자체를
 * 가드해야 한다. 호출자는 비활성 분기로 다른 SocialLoginButton 만 렌더한다.</p>
 *
 * <p>placeholder 판별: 빈 문자열, `placeholder` 로 시작, `your_` 로 시작 (대소문자 무시) 케이스.</p>
 */
export function isGoogleConfiguredForPlatform(): boolean {
  const clientIds = resolveGoogleClientIdConfig();
  if (clientIds === null) {
    return false;
  }
  const platformClientId =
    Platform.OS === 'ios'
      ? clientIds.iosClientId
      : Platform.OS === 'android'
        ? clientIds.androidClientId
        : clientIds.webClientId;
  return isUsableGoogleClientId(platformClientId);
}

/**
 * client id 문자열이 실제 OAuth Client 형태인지 검증.
 * placeholder·빈 값·"your_..." 템플릿 값은 모두 미구성으로 본다.
 */
function isUsableGoogleClientId(value: string | undefined | null): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return false;
  }
  if (normalized.startsWith('placeholder')) {
    return false;
  }
  if (normalized.startsWith('your_')) {
    return false;
  }
  return true;
}

/**
 * Google OAuth Request 훅 + 프롬프트 함수를 반환한다.
 *
 * <p>호출자 컴포넌트가 React 함수 컴포넌트여야 한다 (훅 규칙). expo-auth-session 의
 * `useAuthRequest` 자체가 훅이므로 비훅 코드에서는 호출 불가. 호출자는 반환된
 * `promptAsync` 만 onPress 콜백 안에서 호출한다.</p>
 *
 * <p>**P0 핫픽스 (2026-06-10)**: 본 훅은 **현재 플랫폼 client id 가 구성된 경우에만**
 * 호출해야 한다(`isGoogleConfiguredForPlatform() === true`). 미구성 상태에서 호출하면
 * `Google.useAuthRequest` 가 mount 시점에 throw 하여 앱이 fatal 화면으로 빠진다.</p>
 *
 * <p>응답 매핑은 호출자 — `AuthService.loginWithGoogle(token, idToken)` 으로 BE 검증.</p>
 *
 * @param scopes 요청 scope (기본 `openid profile email`)
 */
/**
 * `Google.useAuthRequest` 가 render 중 platform 별 client id 누락 시 throw 하므로,
 * 환경 미구성 단계에서도 훅이 안전하게 호출되도록 placeholder 를 주입한다.
 *
 * <p>`promptAsync` 가 실제 호출 전에 `platformClientId` 검증으로 `notConfigured` outcome 을
 * 반환하므로 실제 OAuth 요청은 발생하지 않는다.</p>
 */
const GOOGLE_PLACEHOLDER_CLIENT_ID = '0.apps.googleusercontent.com';

/**
 * `Google.useAuthRequest` success 응답에서 `accessToken` / `idToken` 을 회복력 있게 추출한다.
 *
 * <p>**P0 (2026-06-10)** — TestFlight `1.0.7 (14)` 에서 Google 로그인 시 빨간 오류
 * "Google 로그인 응답에서 accessToken 을 찾을 수 없습니다" 가 노출되어 로그인이 차단되었다.
 * 원인: iOS 네이티브 빌드(implicit/PKCE 자동)에서 `result.authentication` 이 일부 케이스에
 * `null` 이거나 `accessToken` 키가 비고 토큰이 `result.params.{access_token,id_token}` 으로
 * 전달된다. 또 iOS 네이티브 ID Token Only 플로우는 `idToken` 만 반환할 수 있다.</p>
 *
 * <p>본 헬퍼는 두 위치(`authentication.*` / `params.*`)를 모두 확인하여 가능한 토큰을 모두
 * 반환한다. 호출자는 둘 중 최소 하나가 있으면 BE 로 전송하고, BE 는 accessToken 우선·
 * idToken 폴백(`GoogleOAuth2ServiceImpl.getUserInfoFromIdToken`) 으로 사용자 정보를 조회한다.</p>
 *
 * <p>본 함수는 React 훅이 아니며 외부에서 직접 호출하지 않는다(테스트 목적 export). 호환을
 * 위해 반환 객체의 `accessToken`/`idToken` 모두 `undefined` 가능.</p>
 */
export function extractGoogleAuthTokens(result: AuthSessionResult): GoogleAuthResult {
  if (result.type !== 'success') {
    return {};
  }
  const auth = result.authentication ?? undefined;
  const params = (result.params ?? {}) as Record<string, string | undefined>;
  const accessToken = pickNonEmptyString(auth?.accessToken, params.access_token);
  const idToken = pickNonEmptyString(auth?.idToken, params.id_token);
  const scope = pickNonEmptyString(auth?.scope, params.scope);
  const extracted: { -readonly [K in keyof GoogleAuthResult]?: GoogleAuthResult[K] } = {};
  if (accessToken) {
    extracted.accessToken = accessToken;
  }
  if (idToken) {
    extracted.idToken = idToken;
  }
  if (scope) {
    extracted.scope = scope;
  }
  return extracted;
}

/** 빈 문자열·`undefined`·`null` 을 모두 미설정으로 본 뒤 trim 한 첫 번째 유효 값을 반환. */
function pickNonEmptyString(
  ...candidates: readonly (string | undefined | null)[]
): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const trimmed = candidate.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return undefined;
}

export function useGoogleAuthRequest(scopes: readonly string[] = ['openid', 'profile', 'email']) {
  const clientIds = useMemo(() => resolveGoogleClientIdConfig(), []);
  const platformClientId =
    Platform.OS === 'ios'
      ? clientIds?.iosClientId
      : Platform.OS === 'android'
        ? clientIds?.androidClientId
        : clientIds?.webClientId;
  const safeIds = useMemo(
    () => ({
      webClientId: clientIds?.webClientId ?? GOOGLE_PLACEHOLDER_CLIENT_ID,
      iosClientId: clientIds?.iosClientId ?? GOOGLE_PLACEHOLDER_CLIENT_ID,
      androidClientId: clientIds?.androidClientId ?? GOOGLE_PLACEHOLDER_CLIENT_ID,
    }),
    [clientIds],
  );
  const [request, response, promptAsyncRaw] = Google.useAuthRequest({
    webClientId: safeIds.webClientId,
    iosClientId: safeIds.iosClientId,
    androidClientId: safeIds.androidClientId,
    scopes: [...scopes],
  });

  const isReady = Boolean(isUsableGoogleClientId(platformClientId) && request);

  const promptAsync = async (options?: AuthRequestPromptOptions): Promise<GoogleSignInOutcome> => {
    if (!isUsableGoogleClientId(platformClientId)) {
      return {
        kind: 'notConfigured',
        message:
          'Google 로그인 설정이 누락되어 있습니다. 관리자에게 문의해 주세요. (expo extra 또는 EXPO_PUBLIC_GOOGLE_*_CLIENT_ID)',
      };
    }
    if (!request) {
      return {
        kind: 'notConfigured',
        message: 'Google 로그인 모듈을 초기화할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      };
    }
    try {
      const result = await promptAsyncRaw(options);
      if (result.type === 'success') {
        const extracted = extractGoogleAuthTokens(result);
        if (!extracted.accessToken && !extracted.idToken) {
          return {
            kind: 'error',
            message: 'Google 로그인 응답에서 토큰을 찾을 수 없습니다. 잠시 후 다시 시도해 주세요.',
          };
        }
        return {
          kind: 'success',
          result: extracted,
        };
      }
      if (result.type === 'cancel') {
        return { kind: 'cancel' };
      }
      if (result.type === 'dismiss') {
        return { kind: 'dismiss' };
      }
      const errMsg = result.type === 'error' ? result.error?.message : undefined;
      return { kind: 'error', message: errMsg ?? 'Google 로그인에 실패했습니다.' };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Google 로그인 중 오류가 발생했습니다.';
      return { kind: 'error', message };
    }
  };

  return { request, response, promptAsync, isReady, clientIds };
}
