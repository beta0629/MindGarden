/**
 * Google 로그인 — `@react-native-google-signin/google-signin` Native SDK 래퍼.
 *
 * <p>**Build #16 (2026-06-10) — Native SDK 마이그레이션 (P0)**: 기존
 * `expo-auth-session/providers/google` (`useAuthRequest` + PKCE auth-code flow + `exchangeCodeAsync`)
 * 흐름은 Android Google Client 정책상 Custom URI scheme redirect 가 차단되어
 * (`400 invalid_request: Custom URI scheme is not enabled for your Android client`) 로그인이
 * 실패한다. 본 모듈은 Native SDK 로 전면 교체된다:</p>
 *
 *  - iOS: iosClientId + URL scheme (Expo plugin 자동 주입) → SDK 가 Safari View Controller 호출
 *  - Android: SHA-1 + Package name + Web Client ID 검증 (Google Sign-In SDK 표준)
 *  - 토큰: `signIn()` 응답에 `idToken`, `serverAuthCode` 포함 / `getTokens()` 로 accessToken
 *
 * <p>흐름:
 *  1) {@link ensureGoogleSignInConfigured} 가 첫 호출 시 1회만 `GoogleSignin.configure()` 호출
 *  2) {@link signInWithGoogle} →
 *     - Android: `hasPlayServices({ showPlayServicesUpdateDialog: true })`
 *     - 모든 플랫폼: `GoogleSignin.signIn()`
 *     - 토큰 부족 시 `GoogleSignin.getTokens()` 로 보강
 *     - 응답 매핑: success / cancelled / inProgress / playServicesNotAvailable / error
 *  3) 호출자(`AuthService.loginWithGoogle`) 가 BE `/api/v1/auth/social-login` 호출
 *
 * <p>BE 는 idToken 우선 검증(`GoogleOAuth2ServiceImpl.getUserInfoFromIdToken`) 이 표준이고,
 * accessToken 도 함께 보내면 `userinfo` 보강에 활용된다.</p>
 *
 * <p>SSOT:
 *  - docs/project-management/2026-06-10/GOOGLE_ANDROID_OAUTH_SETUP.md
 *  - https://react-native-google-signin.github.io/docs/api</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
  type User,
} from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';

/**
 * Google Sign-In Native SDK 가 반환하는 사용자 식별 정보 — 호출자(AuthService) 의 social-login
 * 페이로드 보강용. BE 가 idToken 으로 자체 검증하므로 본 객체는 표시·진단 목적.
 */
export interface GoogleNativeUserInfo {
  /** Google 사용자 고유 ID (SDK 의 `user.id`) — `providerUserId` 로 사용 가능 */
  readonly id: string;
  /** 사용자 이메일 (SDK 가 제공 시) */
  readonly email: string;
  /** 표시 이름 (`given + family` 또는 SDK 의 `name`) */
  readonly name: string;
  /** 프로필 이미지 URL (SDK 가 제공 시) */
  readonly photoUrl?: string;
  /** Google `given_name` / `family_name` 분리 노출 (가입 화면 prefill 용) */
  readonly givenName?: string;
  readonly familyName?: string;
}

/** Google Sign-In 호출 결과 outcome — UI/AuthService 가 분기에 사용. */
export type GoogleSignInOutcome =
  | { readonly kind: 'success'; readonly result: GoogleNativeAuthResult }
  | { readonly kind: 'cancel' }
  | { readonly kind: 'dismiss' }
  | { readonly kind: 'error'; readonly message: string }
  | { readonly kind: 'notConfigured'; readonly message: string };

/** Native SDK 가 반환한 토큰 + 사용자 정보 (성공 분기). */
export interface GoogleNativeAuthResult {
  /** OpenID Connect id_token — BE 검증 1순위 (필수). */
  readonly idToken: string;
  /** Google access_token (`getTokens()` 보강) — BE userinfo 보강용 (선택). */
  readonly accessToken: string | null;
  /** offlineAccess 옵션 사용 시 server auth code (현재 흐름 미사용 — null). */
  readonly serverAuthCode: string | null;
  /** Google Sign-In SDK 사용자 정보. */
  readonly user: GoogleNativeUserInfo;
}

/**
 * `@react-native-google-signin/google-signin` Native SDK 가 사용 가능한 환경인지 확인.
 *
 * <p>Native SDK 는 Web Client ID(`webClientId`) 가 있어야 idToken audience 를 알 수 있고
 * BE 검증 흐름이 성립한다 (`GoogleOAuth2ServiceImpl#allowedAudiences`). iOS 는 추가로
 * `iosClientId` 가 필요하지만 Expo plugin 의 `iosUrlScheme` 자동 등록으로도 동작한다 —
 * 본 함수는 가장 강한 게이트인 Web Client ID 만 검사한다.</p>
 *
 * <p>env 우선이고, 누락 시 `app.config.ts` 의 `extra.googleClientId` 폴백.</p>
 */
