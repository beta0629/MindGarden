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
import type { User, Tokens } from '../stores/useAuthStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useTenantStore } from '../stores/useTenantStore';
import { isExpoGoApp } from '@/lib/getMmkv';
import { getApiBaseUrl } from '../config/apiBaseUrl';
import { normalizeKoreanMobileDigits } from '../utils/phoneNormalize';
import { syncTenantFromAccessToken } from '@/utils/syncTenantFromAccessToken';
import { setCachedJsessionId, setJsessionId } from '@/utils/sessionCookie';
import { coerceApiRoleString, mapApiRoleToStoreRole } from '@/utils/adminRole';

export type SocialAuthProvider = 'KAKAO' | 'NAVER';

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

export type SocialLoginOutcome =
  | { kind: 'authenticated'; user: User }
  | { kind: 'requiresSignup'; socialUserInfo: SocialUserInfoDraft; provider: SocialAuthProvider }
  | {
      kind: 'requiresPhoneAccountSelection';
      selectionToken: string;
      provider: SocialAuthProvider;
      message?: string;
    }
  | { kind: 'error'; message: string };

let naverInitialized = false;

const AUTH_SERVICE_SOCIAL_LOGIN_LOG_PREFIX = '[AuthService][social-login]';

type SocialLoginDebugOutcome =
  | 'authenticated'
  | 'requiresSignup'
  | 'requiresPhoneAccountSelection'
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

function mapApiUserToStoreUser(raw: SocialLoginApiUser): User {
  const role = mapApiRoleToStoreRole(coerceApiRoleString(raw.role) ?? undefined);
  return {
    id: raw.id,
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

function readOptionalString(v: unknown): string | undefined {
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length ? t : undefined;
  }
  return undefined;
}

function readKakaoNestedAccount(profile: Record<string, unknown>): Record<string, unknown> | undefined {
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
  const email =
    !draft.email?.trim() && profileEmail?.trim() ? profileEmail.trim() : draft.email;

  const phoneRaw =
    readOptionalString(rec.phoneNumber) ??
    readOptionalString(rec.phone_number) ??
    readOptionalString(rec.phone) ??
    (ka
      ? readOptionalString(ka.phone_number) ??
        readOptionalString(ka.phoneNumber) ??
        readOptionalString(ka.phone)
      : undefined);
  const normalizedPhone = normalizeKoreanMobileDigits(phoneRaw);
  const phone = normalizedPhone ?? draft.phone;

  const realName =
    readOptionalString(rec.name) ?? (ka ? readOptionalString(ka.name) : undefined);

  let nickname = draft.nickname?.trim() ?? '';
  if (!nickname) {
    nickname =
      readOptionalString(rec.nickname) ??
      readOptionalString(rec.displayName) ??
      (realName?.trim() ?? '');
  }

  const initialDisplayName =
    realName && realName.trim().length >= 2
      ? realName.trim()
      : draft.initialDisplayName;

  return {
    ...draft,
    email,
    nickname: nickname || draft.nickname,
    phone,
    realName: realName ?? draft.realName,
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

  let nickname = draft.nickname?.trim() ?? '';
  if (!nickname) {
    nickname =
      readOptionalString(response.nickname) ??
      readOptionalString(response.name) ??
      '';
  }

  return {
    ...draft,
    email,
    nickname: nickname || draft.nickname,
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
    email: info.email ?? '',
    nickname: info.nickname ?? '',
    provider,
    providerUserId: String(pid),
    profileImageUrl,
  };
}

function mapNativeSocialResponse(
  response: SocialLoginResponse | undefined,
  provider: SocialAuthProvider,
  profileImageUrl?: string,
): SocialLoginOutcome {
  if (!response) {
    return { kind: 'error', message: '서버 응답이 없습니다.' };
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
    const user = mapApiUserToStoreUser(response.user);
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
  if (sessionId) {
    await setJsessionId(sessionId);
    setCachedJsessionId(sessionId);
  }
  await useAuthStore.getState().login(user, tokens);
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
  const consumerKey = (extra?.naverClientId ?? process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '').trim();
  const consumerSecret = (
    extra?.naverClientSecret ?? process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ??
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

      const response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, {
        provider: 'KAKAO',
        accessToken: token.accessToken,
        userId: profile.id,
        email: profile.email,
        nickname: profile.nickname,
        profileImage: profileImageUrl,
      });

      const mapped = mapNativeSocialResponse(response, 'KAKAO', profileImageUrl);
      logSocialLoginDebugResponse(response, mapped);
      if (mapped.kind === 'authenticated') {
        await applyAuthenticatedUser(
          mapped.user,
          {
            accessToken: response.accessToken as string,
            refreshToken: response.refreshToken as string,
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

      const response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, {
        provider: 'NAVER',
        accessToken,
        userId,
        email,
        nickname: nickname ?? '',
        profileImage: profileImage ?? '',
      });

      const mapped = mapNativeSocialResponse(response, 'NAVER', profileImage ?? undefined);
      logSocialLoginDebugResponse(response, mapped);
      if (mapped.kind === 'authenticated') {
        await applyAuthenticatedUser(
          mapped.user,
          {
            accessToken: response.accessToken as string,
            refreshToken: response.refreshToken as string,
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
   * 가입 완료 후 동일 제공자로 social-login 재호출 (스펙 SNS_SIMPLE_SIGNUP_SPEC 4.1)
   */
  async loginWithProviderAfterSignup(provider: SocialAuthProvider): Promise<SocialLoginOutcome> {
    if (provider === 'KAKAO') {
      return AuthService.loginWithKakao();
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
   */
  async loginWithCredentials(
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    user?: User;
    message?: string;
  }> {
    try {
      const raw = await apiPost<Record<string, unknown>>(AUTH_API.LOGIN, {
        email,
        password,
      });

      const inner = (unwrapApiResponse<Record<string, unknown>>(raw) ?? raw) as Record<
        string,
        unknown
      >;

      const userRaw = inner.user as SocialLoginApiUser | undefined;
      const accessToken = (inner.accessToken ?? inner.token) as string | undefined;
      const refreshToken = inner.refreshToken as string | undefined;

      if (userRaw && accessToken && refreshToken) {
        const user = mapApiUserToStoreUser(userRaw);
        await applyAuthenticatedUser(
          user,
          { accessToken, refreshToken },
          pickSessionIdFromAuthPayload(raw),
        );
        return { success: true, user };
      }

      const msg =
        (typeof raw === 'object' && raw !== null && typeof raw.message === 'string'
          ? raw.message
          : null) ??
        (typeof inner.message === 'string' ? inner.message : null) ??
        '로그인에 실패했습니다.';
      return { success: false, message: msg };
    } catch (error: unknown) {
      return { success: false, message: readSignupErrorMessage(error) };
    }
  },

  /**
   * 로그아웃 — SDK 로그아웃 + 로컬 토큰 삭제 + 서버 로그아웃
   */
  async logout(provider?: 'KAKAO' | 'NAVER'): Promise<void> {
    try {
      if (provider === 'KAKAO' && isKakaoNativeLinked()) {
        await kakaoSDKLogout();
      } else if (provider === 'NAVER' && isNaverNativeLinked()) {
        await NaverLogin.logout();
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
      const nextRefresh =
        typeof inner.refreshToken === 'string' ? inner.refreshToken : undefined;

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
