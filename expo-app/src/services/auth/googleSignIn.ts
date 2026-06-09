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
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import type { AuthRequestPromptOptions } from 'expo-auth-session';

// 모듈 로드 시 1회 — Expo dev client / production 모두에서 OAuth 콜백 자동 처리.
WebBrowser.maybeCompleteAuthSession();

export interface GoogleClientIdConfig {
  readonly webClientId?: string;
  readonly iosClientId?: string;
  readonly androidClientId?: string;
}

/** `expo-auth-session/providers/google` 의 success response 핵심 필드. */
export interface GoogleAuthResult {
  /** Google `access_token` — BE 가 `userinfo` API 호출 또는 `id_token` 검증에 사용 */
  readonly accessToken: string;
  /** Google `id_token` (OpenID Connect) — BE 가 `kid` 검증으로 사용 */
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
 * Google OAuth Request 훅 + 프롬프트 함수를 반환한다.
 *
 * <p>호출자 컴포넌트가 React 함수 컴포넌트여야 한다 (훅 규칙). expo-auth-session 의
 * `useAuthRequest` 자체가 훅이므로 비훅 코드에서는 호출 불가. 호출자는 반환된
 * `promptAsync` 만 onPress 콜백 안에서 호출한다.</p>
 *
 * <p>응답 매핑은 호출자 — `AuthService.loginWithGoogle(token, idToken)` 으로 BE 검증.</p>
 *
 * @param scopes 요청 scope (기본 `openid profile email`)
 */
export function useGoogleAuthRequest(scopes: readonly string[] = ['openid', 'profile', 'email']) {
  const clientIds = useMemo(() => resolveGoogleClientIdConfig(), []);
  const [request, response, promptAsyncRaw] = Google.useAuthRequest({
    webClientId: clientIds?.webClientId,
    iosClientId: clientIds?.iosClientId,
    androidClientId: clientIds?.androidClientId,
    scopes: [...scopes],
  });

  const isReady = Boolean(clientIds && request);

  const promptAsync = async (options?: AuthRequestPromptOptions): Promise<GoogleSignInOutcome> => {
    if (!clientIds) {
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
        const auth = result.authentication;
        if (!auth?.accessToken) {
          return {
            kind: 'error',
            message: 'Google 로그인 응답에서 accessToken 을 찾을 수 없습니다.',
          };
        }
        return {
          kind: 'success',
          result: {
            accessToken: auth.accessToken,
            idToken: auth.idToken ?? undefined,
            scope: auth.scope ?? undefined,
          },
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
