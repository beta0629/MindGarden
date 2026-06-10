/**
 * AuthService — 소셜 로그인 SDK 래핑 + 백엔드 JWT 발급
 * 카카오·네이버 네이티브 SDK → 백엔드 `/api/v1/auth/social-login` → JWT 발급
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import {
  login as kakaoSDKLogin,
  logout as kakaoSDKLogout,
  getProfile as getKakaoProfile,
} from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import { apiPost } from '../api/client';
import { AUTH_API } from '../api/endpoints';
import { unwrapApiResponse } from '../api/unwrapApiResponse';
import {
  postAppleLogin,
  postAppleSendPhoneOtp,
  postAppleVerifyPhoneOtp,
  type AppleAuthLoginResponse,
  type ApplePhoneSendResponse,
} from '../api/auth/appleAuth';
import {
  mapAppleLoginResponseRaw,
  mapApplePhoneSendResponse,
  type AppleNativePrefill,
} from './auth/applePhoneVerificationMapper';
import {
  postOAuthSendPhoneOtp,
  postOAuthVerifyPhoneOtp,
  type OAuthPhoneProvider,
  type OAuthPhoneSendResponse,
  type OAuthPhoneVerifyResponse,
} from '../api/auth/oauthAuth';
import {
  mapOAuthPhoneSendResponse,
  mapOAuthPhoneVerifyResponse,
  type OAuthPhoneSendMapped,
  type OAuthPhoneVerifyMapped,
} from './auth/oauthPhoneVerificationMapper';
import {
  APPLE_SIGN_IN_CANCELLED,
  isAppleSignInAvailable,
  performAppleNativeSignIn,
} from './auth/appleSignIn';
import { signInWithGoogle, signOutFromGoogle, type GoogleSignInOutcome } from './auth/googleSignIn';
import type { User, Tokens } from '../stores/useAuthStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { isExpoGoApp } from '@/lib/getMmkv';
import { getApiBaseUrl } from '../config/apiBaseUrl';
import { normalizeKoreanMobileDigits } from '../utils/phoneNormalize';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import { setCachedJsessionId, setJsessionId } from '@/utils/sessionCookie';
import { coerceApiRoleString, mapApiRoleToStoreRole } from '@/utils/adminRole';
import { decodeJwtPayload, parseJwtSubAsUserId } from '@/utils/jwtPayload';
import { readSocialIdentityOptional } from '@/utils/socialIdentitySanitize';
import {
  DUPLICATE_LOGIN_FALLBACK_MESSAGE,
  detectDuplicateLoginConfirmation,
} from '@/utils/duplicateLoginSignal';

/**
 * 클라이언트가 사용하는 4 종 OAuth provider — Apple/Google/Kakao/Naver.
 *
 * <p>BE `/api/v1/auth/social-login` 은 provider 문자열 (대문자) 을 그대로 받아
 * `OAuth2FactoryService` 가 적절한 service impl 로 분기한다. Google 은 `GoogleOAuth2ServiceImpl`
 * 의 `requiresPhoneOtp=true` 정책에 따라 휴대폰 OTP 매칭(provider-agnostic) 으로 진입한다.</p>
 */
export type SocialAuthProvider = 'KAKAO' | 'NAVER' | 'APPLE' | 'GOOGLE';

/**
 * 중복 로그인 확인 후 강제 재로그인에 필요한 입력값.
 * - credentials: 이메일/비밀번호를 그대로 보내 `/confirm-duplicate-login` 호출
 * - 소셜(KAKAO/NAVER): force-logout 후 동일 accessToken으로 social-login 재호출
 */
export type DuplicateLoginRetryContext =
  | { provider: 'credentials'; email: string; password: string }
  | {
      provider: SocialAuthProvider;
      accessToken: string;
      userId: string | null;
      email: string | null;
      nickname: string | null;
      profileImage: string | null;
    };

/** 네이티브 social-login `socialUserInfo` + 가입 화면용 보강 필드 */
export interface SocialUserInfoDraft {
  email: string;
  nickname: string;
  provider: SocialAuthProvider;
  /** 백엔드 `providerUserId` — 네이티브 응답에서는 `socialId` 키로 전달됨 */
  providerUserId: string;
  profileImageUrl?: string;
  /** 국내 11자리(010…) — SDK·동의가 있을 때만 */
  phone?: string;
  /** 카카오 실명 동의 등 원본 이름 */
  realName?: string;
  /** 간편가입 표시명 초기값(실명 우선 시) */
  initialDisplayName?: string;
}

export interface SocialSignupRequestBody {
  provider: string;
  providerUserId: string;
  providerUsername: string;
  email: string;
  name: string;
  nickname: string;
  /** 생략 시 서버 A안(내부 강난수) */
  password?: string;
  confirmPassword?: string;
  phone?: string | null;
  providerProfileImage?: string;
  branchCode?: string;
  privacyConsent: boolean;
  termsConsent: boolean;
  marketingConsent: boolean;
  agreeTerms: boolean;
  agreeMarketing: boolean;
}

interface SocialLoginApiUser {
  id: number;
  email: string;
  name: string;
  nickname: string;
  role: unknown;
  profileImageUrl?: string;
  tenantId?: string;
}

interface SocialLoginResponse {
  success: boolean;
  user?: SocialLoginApiUser;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  requiresSignup?: boolean;
  requiresPhoneAccountSelection?: boolean;
  /**
   * provider-agnostic OAuth 휴대폰 매칭 신호 — Kakao/Naver/Google 응답에서 true 면
   * 신규 OAuth 휴대폰 입력 화면(`oauth-phone-link`)으로 라우팅.
   * (Apple SIWA `requiresPhoneVerification` 와 별개)
   */
  requiresOAuthPhoneVerification?: boolean;
  /** {@link #requiresOAuthPhoneVerification}=true 일 때 함께 발급되는 단기 JWT(10분 만료). */
  phoneVerificationToken?: string;
  /** 네이티브 social-login 분기 — JWT `phoneAccountSelectionToken` 대신 `selectionToken` */
  selectionToken?: string;
  socialUserInfo?: {
    email: string;
    nickname: string;
    provider: string;
    socialId: string;
  };
  message?: string;
}

export interface SocialSignupResponseDto {
  success: boolean;
  message?: string;
  userId?: number;
  email?: string;
}

interface OAuthAccountSelectionPreviewItem {
  userId: number;
  role: string;
  roleDisplayLabel: string;
  dashboardGuide: string;
  optionLabel: string;
}

interface OAuthAccountSelectionPreviewData {
  provider: string;
  candidates: OAuthAccountSelectionPreviewItem[];
}

interface OAuthAccountSelectionCompleteData {
  accessToken: string;
  refreshToken: string;
  userId: number;
  email: string;
  name: string;
  nickname: string;
  role: string;
  profileImageUrl?: string;
  tenantId?: string;
}

/** Apple SIWA 휴대폰 인증 단계로 진입해야 할 때 social user 정보 prefill 용 */
export interface AppleSocialUserPrefill {
  /** Apple identityToken `sub` */
  providerUserId: string;
  /** Apple 직접 제공 email (private relay 가능) */
  email: string;
  /** Apple 전체 이름 (`given + family` 또는 BE 가 정리한 값) */
  name: string;
  /** Apple Private Email Relay 여부 — UI 안내용 (true 면 "@privaterelay.appleid.com") */
  isPrivateRelay?: boolean;
}

/**
 * provider-agnostic OAuth 휴대폰 인증 단계로 진입해야 할 때 social user 정보 prefill 용.
 *
 * <p>{@link AppleSocialUserPrefill} 의 일반화 버전. 신규 `oauth-phone-link.tsx` 화면이
 * Apple/Google/Kakao/Naver 4 종 provider 공통으로 받는 진입 데이터.</p>
 */
export interface OAuthSocialUserPrefill {
  /** provider 측 sub (식별자) — 화면 prefill 표시에는 사용하지 않음. */
  providerUserId: string;
  /** provider 가 제공한 이메일 (선택). */
  email: string;
  /** provider 가 제공한 이름 (선택, Kakao 는 null 가능 — 화면이 행을 숨김). */
  name: string;
  /** Apple Private Email Relay 여부 — APPLE 에서만 의미 있음. */
  isPrivateRelay?: boolean;
}