export function isGoogleNativeConfigured(): boolean {
  const ids = resolveGoogleClientIdConfig();
  if (!ids) {
    return false;
  }
  return isUsableGoogleClientId(ids.webClientId);
}

/** 기존 호출자 호환 alias — Native SDK 마이그레이션 이후 의미는 {@link isGoogleNativeConfigured}. */
export function isGoogleConfiguredForPlatform(): boolean {
  return isGoogleNativeConfigured();
}

export interface GoogleClientIdConfig {
  readonly webClientId?: string;
  readonly iosClientId?: string;
}

/**
 * `Constants.expoConfig.extra.googleClientId` 폴백 해석 — `app.config.ts` 가 OTA 발행 시 빈
 * 값을 omit 하므로, env 우선 + extra 폴백 순서로 재구성한다.
 */
export function resolveGoogleClientIdConfig(): GoogleClientIdConfig | null {
  const extra = Constants.expoConfig?.extra as
    | { googleClientId?: { web?: string; ios?: string; android?: string } }
    | undefined;
  const fromExtra = extra?.googleClientId ?? {};
  const merged: GoogleClientIdConfig = {
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || fromExtra.web?.trim() || undefined,
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || fromExtra.ios?.trim() || undefined,
  };
  if (!merged.webClientId && !merged.iosClientId) {
    return null;
  }
  return merged;
}

/**
 * client id 문자열이 실제 OAuth Client 형태인지 검증.
 * placeholder·빈 값·`your_...` 템플릿 값은 모두 미구성으로 본다.
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
 * Native SDK 1회 초기화 가드 — `GoogleSignin.configure()` 는 sync 이고 동일 옵션으로 여러 번
 * 호출해도 안전하지만, 호출 횟수를 줄이기 위해 모듈 단일 boolean 으로 가드한다.
 *
 * <p>Native 모듈이 미연결(Expo Go) 환경에서는 `configure()` 호출 시 throw. 호출자가 try/catch
 * 로 감싸 friendly 에러 outcome 으로 변환한다.</p>
 */
let configured = false;

export function ensureGoogleSignInConfigured(): void {
  if (configured) {
    return;
  }
  const ids = resolveGoogleClientIdConfig();
  if (!ids || !isUsableGoogleClientId(ids.webClientId)) {
    throw new Error('Google Sign-In webClientId 가 구성되지 않았습니다.');
  }
  GoogleSignin.configure({
    webClientId: ids.webClientId!,
    ...(ids.iosClientId ? { iosClientId: ids.iosClientId } : {}),
    offlineAccess: false,
    scopes: ['openid', 'email', 'profile'],
  });
  configured = true;
}

/**
 * 테스트 전용 — `configured` 캐시를 리셋한다. 운영 코드에서는 호출하지 않는다.
 *
 * <p>jest 가 모듈 캐시를 공유하므로 mock 변경 시 본 함수로 명시 리셋이 필요.</p>
 */
export function __resetGoogleSignInConfiguredForTests(): void {
  configured = false;
}

/** Native SDK 의 `User` 응답을 SocialLoginButton·BE 페이로드 친화적인 형태로 정규화. */
function mapNativeUser(user: User['user']): GoogleNativeUserInfo {
  const givenName = readNonEmpty(user.givenName);
  const familyName = readNonEmpty(user.familyName);
  const composed = [givenName, familyName].filter(Boolean).join(' ').trim();
  const name = readNonEmpty(user.name) ?? (composed.length > 0 ? composed : '');
  return {
    id: user.id,
    email: readNonEmpty(user.email) ?? '',
    name,
    ...(readNonEmpty(user.photo) ? { photoUrl: user.photo as string } : {}),
    ...(givenName ? { givenName } : {}),
    ...(familyName ? { familyName } : {}),
  };
}