export type SocialLoginOutcome =
  | { kind: 'authenticated'; user: User }
  | { kind: 'requiresSignup'; socialUserInfo: SocialUserInfoDraft; provider: SocialAuthProvider }
  | {
      kind: 'requiresPhoneAccountSelection';
      selectionToken: string;
      provider: SocialAuthProvider;
      message?: string;
    }
  | {
      /**
       * Apple SIWA 휴대폰 매칭 1단계 — apple_sub 매칭 사용자가 없을 때.
       * 클라이언트는 `phoneVerificationToken` 을 들고 `/(auth)/apple-phone-link` 로 라우팅한다.
       */
      kind: 'requiresApplePhoneVerification';
      phoneVerificationToken: string;
      socialUserInfo: AppleSocialUserPrefill;
    }
  | {
      /**
       * provider-agnostic OAuth 휴대폰 매칭 1단계 — Apple/Google/Kakao/Naver 공통.
       * 클라이언트는 `phoneVerificationToken` 을 들고 `/(auth)/oauth-phone-link?provider=...`
       * 로 라우팅한다. Apple 회피·Kakao null 이름 PR 회귀를 막기 위해 기존 Apple kind 와
       * 분리해 신규 kind 를 추가한다.
       */
      kind: 'requiresOAuthPhoneVerification';
      phoneVerificationToken: string;
      provider: SocialAuthProvider;
      socialUserInfo: OAuthSocialUserPrefill;
    }
  | {
      kind: 'requiresDuplicateLoginConfirmation';
      message: string;
      retryContext: DuplicateLoginRetryContext;
    }
  | { kind: 'error'; message: string };

/** Apple SIWA OTP 발송 결과. */
export type ApplePhoneSendOutcome =
  | {
      kind: 'sent';
      otpChallengeToken: string;
      /** OTP 만료 시간(초) — 없으면 기본 180s 가정 */
      expiresInSeconds?: number;
    }
  | {
      /** 쿨다운(1분 이내 재발송) 또는 일일 한도 초과 */
      kind: 'cooldown';
      message: string;
      /** 재발송까지 남은 시간(초). 한도 초과면 undefined */
      retryAfterSeconds?: number;
    }
  | { kind: 'error'; message: string };

/** Apple SIWA OTP 검증 결과. */
export type ApplePhoneVerifyOutcome =
  | { kind: 'authenticated'; user: User }
  | {
      kind: 'requiresPhoneAccountSelection';
      selectionToken: string;
      provider: SocialAuthProvider;
      message?: string;
    }
  | { kind: 'error'; message: string };

/** provider-agnostic OAuth OTP 발송 결과 — Apple/Google/Kakao/Naver 공통. */
export type OAuthPhoneSendOutcome =
  | {
      kind: 'sent';
      challengeToken: string;
      expiresInSeconds?: number;
      resendCooldownSeconds?: number;
      maskedPhone?: string;
    }
  | {
      kind: 'cooldown';
      message: string;
      retryAfterSeconds?: number;
      code?: string;
    }
  | { kind: 'error'; message: string; code?: string };

/** provider-agnostic OAuth OTP 검증 결과. */
export type OAuthPhoneVerifyOutcome =
  | { kind: 'authenticated'; user: User }
  | {
      kind: 'requiresPhoneAccountSelection';
      selectionToken: string;
      /**
       * provider 식별자 — Apple/Google/Kakao/Naver 4 종.
       * 기존 {@link SocialLoginOutcome} 의 `requiresPhoneAccountSelection` 가 사용하는
       * {@link SocialAuthProvider} 는 GOOGLE 을 포함하지 않으므로 본 outcome 에서는
       * OAuth 전용 enum 을 사용한다.
       */
      provider: OAuthPhoneProvider;
      message?: string;
    }
  | { kind: 'error'; message: string; code?: string };

export type CredentialLoginOutcome =
  | { kind: 'authenticated'; user: User }
  | {
      kind: 'requiresDuplicateLoginConfirmation';
      message: string;
      retryContext: DuplicateLoginRetryContext;
    }
  | { kind: 'error'; message: string };

export type DuplicateLoginRetryOutcome =
  | { kind: 'authenticated'; user: User }
  | { kind: 'error'; message: string };

let naverInitialized = false;

const AUTH_SERVICE_SOCIAL_LOGIN_LOG_PREFIX = '[AuthService][social-login]';

type SocialLoginDebugOutcome =
  | 'authenticated'
  | 'requiresSignup'
  | 'requiresPhoneAccountSelection'
  | 'requiresApplePhoneVerification'
  | 'requiresOAuthPhoneVerification'
  | 'requiresDuplicateLoginConfirmation'
  | 'error';

function isSocialLoginDebugLoggingEnabled(): boolean {
  if (__DEV__) {
    return true;
  }
  const extra = Constants.expoConfig?.extra as { socialLoginDebug?: boolean } | undefined;
  return extra?.socialLoginDebug === true;
}

function computeHasPhoneFromKakaoProfile(profile: unknown): boolean {
  const rec = (profile && typeof profile === 'object' ? profile : {}) as Record<string, unknown>;
  const ka = readKakaoNestedAccount(rec);
  let fromKa: string | undefined;
  if (ka) {
    fromKa =
      readOptionalString(ka.phone_number) ??
      readOptionalString(ka.phoneNumber) ??
      readOptionalString(ka.phone);
  }
  const phoneRaw =
    readOptionalString(rec.phoneNumber) ??
    readOptionalString(rec.phone_number) ??
    readOptionalString(rec.phone) ??
    fromKa;
  return Boolean(normalizeKoreanMobileDigits(phoneRaw));
}

function computeHasPhoneFromNaverProfile(response: Record<string, unknown> | undefined): boolean {
  if (!response) {
    return false;
  }
  const phoneRaw =
    readOptionalString(response.mobile) ??
    readOptionalString(response.cellphone) ??
    readOptionalString(response.mobile_no) ??
    readOptionalString(response.phone) ??
    readOptionalString(response.tel);
  return Boolean(normalizeKoreanMobileDigits(phoneRaw));
}

function emitSocialLoginDebugLog(
  phase: 'request' | 'response',
  payload: Record<string, unknown>,
): void {
  // eslint-disable-next-line no-console -- 소셜 로그인 진단(EXPO_PUBLIC_SOCIAL_LOGIN_DEBUG=1 또는 __DEV__); 토큰·PII 미포함
  console.log(AUTH_SERVICE_SOCIAL_LOGIN_LOG_PREFIX, phase, payload);
}

function logSocialLoginDebugRequest(fields: {
  provider: SocialAuthProvider;
  providerUserId: string;
  hasEmail: boolean;
  hasNickname: boolean;
  hasProfileImage: boolean;
  hasPhone: boolean;
}): void {
  if (!isSocialLoginDebugLoggingEnabled()) {
    return;
  }
  const tenantId = useTenantStore.getState().tenantId ?? null;
  emitSocialLoginDebugLog('request', {
    apiBaseUrl: getApiBaseUrl(),
    tenantId,
    provider: fields.provider,
    providerUserId: fields.providerUserId,
    hasEmail: fields.hasEmail,
    hasNickname: fields.hasNickname,
    hasProfileImage: fields.hasProfileImage,
    hasPhone: fields.hasPhone,
    __DEV__,
  });
}

function logSocialLoginDebugResponse(
  response: SocialLoginResponse,
  mapped: SocialLoginOutcome,
): void {
  if (!isSocialLoginDebugLoggingEnabled()) {
    return;
  }
  const outcome: SocialLoginDebugOutcome = mapped.kind === 'error' ? 'error' : mapped.kind;
  const socialId = response.socialUserInfo?.socialId;
  const payload: Record<string, unknown> = {
    success: response.success,
    requiresSignup: Boolean(response.requiresSignup),
    requiresPhoneAccountSelection: Boolean(response.requiresPhoneAccountSelection),
    message: response.message,
    outcome,
  };
  if (typeof socialId === 'string' && socialId.length > 0) {
    payload.socialUserInfoSocialId = socialId;
  }
  emitSocialLoginDebugLog('response', payload);
}

function kakaoNativeUnavailableMessage(): string {
  if (isExpoGoApp()) {
    return 'Expo Go에서는 카카오 로그인을 사용할 수 없습니다. Development Build(npx expo run:ios 등)로 실행하거나 이메일 로그인을 이용해 주세요.';
  }
  return '카카오 로그인 모듈이 연결되어 있지 않습니다. 네이티브로 빌드한 앱에서 다시 시도해 주세요.';
}

function naverNativeUnavailableMessage(): string {
  if (isExpoGoApp()) {
    return 'Expo Go에서는 네이버 로그인을 사용할 수 없습니다. Development Build로 실행하거나 이메일 로그인을 이용해 주세요.';
  }
  return '네이버 로그인 모듈이 연결되어 있지 않습니다. 네이티브로 빌드한 앱에서 다시 시도해 주세요.';
}

function logAuthError(scope: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[AuthService] ${scope}:`, error.message);
    return;
  }
  console.error(`[AuthService] ${scope}:`, error);
}

function mapApiUserToStoreUser(raw: SocialLoginApiUser, accessToken?: string): User {
  const role = mapApiRoleToStoreRole(coerceApiRoleString(raw.role) ?? undefined);
  let id = raw.id;
  if (!Number.isFinite(id) || id <= 0) {
    if (accessToken?.trim()) {
      const jwtUserId = parseJwtSubAsUserId(decodeJwtPayload(accessToken));
      if (jwtUserId != null) {
        id = jwtUserId;
      }
    }
  }
  return {
    id: Number.isFinite(id) && id > 0 ? id : 0,
    email: raw.email ?? '',
    name: raw.name ?? '',
    nickname: raw.nickname,
    role,
    profileImageUrl: raw.profileImageUrl,
    tenantId:
      (typeof raw.tenantId === 'string' && raw.tenantId.trim()) ||
      useTenantStore.getState().tenantId ||
      undefined,
  };
}

/**
 * 객체 필드에서 사용 가능한 문자열만 추출한다.
 *
 * <p>SNS SDK·서버 응답에서 닉네임·이메일 등이 null로 와도, 일부 경로에서
 * "null"/"undefined" 문자열로 직렬화되어 가입 화면에 그대로 노출되는 사고를 방지한다.
 * 공백, "null", "undefined"(대소문자 무관)는 모두 미입력으로 간주한다.</p>
 */
function readOptionalString(v: unknown): string | undefined {
  return readSocialIdentityOptional(v);
}

function readKakaoNestedAccount(
  profile: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const ka = profile.kakao_account;
  if (ka && typeof ka === 'object') {
    return ka as Record<string, unknown>;
  }
  return undefined;
}

/**
 * 카카오 네이티브 프로필로 가입 분기 draft 보강(이메일·닉·전화·표시명).
 * API 값이 비어 있을 때만 이메일 등 보수적으로 덮어씀.
 */
function enrichDraftFromKakaoProfile(
  draft: SocialUserInfoDraft,
  profile: unknown,
): SocialUserInfoDraft {
  const rec = (profile && typeof profile === 'object' ? profile : {}) as Record<string, unknown>;
  const ka = readKakaoNestedAccount(rec);

  const profileEmail =
    readOptionalString(rec.email) ?? (ka ? readOptionalString(ka.email) : undefined);
  const email = !draft.email?.trim() && profileEmail?.trim() ? profileEmail.trim() : draft.email;

  const phoneRaw =
    readOptionalString(rec.phoneNumber) ??
    readOptionalString(rec.phone_number) ??
    readOptionalString(rec.phone) ??
    (ka
      ? (readOptionalString(ka.phone_number) ??
        readOptionalString(ka.phoneNumber) ??
        readOptionalString(ka.phone))
      : undefined);
  const normalizedPhone = normalizeKoreanMobileDigits(phoneRaw);
  const phone = normalizedPhone ?? draft.phone;

  const realName = readOptionalString(rec.name) ?? (ka ? readOptionalString(ka.name) : undefined);

  const draftNickname = readOptionalString(draft.nickname) ?? '';
  let nickname = draftNickname;
  if (!nickname) {
    nickname =
      readOptionalString(rec.nickname) ?? readOptionalString(rec.displayName) ?? realName ?? '';
  }

  const initialDisplayName =
    realName && realName.length >= 2
      ? realName
      : (readOptionalString(draft.initialDisplayName) ?? undefined);

  return {
    ...draft,
    email,
    nickname,
    phone,
    realName: realName ?? readOptionalString(draft.realName),
    initialDisplayName,
  };
}

/**
 * 네이버 getProfile response로 전화·이메일·닉 보강.
 */
function enrichDraftFromNaverResponse(
  draft: SocialUserInfoDraft,
  response: Record<string, unknown> | null | undefined,
): SocialUserInfoDraft {
  if (!response) return draft;

  const phoneRaw =
    readOptionalString(response.mobile) ??
    readOptionalString(response.cellphone) ??
    readOptionalString(response.mobile_no) ??
    readOptionalString(response.phone) ??
    readOptionalString(response.tel);
  const normalizedPhone = normalizeKoreanMobileDigits(phoneRaw);
  const phone = normalizedPhone ?? draft.phone;

  let email = draft.email;
  if (!email?.trim()) {
    const pe = readOptionalString(response.email);
    if (pe) email = pe;
  }

  const draftNickname = readOptionalString(draft.nickname) ?? '';
  let nickname = draftNickname;
  if (!nickname) {
    nickname = readOptionalString(response.nickname) ?? readOptionalString(response.name) ?? '';
  }

  return {
    ...draft,
    email,
    nickname,
    phone,
  };
}

function parseSocialUserInfoDraft(
  info: SocialLoginResponse['socialUserInfo'],
  provider: SocialAuthProvider,
  profileImageUrl?: string,
): SocialUserInfoDraft | null {
  if (!info) return null;
  const pid = info.socialId ?? (info as { providerUserId?: string }).providerUserId;
  if (!pid) return null;
  return {
    email: readOptionalString(info.email) ?? '',
    nickname: readOptionalString(info.nickname) ?? '',
    provider,
    providerUserId: String(pid),
    profileImageUrl: readOptionalString(profileImageUrl),
  };
}

function buildSocialRetryContext(
  provider: SocialAuthProvider,
  accessToken: string,
  userId: string | null,
  email: string | null,
  nickname: string | null,
  profileImage: string | null,
): DuplicateLoginRetryContext {
  return {
    provider,
    accessToken,
    userId,
    email,
    nickname,
    profileImage,
  };
}

/**
 * Apple SIWA `/login` 또는 `/phone/verify` 응답을 클라이언트 outcome 으로 매핑한다.
 *
 * <p>응답 매핑 자체는 {@link mapAppleLoginResponseRaw} 에 위임하고, 본 함수는
 * `mapApiUserToStoreUser` 등 클라이언트 상태 의존 변환만 추가한다.</p>
 */
function mapAppleLoginResponse(
  response: AppleAuthLoginResponse,
  native?: AppleNativePrefill | null,
): SocialLoginOutcome {
  const mapped = mapAppleLoginResponseRaw(response, native);
  if (mapped.kind === 'requiresApplePhoneVerification') {
    return {
      kind: 'requiresApplePhoneVerification',
      phoneVerificationToken: mapped.phoneVerificationToken,
      socialUserInfo: mapped.socialUserInfo,
    };
  }
  if (mapped.kind === 'requiresPhoneAccountSelection') {
    return {
      kind: 'requiresPhoneAccountSelection',
      selectionToken: mapped.selectionToken,
      provider: 'APPLE',
      message: mapped.message,
    };
  }
  if (mapped.kind === 'authenticated') {
    const user = mapApiUserToStoreUser(mapped.apiUser, mapped.accessToken);
    return { kind: 'authenticated', user };
  }
  return { kind: 'error', message: mapped.message };
}

function mapNativeSocialResponse(
  response: SocialLoginResponse | undefined,
  provider: SocialAuthProvider,
  profileImageUrl?: string,
  retryContext?: DuplicateLoginRetryContext,
): SocialLoginOutcome {
  if (!response) {
    return { kind: 'error', message: '서버 응답이 없습니다.' };
  }

  const duplicateSignal = detectDuplicateLoginConfirmation(response);
  if (duplicateSignal && retryContext) {
    return {
      kind: 'requiresDuplicateLoginConfirmation',
      message: duplicateSignal.message,
      retryContext,
    };
  }

  // provider-agnostic OAuth 휴대폰 매칭 1단계 — Kakao/Naver/Google 응답이
  // `requiresOAuthPhoneVerification=true` + `phoneVerificationToken` 을 내려주면
  // 신규 `/(auth)/oauth-phone-link?provider=...` 화면으로 라우팅한다.
  // (BE Phase 3A 일반화 — Apple `requiresApplePhoneVerification` 분기와 별개)
  if (response.requiresOAuthPhoneVerification && response.phoneVerificationToken) {
    return {
      kind: 'requiresOAuthPhoneVerification',
      phoneVerificationToken: response.phoneVerificationToken,
      provider,
      socialUserInfo: {
        providerUserId: response.socialUserInfo?.socialId ?? '',
        email: response.socialUserInfo?.email ?? '',
        name: response.socialUserInfo?.nickname ?? '',
        isPrivateRelay: false,
      },
    };
  }

  if (response.requiresPhoneAccountSelection && response.selectionToken) {
    return {
      kind: 'requiresPhoneAccountSelection',
      selectionToken: response.selectionToken,
      provider,
      message: response.message,
    };
  }

  if (response.requiresSignup) {
    const draft = parseSocialUserInfoDraft(response.socialUserInfo, provider, profileImageUrl);
    if (!draft) {
      return {
        kind: 'error',
        message: response.message ?? '가입에 필요한 소셜 정보가 부족합니다.',
      };
    }
    return { kind: 'requiresSignup', socialUserInfo: draft, provider };
  }

  if (response.success && response.user && response.accessToken && response.refreshToken) {
    const user = mapApiUserToStoreUser(response.user, response.accessToken);
    return { kind: 'authenticated', user };
  }

  return { kind: 'error', message: response.message ?? '로그인에 실패했습니다.' };
}

function pickSessionIdFromAuthPayload(raw: unknown): string | undefined {
  if (raw == null || typeof raw !== 'object') {
    return undefined;
  }
  const rec = raw as Record<string, unknown>;
  const direct = rec.sessionId;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct.trim();
  }
  const data = rec.data;
  if (data != null && typeof data === 'object') {
    const nested = (data as Record<string, unknown>).sessionId;
    if (typeof nested === 'string' && nested.trim().length > 0) {
      return nested.trim();
    }
  }
  return undefined;
}

async function applyAuthenticatedUser(
  user: User,
  tokens: Tokens,
  sessionId?: string,
): Promise<void> {
  syncTenantFromAccessToken(tokens.accessToken);
  const jwtUserId = parseJwtSubAsUserId(decodeJwtPayload(tokens.accessToken));
  const enrichedUser =
    (!Number.isFinite(user.id) || user.id <= 0) && jwtUserId != null
      ? { ...user, id: jwtUserId }
      : user;
  if (sessionId) {
    await setJsessionId(sessionId);
    setCachedJsessionId(sessionId);
  }
  await useAuthStore.getState().login(enrichedUser, tokens);
  syncTenantFromAccessToken(tokens.accessToken);
}

function readSignupErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const rec = err as Record<string, unknown>;
    if (typeof rec.message === 'string' && rec.message.trim()) {
      return rec.message;
    }
    const orig = rec.originalError as { response?: { data?: { message?: string } } } | undefined;
    const fromBody = orig?.response?.data?.message;
    if (typeof fromBody === 'string' && fromBody.trim()) {
      return fromBody;
    }
  }
  return '회원가입 요청에 실패했습니다.';
}

const initializeNaverSDK = () => {
  if (naverInitialized) return;
  if (NativeModules.RNNaverLogin == null) {
    return;
  }

  const extra = Constants.expoConfig?.extra as
    | { naverClientId?: string; naverClientSecret?: string }
    | undefined;
  const consumerKey = (
    extra?.naverClientId ??
    process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ??
    ''
  ).trim();
  const consumerSecret = (
    extra?.naverClientSecret ??
    process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ??
    ''
  ).trim();
  const appName = 'MindGardenMobileApp';

  const initConfig: {
    appName: string;
    consumerKey: string;
    consumerSecret: string;
    serviceUrlSchemeIOS?: string;
  } = {
    appName,
    consumerKey,
    consumerSecret,
  };

  if (Platform.OS === 'ios') {
    initConfig.serviceUrlSchemeIOS = 'naverMindGardenMobileApp';
  }

  if (!consumerKey || !consumerSecret) {
    console.warn('[AuthService] 네이버 SDK: consumerKey/Secret 비어 있음 — app.config extra 확인');
    return;
  }

  NaverLogin.initialize(initConfig);
  naverInitialized = true;
};

function isKakaoNativeLinked(): boolean {
  return NativeModules.RNKakaoLogins != null;
}

function isNaverNativeLinked(): boolean {
  return NativeModules.RNNaverLogin != null;
}

export const AuthService = {
  /**
   * 카카오 로그인
   * SDK 토큰 획득 → 프로필 조회 → 백엔드 소셜 로그인 → JWT 수신 → SecureStore 저장
   */
  async loginWithKakao(): Promise<SocialLoginOutcome> {
    try {
      if (!isKakaoNativeLinked()) {
        return { kind: 'error', message: kakaoNativeUnavailableMessage() };
      }

      const token = await kakaoSDKLogin();
      const profile = await getKakaoProfile();
      const profileImageUrl = profile.profileImageUrl ?? undefined;
      const providerUserId = String(profile.id);

      logSocialLoginDebugRequest({
        provider: 'KAKAO',
        providerUserId,
        hasEmail: Boolean(String(profile.email ?? '').trim()),
        hasNickname: Boolean(String(profile.nickname ?? '').trim()),
        hasProfileImage: Boolean(profileImageUrl),
        hasPhone: computeHasPhoneFromKakaoProfile(profile),
      });

      const kakaoRetryContext = buildSocialRetryContext(
        'KAKAO',
        token.accessToken,
        providerUserId,
        profile.email ?? null,
        profile.nickname ?? null,
        profileImageUrl ?? null,
      );

      let response: SocialLoginResponse | undefined;
      try {
        response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, {
          provider: 'KAKAO',
          accessToken: token.accessToken,
          userId: profile.id,
          email: profile.email,
          nickname: profile.nickname,
          profileImage: profileImageUrl,
        });
      } catch (apiError: unknown) {
        const dup = detectDuplicateLoginConfirmation(apiError);
        if (dup) {
          return {
            kind: 'requiresDuplicateLoginConfirmation',
            message: dup.message,
            retryContext: kakaoRetryContext,
          };
        }
        throw apiError;
      }

      if (!response) {
        return { kind: 'error', message: '서버 응답이 없습니다.' };
      }
      const mapped = mapNativeSocialResponse(response, 'KAKAO', profileImageUrl, kakaoRetryContext);
      logSocialLoginDebugResponse(response, mapped);
      if (mapped.kind === 'authenticated') {
        const accessTokenValue = response.accessToken ?? '';
        const refreshTokenValue = response.refreshToken ?? '';
        await applyAuthenticatedUser(
          mapped.user,
          {
            accessToken: accessTokenValue,
            refreshToken: refreshTokenValue,
          },
          pickSessionIdFromAuthPayload(response),
        );
        return { kind: 'authenticated', user: mapped.user };
      }
      if (mapped.kind === 'requiresSignup') {
        return {
          kind: 'requiresSignup',
          socialUserInfo: enrichDraftFromKakaoProfile(mapped.socialUserInfo, profile),
          provider: 'KAKAO',
        };
      }
      return mapped;
    } catch (error: unknown) {
      logAuthError('카카오 로그인 에러', error);
      const message =
        error instanceof Error ? error.message : '카카오 로그인 중 오류가 발생했습니다.';
      return { kind: 'error', message };
    }
  },

  /**
   * 네이버 로그인
   */
  async loginWithNaver(): Promise<SocialLoginOutcome> {
    try {
      if (!isNaverNativeLinked()) {
        return { kind: 'error', message: naverNativeUnavailableMessage() };
      }

      initializeNaverSDK();
      if (!naverInitialized) {
        return {
          kind: 'error',
          message:
            '네이버 SDK를 초기화할 수 없습니다. iOS에서는 serviceUrlScheme 설정을 확인해 주세요.',
        };
      }

      const loginResult = await NaverLogin.login();
      const accessToken = loginResult?.successResponse?.accessToken ?? null;

      if (!accessToken) {
        const failMsg =
          (loginResult as { failureResponse?: { message?: string; isCancel?: boolean } })
            ?.failureResponse?.message ?? '';
        const isCancel = (loginResult as { failureResponse?: { isCancel?: boolean } })
          ?.failureResponse?.isCancel;
        if (isCancel) {
          return { kind: 'error', message: '네이버 로그인이 취소되었습니다.' };
        }
        return {
          kind: 'error',
          message: failMsg
            ? `네이버 로그인 실패: ${failMsg}`
            : '네이버 로그인 응답에서 토큰을 찾을 수 없습니다.',
        };
      }

      let userId: string | null = null;
      let email: string | null = null;
      let nickname: string | null = null;
      let profileImage: string | null = null;
      let naverProfile: Record<string, unknown> | undefined;

      try {
        const profileResult = await NaverLogin.getProfile(accessToken);
        if (profileResult?.response) {
          naverProfile = profileResult.response as Record<string, unknown>;
          userId = naverProfile.id != null ? String(naverProfile.id) : null;
          email = readOptionalString(naverProfile.email) ?? null;
          nickname =
            readOptionalString(naverProfile.nickname) ??
            readOptionalString(naverProfile.name) ??
            null;
          profileImage = readOptionalString(naverProfile.profile_image) ?? null;
        }
      } catch {
        // 프로필 가져오기 실패 — 백엔드에서 accessToken으로 조회 가능
      }

      logSocialLoginDebugRequest({
        provider: 'NAVER',
        providerUserId: userId ?? '',
        hasEmail: Boolean(String(email ?? '').trim()),
        hasNickname: Boolean(String(nickname ?? '').trim()),
        hasProfileImage: Boolean(String(profileImage ?? '').trim()),
        hasPhone: computeHasPhoneFromNaverProfile(naverProfile),
      });

      const naverRetryContext = buildSocialRetryContext(
        'NAVER',
        accessToken,
        userId,
        email,
        nickname,
        profileImage,
      );

      let response: SocialLoginResponse | undefined;
      try {
        response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, {
          provider: 'NAVER',
          accessToken,
          userId,
          email,
          nickname: nickname ?? '',
          profileImage: profileImage ?? '',
        });
      } catch (apiError: unknown) {
        const dup = detectDuplicateLoginConfirmation(apiError);
        if (dup) {
          return {
            kind: 'requiresDuplicateLoginConfirmation',
            message: dup.message,
            retryContext: naverRetryContext,
          };
        }
        throw apiError;
      }

      if (!response) {
        return { kind: 'error', message: '서버 응답이 없습니다.' };
      }
      const mapped = mapNativeSocialResponse(
        response,
        'NAVER',
        profileImage ?? undefined,
        naverRetryContext,
      );
      logSocialLoginDebugResponse(response, mapped);
      if (mapped.kind === 'authenticated') {
        const accessTokenValue = response.accessToken ?? '';
        const refreshTokenValue = response.refreshToken ?? '';
        await applyAuthenticatedUser(
          mapped.user,
          {
            accessToken: accessTokenValue,
            refreshToken: refreshTokenValue,
          },
          pickSessionIdFromAuthPayload(response),
        );
        return { kind: 'authenticated', user: mapped.user };
      }
      if (mapped.kind === 'requiresSignup') {
        return {
          kind: 'requiresSignup',
          socialUserInfo: enrichDraftFromNaverResponse(mapped.socialUserInfo, naverProfile),
          provider: 'NAVER',
        };
      }
      return mapped;
    } catch (error: unknown) {
      logAuthError('네이버 로그인 에러', error);
      const message =
        error instanceof Error ? error.message : '네이버 로그인 중 오류가 발생했습니다.';
      return { kind: 'error', message };
    }
  },

  /**
   * Sign in with Apple — Apple App Store Guideline 4.8 (T1).
   * iOS 13+ 네이티브 시트 → identityToken → BE 검증 → JWT 발급 흐름.
   * Android·Expo Go·iOS 13 미만에서는 호출하지 않는다.
   */
  async loginWithApple(): Promise<SocialLoginOutcome> {
    try {
      const available = await isAppleSignInAvailable();
      if (!available) {
        return {
          kind: 'error',
          message: 'Apple 로그인은 iOS 13 이상에서만 사용할 수 있습니다.',
        };
      }

      const native = await performAppleNativeSignIn();

      logSocialLoginDebugRequest({
        provider: 'APPLE',
        providerUserId: native.user,
        hasEmail: Boolean(native.email),
        hasNickname: false,
        hasProfileImage: false,
        hasPhone: false,
      });

      const response = await postAppleLogin({
        identityToken: native.identityToken,
        authorizationCode: native.authorizationCode || undefined,
        nonce: native.nonce,
        givenName: native.givenName || undefined,
        familyName: native.familyName || undefined,
        email: native.email || undefined,
      });

      if (!response) {
        return { kind: 'error', message: '서버 응답이 없습니다.' };
      }

      const outcome = mapAppleLoginResponse(response, native);
      logSocialLoginDebugResponse(response as unknown as SocialLoginResponse, outcome);
      if (outcome.kind === 'authenticated' && response.accessToken && response.refreshToken) {
        await applyAuthenticatedUser(
          outcome.user,
          {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
          pickSessionIdFromAuthPayload(response),
        );
      }
      return outcome;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Apple 로그인 중 오류가 발생했습니다.';
      if (message.includes(APPLE_SIGN_IN_CANCELLED)) {
        return { kind: 'error', message: 'Apple 로그인이 취소되었습니다.' };
      }
      logAuthError('Apple 로그인 에러', error);
      return { kind: 'error', message };
    }
  },

  /**
   * Apple SIWA 휴대폰 매칭 — OTP 발송 (`/api/v1/auth/oauth/apple/phone/send`).
   *
   * <p>입력한 휴대폰 번호로 6자리 OTP 를 발송한다. BE 응답 분기:
   *  - 정상 발송 → `kind: 'sent'` + `otpChallengeToken` + `expiresInSeconds`
   *  - 쿨다운(1분) 위반 → `kind: 'cooldown'` + `retryAfterSeconds`
   *  - 일 5회 한도 초과 / SMS 실패 → `kind: 'cooldown'` (안내 메시지) 또는 `kind: 'error'`
   * </p>
   *
   * @param phoneVerificationToken `/login` 응답으로 받은 단기 JWT
   * @param phoneNumber 사용자 입력 휴대폰 번호 (raw 그대로 — BE 에서 정규화)
   */
  async sendApplePhoneOtp(
    phoneVerificationToken: string,
    phoneNumber: string,
  ): Promise<ApplePhoneSendOutcome> {
    if (!phoneVerificationToken?.trim()) {
      return {
        kind: 'error',
        message: 'phoneVerificationToken 이 없습니다. 다시 로그인해 주세요.',
      };
    }
    if (!phoneNumber?.trim()) {
      return { kind: 'error', message: '휴대폰 번호를 입력해 주세요.' };
    }

    let response: ApplePhoneSendResponse | undefined;
    try {
      response = await postAppleSendPhoneOtp({
        phoneVerificationToken,
        phoneNumber,
      });
    } catch (err: unknown) {
      return { kind: 'error', message: readSignupErrorMessage(err) };
    }

    return mapApplePhoneSendResponse(response);
  },

  /**
   * Apple SIWA 휴대폰 매칭 — OTP 검증 + 매칭/로그인 (`/api/v1/auth/oauth/apple/phone/verify`).
   *
   * <p>BE 응답 분기:
   *  - 정상 로그인(단수 매칭 또는 신규 가입) → 토큰 저장 + `kind: 'authenticated'`
   *  - 매칭 후보 2명+(역할 혼재) → `kind: 'requiresPhoneAccountSelection'` (기존 `oauth-account-selection` 화면 재사용)
   *  - 코드 불일치/만료/시도초과 → `kind: 'error'`
   * </p>
   *
   * @param phoneVerificationToken `/login` 응답으로 받은 단기 JWT
   * @param otpChallengeToken `/phone/send` 응답으로 받은 challenge 토큰
   * @param code 사용자 입력 6자리
   */
  async verifyApplePhoneOtp(
    phoneVerificationToken: string,
    otpChallengeToken: string,
    code: string,
  ): Promise<ApplePhoneVerifyOutcome> {
    if (!phoneVerificationToken?.trim()) {
      return {
        kind: 'error',
        message: 'phoneVerificationToken 이 없습니다. 다시 로그인해 주세요.',
      };
    }
    if (!otpChallengeToken?.trim()) {
      return { kind: 'error', message: '인증번호를 다시 받아 주세요.' };
    }
    if (!/^\d{6}$/.test(code)) {
      return { kind: 'error', message: '인증번호 6자리를 입력해 주세요.' };
    }

    let response: AppleAuthLoginResponse | undefined;
    try {
      response = await postAppleVerifyPhoneOtp({
        phoneVerificationToken,
        otpChallengeToken,
        code,
      });
    } catch (err: unknown) {
      return { kind: 'error', message: readSignupErrorMessage(err) };
    }

    if (!response) {
      return { kind: 'error', message: '서버 응답이 없습니다.' };
    }

    const outcome = mapAppleLoginResponse(response);

    if (outcome.kind === 'authenticated' && response.accessToken && response.refreshToken) {
      await applyAuthenticatedUser(
        outcome.user,
        {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
        pickSessionIdFromAuthPayload(response),
      );
      return { kind: 'authenticated', user: outcome.user };
    }

    if (outcome.kind === 'requiresPhoneAccountSelection') {
      return outcome;
    }

    if (outcome.kind === 'error') {
      return outcome;
    }

    return {
      kind: 'error',
      message: response.message ?? '인증번호 확인에 실패했습니다.',
    };
  },

  /**
   * provider-agnostic OAuth 휴대폰 매칭 — OTP 발송 ({@code POST /api/v1/auth/oauth/phone/send}).
   *
   * <p>BE Phase 3A 일반화 엔드포인트. Apple/Google/Kakao/Naver 4 종 provider 가 동일 스키마로
   * 호출한다. {@link sendApplePhoneOtp} 와는 별도로 신규 메서드로 분리하여 Apple 회피·Kakao
   * null 이름 PR 회귀 위험을 차단한다.</p>
   *
   * @param provider OAuth provider 식별자 (APPLE/GOOGLE/KAKAO/NAVER)
   * @param phoneVerificationToken `/login` (또는 OAuth 콜백) 응답으로 받은 단기 JWT
   * @param phone 사용자 입력 휴대폰 번호 (raw 그대로 — BE 에서 정규화)
   */
  async sendOAuthPhoneOtp(
    provider: OAuthPhoneProvider,
    phoneVerificationToken: string,
    phone: string,
  ): Promise<OAuthPhoneSendOutcome> {
    if (!provider) {
      return { kind: 'error', message: 'OAuth provider 가 없습니다.' };
    }
    if (!phoneVerificationToken?.trim()) {
      return {
        kind: 'error',
        message: '인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.',
      };
    }
    if (!phone?.trim()) {
      return { kind: 'error', message: '휴대폰 번호를 입력해 주세요.' };
    }

    let response: OAuthPhoneSendResponse | undefined;
    try {
      response = await postOAuthSendPhoneOtp({
        oauthProvider: provider,
        phoneVerificationToken,
        phone,
      });
    } catch (err: unknown) {
      return { kind: 'error', message: readSignupErrorMessage(err) };
    }

    const mapped: OAuthPhoneSendMapped = mapOAuthPhoneSendResponse(response);
    if (mapped.kind === 'sent') {
      return {
        kind: 'sent',
        challengeToken: mapped.challengeToken,
        expiresInSeconds: mapped.expiresInSeconds,
        resendCooldownSeconds: mapped.resendCooldownSeconds,
        maskedPhone: mapped.maskedPhone,
      };
    }
    if (mapped.kind === 'cooldown') {
      return {
        kind: 'cooldown',
        message: mapped.message,
        retryAfterSeconds: mapped.retryAfterSeconds,
        code: mapped.code,
      };
    }
    return { kind: 'error', message: mapped.message, code: mapped.code };
  },

  /**
   * provider-agnostic OAuth 휴대폰 매칭 — OTP 검증 + 매칭/로그인
   * ({@code POST /api/v1/auth/oauth/phone/verify}).
   *
   * <p>BE 응답 분기:
   *  - 정상 로그인(단수 매칭) → 토큰 저장 + {@code kind: 'authenticated'}
   *  - 매칭 후보 2명+(역할 혼재) → {@code kind: 'requiresPhoneAccountSelection'}
   *    (기존 {@code /(auth)/oauth-account-selection} 화면 재사용)
   *  - 코드 불일치/만료/시도초과/세션만료 → {@code kind: 'error'} + {@code code}
   * </p>
   *
   * <p>**2026-06-10 P1 수정**: BE 응답의 {@code matchedAccount} 가 {@code userId/tenantId/role}
   * 외에 {@code name/email/nickname/phone/profileImageUrl} 까지 동봉하도록 보강되어
   * (BE {@code OAuthPhoneVerifyResponse.MatchedAccount}), OTP 직후 홈 화면 "님, 안녕하세요"
   * 빈 prefix 및 프로필 화면 "내담자 ㆍ ㅡ" 빈 이름 노출이 사라진다. 응답에 표시 필드가 없을
   * 때만(과거 BE 호환) 빈 문자열 fallback. UserRole 매핑은 {@link mapApiRoleToStoreRole} 재사용.</p>
   *
   * @param provider OAuth provider 식별자 (APPLE/GOOGLE/KAKAO/NAVER)
   * @param phoneVerificationToken `/login` 응답으로 받은 단기 JWT
   * @param challengeToken {@code /phone/send} 응답으로 받은 challenge 토큰
   * @param otpCode 사용자 입력 6자리
   */
  async verifyOAuthPhoneOtp(
    provider: OAuthPhoneProvider,
    phoneVerificationToken: string,
    challengeToken: string,
    otpCode: string,
  ): Promise<OAuthPhoneVerifyOutcome> {
    if (!provider) {
      return { kind: 'error', message: 'OAuth provider 가 없습니다.' };
    }
    if (!phoneVerificationToken?.trim()) {
      return {
        kind: 'error',
        message: '인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.',
      };
    }
    if (!challengeToken?.trim()) {
      return { kind: 'error', message: '인증번호를 다시 받아 주세요.' };
    }
    if (!/^\d{6}$/.test(otpCode)) {
      return { kind: 'error', message: '인증번호 6자리를 입력해 주세요.' };
    }

    let response: OAuthPhoneVerifyResponse | undefined;
    try {
      response = await postOAuthVerifyPhoneOtp({
        oauthProvider: provider,
        phoneVerificationToken,
        challengeToken,
        otpCode,
      });
    } catch (err: unknown) {
      return { kind: 'error', message: readSignupErrorMessage(err) };
    }

    const mapped: OAuthPhoneVerifyMapped = mapOAuthPhoneVerifyResponse(response, provider);

    if (mapped.kind === 'authenticated') {
      const role = mapApiRoleToStoreRole(mapped.matchedAccount.role);
      const matched = mapped.matchedAccount;
      const user: User = {
        id: matched.userId,
        email: matched.email ?? '',
        name: matched.name ?? '',
        nickname: matched.nickname ?? matched.name ?? '',
        role,
        tenantId: matched.tenantId ?? useTenantStore.getState().tenantId ?? undefined,
        ...(matched.phone ? { phone: matched.phone } : {}),
        ...(matched.profileImageUrl ? { profileImageUrl: matched.profileImageUrl } : {}),
      };
      await applyAuthenticatedUser(
        user,
        {
          accessToken: mapped.accessToken,
          refreshToken: mapped.refreshToken,
        },
        pickSessionIdFromAuthPayload(response),
      );
      return { kind: 'authenticated', user };
    }

    if (mapped.kind === 'requiresPhoneAccountSelection') {
      return {
        kind: 'requiresPhoneAccountSelection',
        selectionToken: mapped.selectionToken,
        provider: mapped.provider,
        message: mapped.message,
      };
    }

    return { kind: 'error', message: mapped.message, code: mapped.code };
  },

  /**
   * Google 로그인 — `@react-native-google-signin/google-signin` Native SDK (Build #16, 2026-06-10).
   *
   * <p>**Native SDK 마이그레이션 (P0)**: 기존 `expo-auth-session/providers/google` 의 Custom URI
   * scheme redirect 흐름이 Google Android Client 정책상 차단되어 (
   * `400 invalid_request: Custom URI scheme is not enabled for your Android client`)
   * 본 메서드는 SDK 가 직접 토큰을 반환하는 흐름으로 교체된다.</p>
   *
   * <p>흐름:
   *  1. {@link signInWithGoogle} 호출 → SDK 가 idToken / serverAuthCode 직접 반환
   *  2. accessToken 부족 시 SDK 가 `getTokens()` 로 보강
   *  3. BE `/api/v1/auth/social-login` 호출 (idToken 우선, accessToken 동봉)
   *  4. 응답을 `mapNativeSocialResponse` 로 분기 (인증 / 가입 / OAuth 휴대폰 매칭 등)</p>
   *
   * <p>BE `GoogleOAuth2ServiceImpl` 은 idToken `aud` 를 `allowedAudiences` (`webClientId` /
   * `iosClientId` / `androidClientId`) 로 검증하고, accessToken 이 함께 오면 `userinfo` API 로
   * 추가 보강한다 (#197 fix).</p>
   *
   * @param overrideOutcome 테스트·재시도 분기에서 외부 outcome 을 직접 주입할 때 사용 (옵션).
   */
  async loginWithGoogle(overrideOutcome?: GoogleSignInOutcome): Promise<SocialLoginOutcome> {
    let outcome = overrideOutcome;
    if (!outcome) {
      try {
        outcome = await signInWithGoogle();
      } catch (e: unknown) {
        logAuthError('Google 로그인 에러', e);
        const message = e instanceof Error ? e.message : 'Google 로그인 중 오류가 발생했습니다.';
        return { kind: 'error', message };
      }
    }

    if (outcome.kind === 'cancel' || outcome.kind === 'dismiss') {
      return { kind: 'error', message: 'Google 로그인이 취소되었습니다.' };
    }
    if (outcome.kind === 'error' || outcome.kind === 'notConfigured') {
      return { kind: 'error', message: outcome.message };
    }

    const { idToken, accessToken, user: googleUser } = outcome.result;
    const trimmedIdToken = idToken.trim();
    const trimmedAccessToken = accessToken?.trim() ?? '';
    if (!trimmedIdToken) {
      return {
        kind: 'error',
        message: 'Google 로그인 응답에서 idToken 을 받지 못했습니다. 잠시 후 다시 시도해 주세요.',
      };
    }

    try {
      const googleRetryContext = buildSocialRetryContext(
        'GOOGLE',
        trimmedAccessToken || trimmedIdToken,
        googleUser.id || null,
        googleUser.email || null,
        googleUser.name || null,
        googleUser.photoUrl ?? null,
      );

      logSocialLoginDebugRequest({
        provider: 'GOOGLE',
        providerUserId: googleUser.id ?? '',
        hasEmail: Boolean(googleUser.email),
        hasNickname: Boolean(googleUser.name),
        hasProfileImage: Boolean(googleUser.photoUrl),
        hasPhone: false,
      });

      let response: SocialLoginResponse | undefined;
      try {
        const requestBody: Record<string, unknown> = {
          provider: 'GOOGLE',
          idToken: trimmedIdToken,
        };
        if (trimmedAccessToken) {
          requestBody.accessToken = trimmedAccessToken;
        }
        if (googleUser.id) {
          requestBody.userId = googleUser.id;
        }
        if (googleUser.email) {
          requestBody.email = googleUser.email;
        }
        if (googleUser.name) {
          requestBody.nickname = googleUser.name;
        }
        if (googleUser.photoUrl) {
          requestBody.profileImage = googleUser.photoUrl;
        }
        response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, requestBody);
      } catch (apiError: unknown) {
        const dup = detectDuplicateLoginConfirmation(apiError);
        if (dup) {
          return {
            kind: 'requiresDuplicateLoginConfirmation',
            message: dup.message,
            retryContext: googleRetryContext,
          };
        }
        throw apiError;
      }

      if (!response) {
        return { kind: 'error', message: '서버 응답이 없습니다.' };
      }
      const mapped = mapNativeSocialResponse(
        response,
        'GOOGLE',
        googleUser.photoUrl,
        googleRetryContext,
      );
      logSocialLoginDebugResponse(response, mapped);
      if (mapped.kind === 'authenticated') {
        const accessTokenValue = response.accessToken ?? '';
        const refreshTokenValue = response.refreshToken ?? '';
        await applyAuthenticatedUser(
          mapped.user,
          {
            accessToken: accessTokenValue,
            refreshToken: refreshTokenValue,
          },
          pickSessionIdFromAuthPayload(response),
        );
        return { kind: 'authenticated', user: mapped.user };
      }
      return mapped;
    } catch (error: unknown) {
      logAuthError('Google 로그인 에러', error);
      const message =
        error instanceof Error ? error.message : 'Google 로그인 중 오류가 발생했습니다.';
      return { kind: 'error', message };
    }
  },

  /**
   * 가입 완료 후 동일 제공자로 social-login 재호출 (스펙 SNS_SIMPLE_SIGNUP_SPEC 4.1).
   *
   * <p>Build #16 (2026-06-10) 마이그레이션 후 Google 도 Native SDK `signInWithGoogle()` 로
   * 새 idToken 을 받아 social-login 을 재시도한다. SDK 의 idToken 은 1회용이지만, 사용자가 동의
   * 한 후 즉시 재호출 시 SDK 가 캐시된 사용자로 무프롬프트 처리하는 경우가 있어 카카오·네이버와
   * 동일한 흐름이 가능하다.</p>
   */
  async loginWithProviderAfterSignup(provider: SocialAuthProvider): Promise<SocialLoginOutcome> {
    if (provider === 'KAKAO') {
      return AuthService.loginWithKakao();
    }
    if (provider === 'APPLE') {
      return AuthService.loginWithApple();
    }
    if (provider === 'GOOGLE') {
      return AuthService.loginWithGoogle();
    }
    return AuthService.loginWithNaver();
  },

  /**
   * 소셜 간편 가입 — `POST /api/v1/auth/social/signup?tenantId=`
   * 응답은 `SocialSignupResponse`(래퍼 없음). 실패 시 400 등으로 axios reject.
   */
  async socialSignup(body: SocialSignupRequestBody): Promise<SocialSignupResponseDto> {
    const tenantId = useTenantStore.getState().tenantId;
    if (!tenantId) {
      return {
        success: false,
        message: '기관(테넌트)이 선택되지 않았습니다. 기관 선택 화면으로 돌아가 주세요.',
      };
    }

    const q = new URLSearchParams({ tenantId });
    const url = `${AUTH_API.SOCIAL_SIGNUP}?${q.toString()}`;

    try {
      const raw = await apiPost<SocialSignupResponseDto>(url, body);
      return raw ?? { success: false, message: '응답 본문이 없습니다.' };
    } catch (err: unknown) {
      return { success: false, message: readSignupErrorMessage(err) };
    }
  },

  /**
   * 동일 전화 복수 계정 — 미리보기 (`ApiResponse` 래퍼)
   */
  async fetchOAuthAccountSelectionPreview(
    selectionToken: string,
  ): Promise<
    { ok: true; data: OAuthAccountSelectionPreviewData } | { ok: false; message: string }
  > {
    try {
      const raw = (await apiPost<Record<string, unknown>>(
        AUTH_API.OAUTH_ACCOUNT_SELECTION_PREVIEW,
        {
          selectionToken,
        },
      )) as Record<string, unknown>;

      if (raw && raw.success === false) {
        return { ok: false, message: String(raw.message ?? '계정 목록을 불러오지 못했습니다.') };
      }

      const inner = unwrapApiResponse<OAuthAccountSelectionPreviewData>(raw);
      if (!inner || !Array.isArray(inner.candidates)) {
        return { ok: false, message: '계정 목록을 불러오지 못했습니다.' };
      }
      return { ok: true, data: inner };
    } catch (err: unknown) {
      return { ok: false, message: readSignupErrorMessage(err) };
    }
  },

  /**
   * 계정 선택 완료 → JWT 저장 및 세션 반영
   */
  async completeOAuthAccountSelection(
    selectionToken: string,
    selectedUserId: number,
  ): Promise<{ ok: true; user: User } | { ok: false; message: string }> {
    try {
      const raw = (await apiPost<Record<string, unknown>>(
        AUTH_API.OAUTH_ACCOUNT_SELECTION_COMPLETE,
        {
          selectionToken,
          selectedUserId,
        },
      )) as Record<string, unknown>;

      if (raw && raw.success === false) {
        return { ok: false, message: String(raw.message ?? '계정 선택에 실패했습니다.') };
      }

      const inner = unwrapApiResponse<OAuthAccountSelectionCompleteData>(raw);
      if (!inner?.accessToken || !inner.refreshToken) {
        return { ok: false, message: '토큰을 받지 못했습니다. 다시 시도해 주세요.' };
      }

      const role = mapApiRoleToStoreRole(inner.role);
      const user: User = {
        id: inner.userId,
        email: inner.email,
        name: inner.name ?? '',
        nickname: inner.nickname,
        role,
        profileImageUrl: inner.profileImageUrl,
        tenantId: inner.tenantId ?? useTenantStore.getState().tenantId ?? undefined,
      };

      await applyAuthenticatedUser(
        user,
        {
          accessToken: inner.accessToken,
          refreshToken: inner.refreshToken,
        },
        pickSessionIdFromAuthPayload(raw),
      );
      return { ok: true, user };
    } catch (err: unknown) {
      return { ok: false, message: readSignupErrorMessage(err) };
    }
  },

  /**
   * ID/PW 로그인 — Spring `ApiResponse` 래퍼 및 `token`/`accessToken` 필드 호환
   *
   * 백엔드가 `duplicate_login_confirmation` 신호를 반환하면
   * `kind: 'requiresDuplicateLoginConfirmation'` 으로 보고하고,
   * `AuthService.confirmDuplicateLoginAndRetry(retryContext)` 로 재시도한다.
   */
  async loginWithCredentials(email: string, password: string): Promise<CredentialLoginOutcome> {
    const retryContext: DuplicateLoginRetryContext = {
      provider: 'credentials',
      email,
      password,
    };

    try {
      const raw = await apiPost<Record<string, unknown>>(AUTH_API.LOGIN, {
        email,
        password,
      });

      const duplicateSignal = detectDuplicateLoginConfirmation(raw);
      if (duplicateSignal) {
        return {
          kind: 'requiresDuplicateLoginConfirmation',
          message: duplicateSignal.message,
          retryContext,
        };
      }

      const inner = (unwrapApiResponse<Record<string, unknown>>(raw) ?? raw) as Record<
        string,
        unknown
      >;

      const userRaw = inner.user as SocialLoginApiUser | undefined;
      const accessToken = (inner.accessToken ?? inner.token) as string | undefined;
      const refreshToken = inner.refreshToken as string | undefined;

      if (userRaw && accessToken && refreshToken) {
        const user = mapApiUserToStoreUser(userRaw, accessToken);
        await applyAuthenticatedUser(
          user,
          { accessToken, refreshToken },
          pickSessionIdFromAuthPayload(raw),
        );
        return { kind: 'authenticated', user };
      }

      const msg =
        (typeof raw === 'object' && raw !== null && typeof raw.message === 'string'
          ? raw.message
          : null) ??
        (typeof inner.message === 'string' ? inner.message : null) ??
        '로그인에 실패했습니다.';
      return { kind: 'error', message: msg };
    } catch (error: unknown) {
      const duplicateSignal = detectDuplicateLoginConfirmation(error);
      if (duplicateSignal) {
        return {
          kind: 'requiresDuplicateLoginConfirmation',
          message: duplicateSignal.message,
          retryContext,
        };
      }
      return { kind: 'error', message: readSignupErrorMessage(error) };
    }
  },

  /**
   * 중복 로그인 확인 → 기존 세션 종료 + 동일 자격으로 재로그인.
   *
   * - credentials: `POST /api/v1/auth/confirm-duplicate-login` (`{ email, password, confirmTerminate: true }`)
   * - 소셜(KAKAO/NAVER): `force-logout` 으로 기존 세션 정리 후 `social-login` 재호출
   *
   * 웹 참조: `frontend/src/utils/duplicateLoginManager.js` 의 `forceLogout` 흐름 정합.
   */
  async confirmDuplicateLoginAndRetry(
    retryContext: DuplicateLoginRetryContext,
  ): Promise<DuplicateLoginRetryOutcome> {
    if (retryContext.provider === 'credentials') {
      return AuthService.confirmDuplicateLoginCredentials(retryContext);
    }
    return AuthService.confirmDuplicateLoginSocial(retryContext);
  },

  /**
   * 자격증명(이메일·비밀번호) 흐름 재시도.
   * 백엔드 `/confirm-duplicate-login` 응답은 `ApiResponse` 래퍼 + 평탄화 데이터.
   */
  async confirmDuplicateLoginCredentials(retryContext: {
    provider: 'credentials';
    email: string;
    password: string;
  }): Promise<DuplicateLoginRetryOutcome> {
    try {
      const raw = await apiPost<Record<string, unknown>>(AUTH_API.CONFIRM_DUPLICATE_LOGIN, {
        email: retryContext.email,
        password: retryContext.password,
        confirmTerminate: true,
      });

      const inner = (unwrapApiResponse<Record<string, unknown>>(raw) ?? raw) as Record<
        string,
        unknown
      >;

      const userRaw = inner.user as SocialLoginApiUser | undefined;
      const accessToken = (inner.accessToken ?? inner.token) as string | undefined;
      const refreshToken = inner.refreshToken as string | undefined;

      if (userRaw && accessToken && refreshToken) {
        const user = mapApiUserToStoreUser(userRaw, accessToken);
        await applyAuthenticatedUser(
          user,
          { accessToken, refreshToken },
          pickSessionIdFromAuthPayload(raw),
        );
        return { kind: 'authenticated', user };
      }

      // 백엔드가 토큰을 반환하지 않을 수 있어, 동일 자격으로 일반 로그인 재호출하여 세션 보장
      const followUp = await AuthService.loginWithCredentials(
        retryContext.email,
        retryContext.password,
      );
      if (followUp.kind === 'authenticated') {
        return { kind: 'authenticated', user: followUp.user };
      }
      const fallbackMessage =
        followUp.kind === 'error' ? followUp.message : DUPLICATE_LOGIN_FALLBACK_MESSAGE;
      return { kind: 'error', message: fallbackMessage };
    } catch (error: unknown) {
      return { kind: 'error', message: readSignupErrorMessage(error) };
    }
  },

  /**
   * 소셜(KAKAO/NAVER) 흐름 재시도.
   * 이메일이 있으면 force-logout 으로 기존 세션 정리 후 social-login 재호출.
   * (백엔드 native social-login 은 모바일 UA 에서 중복 체크를 우회하므로 일반적으로 즉시 성공한다.)
   */
  async confirmDuplicateLoginSocial(retryContext: {
    provider: SocialAuthProvider;
    accessToken: string;
    userId: string | null;
    email: string | null;
    nickname: string | null;
    profileImage: string | null;
  }): Promise<DuplicateLoginRetryOutcome> {
    if (retryContext.email) {
      try {
        await apiPost(AUTH_API.FORCE_LOGOUT, { email: retryContext.email });
      } catch (e) {
        // force-logout 실패는 무시 — social-login 재호출로 새 세션이 생성됨
        if (__DEV__) {
          console.warn('[AuthService] force-logout 실패 (무시):', e);
        }
      }
    }

    try {
      const response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, {
        provider: retryContext.provider,
        accessToken: retryContext.accessToken,
        userId: retryContext.userId,
        email: retryContext.email,
        nickname: retryContext.nickname ?? '',
        profileImage: retryContext.profileImage ?? '',
      });

      if (
        response &&
        response.success &&
        response.user &&
        response.accessToken &&
        response.refreshToken
      ) {
        const user = mapApiUserToStoreUser(response.user, response.accessToken);
        await applyAuthenticatedUser(
          user,
          {
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          },
          pickSessionIdFromAuthPayload(response),
        );
        return { kind: 'authenticated', user };
      }

      return {
        kind: 'error',
        message: response?.message ?? '재로그인에 실패했습니다.',
      };
    } catch (error: unknown) {
      return { kind: 'error', message: readSignupErrorMessage(error) };
    }
  },

  /**
   * 로그아웃 — SDK 로그아웃 + 로컬 토큰 삭제 + 서버 로그아웃.
   *
   * <p>Build #16 (2026-06-10) 마이그레이션: GOOGLE provider 도 Native SDK 세션을 정리한다.</p>
   */
  async logout(provider?: 'KAKAO' | 'NAVER' | 'GOOGLE'): Promise<void> {
    try {
      if (provider === 'KAKAO' && isKakaoNativeLinked()) {
        await kakaoSDKLogout();
      } else if (provider === 'NAVER' && isNaverNativeLinked()) {
        await NaverLogin.logout();
      } else if (provider === 'GOOGLE') {
        await signOutFromGoogle();
      }

      await apiPost(AUTH_API.LOGOUT).catch(() => {
        // 서버 로그아웃 실패해도 로컬 정리 진행
      });
    } finally {
      await useAuthStore.getState().logout();
    }
  },

  /**
   * 토큰 갱신 — refreshToken으로 새 accessToken 발급
   */
  async refreshAccessToken(): Promise<Tokens | null> {
    try {
      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) return null;

      const raw = await apiPost<Record<string, unknown>>(AUTH_API.REFRESH_TOKEN, { refreshToken });
      if (!raw || typeof raw !== 'object') {
        return null;
      }
      if (raw.success === false) {
        await useAuthStore.getState().logout();
        return null;
      }
      const inner = unwrapApiResponse<Record<string, unknown>>(raw) ?? raw;

      let accessToken: string | undefined;
      if (typeof inner.accessToken === 'string') {
        accessToken = inner.accessToken;
      } else if (typeof inner.token === 'string') {
        accessToken = inner.token;
      }
      const nextRefresh = typeof inner.refreshToken === 'string' ? inner.refreshToken : undefined;

      if (accessToken && nextRefresh) {
        const tokens: Tokens = {
          accessToken,
          refreshToken: nextRefresh,
        };
        await useAuthStore.getState().updateTokens(tokens);
        return tokens;
      }

      return null;
    } catch {
      await useAuthStore.getState().logout();
      return null;
    }
  },
};