function readNonEmpty(v: string | null | undefined): string | undefined {
  if (typeof v !== 'string') {
    return undefined;
  }
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Google Sign-In Native SDK 호출 — UI 가 onPress 콜백에서 직접 호출.
 *
 * <p>흐름:
 *  1. {@link ensureGoogleSignInConfigured} (env / extra 미구성 시 `notConfigured` outcome)
 *  2. (Android) `hasPlayServices({ showPlayServicesUpdateDialog: true })`
 *  3. `GoogleSignin.signIn()` — discriminated union 응답
 *  4. idToken 미수신이면 `GoogleSignin.getTokens()` 로 보강
 *  5. accessToken 만 별도 보강 (idToken 만 있어도 BE 검증 가능)</p>
 *
 * <p>토큰 값은 진단 로그에 절대 포함하지 않는다 (보안). 키 존재 여부만 console.log.</p>
 */
export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  try {
    ensureGoogleSignInConfigured();
  } catch {
    return {
      kind: 'notConfigured',
      message:
        'Google 로그인 설정이 누락되어 있습니다. 관리자에게 문의해 주세요. (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)',
    };
  }

  try {
    if (typeof GoogleSignin.hasPlayServices === 'function') {
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      } catch (playServicesError: unknown) {
        const message = humanizePlayServicesError(playServicesError);
        return { kind: 'error', message };
      }
    }

    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) {
      return { kind: 'cancel' };
    }
    if (!isSuccessResponse(response)) {
      // discriminated union 의 다른 type (예: noSavedCredentialFound) — 인터랙티브 signIn 흐름에서는
      // 거의 발생하지 않지만 방어적으로 dismiss 로 매핑.
      return { kind: 'dismiss' };
    }

    const data = response.data;
    let idToken = readNonEmpty(data.idToken);
    let accessToken: string | null = null;

    if (!idToken || typeof GoogleSignin.getTokens === 'function') {
      try {
        const tokens = await GoogleSignin.getTokens();
        idToken = idToken ?? readNonEmpty(tokens.idToken);
        const ax = readNonEmpty(tokens.accessToken);
        accessToken = ax ?? null;
      } catch (tokensError: unknown) {
        // accessToken 보강 실패는 치명적이지 않다 — idToken 만으로도 BE 검증 가능.
        const message = tokensError instanceof Error ? tokensError.message : String(tokensError);
        // eslint-disable-next-line no-console -- Native SDK 진단(토큰 값 미포함)
        console.log('[GoogleSignIn][diagnose] getTokens failed (idToken only fallback)', message);
      }
    }

    if (!idToken) {
      return {
        kind: 'error',
        message: 'Google 로그인 응답에서 idToken 을 받지 못했습니다. 잠시 후 다시 시도해 주세요.',
      };
    }

    const user = mapNativeUser(data.user);
    // eslint-disable-next-line no-console -- Native SDK 진단(토큰 값 미포함, 키 존재 여부만 노출)
    console.log(
      '[GoogleSignIn][diagnose] signIn ok',
      `tokens=[${[idToken ? 'id' : null, accessToken ? 'access' : null]
        .filter(Boolean)
        .join(',')}],userKnown=${Boolean(user.id)}`,
    );

    return {
      kind: 'success',
      result: {
        idToken,
        accessToken,
        serverAuthCode: readNonEmpty(data.serverAuthCode) ?? null,
        user,
      },
    };
  } catch (error: unknown) {
    return mapSignInError(error);
  }
}

/**
 * `GoogleSignin.signIn` / `getTokens` 가 throw 한 에러를 사용자 친화 메시지로 변환.
 *
 * <p>SDK 의 `statusCodes` 와 `isErrorWithCode` 헬퍼를 사용해 정형화된 에러 코드를 분류한다.
 * 사용자가 볼 메시지에는 토큰·이메일·SDK 내부 디테일을 포함하지 않는다.</p>
 */
function mapSignInError(error: unknown): GoogleSignInOutcome {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { kind: 'cancel' };
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return {
        kind: 'error',
        message: 'Google 로그인이 이미 진행 중입니다. 잠시 후 다시 시도해 주세요.',
      };
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return {
        kind: 'error',
        message:
          'Google Play Services 가 사용 불가하거나 업데이트가 필요합니다. 기기 설정에서 Play 서비스를 업데이트해 주세요.',
      };
    }
    return {
      kind: 'error',
      message: `Google 로그인에 실패했습니다. (${String(error.code)})`,
    };
  }
  const message = error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.';
  return { kind: 'error', message };
}

function humanizePlayServicesError(error: unknown): string {
  if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Google Play Services 가 사용 불가하거나 업데이트가 필요합니다. 기기 설정에서 Play 서비스를 업데이트해 주세요.';
  }
  if (error instanceof Error) {
    return `Google Play Services 확인에 실패했습니다. (${error.message})`;
  }
  return 'Google Play Services 확인에 실패했습니다.';
}

/**
 * 로그인 종료(또는 진단 시) Native SDK 세션 정리. AuthService 의 logout 흐름이 호출.
 *
 * <p>Expo Go 등 Native 모듈 미연결 환경에서는 throw 가능 — 호출자가 swallow.</p>
 */
export async function signOutFromGoogle(): Promise<void> {
  try {
    ensureGoogleSignInConfigured();
    await GoogleSignin.signOut();
  } catch (e) {
    // 로그아웃 실패는 사용자 경험에 영향이 거의 없다 — 진단 로그만 남기고 throw 하지 않는다.
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console -- Native SDK 진단(세션 정리 실패는 fatal 이 아님)
    console.log('[GoogleSignIn][diagnose] signOut skipped', message);
  }
}
