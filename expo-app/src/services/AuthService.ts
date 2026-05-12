/**
 * AuthService — 소셜 로그인 SDK 래핑 + 백엔드 JWT 발급
 * 카카오·네이버 네이티브 SDK → 백엔드 /api/auth/social-login → JWT 발급
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
import { Platform } from 'react-native';
import { apiPost } from '../api/client';
import { AUTH_API } from '../api/endpoints';
import { useAuthStore, User, Tokens } from '../stores/useAuthStore';

interface SocialLoginResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  requiresSignup?: boolean;
  socialUserInfo?: {
    email: string;
    nickname: string;
    provider: string;
    socialId: string;
  };
  message?: string;
}

let naverInitialized = false;

const initializeNaverSDK = () => {
  if (naverInitialized) return;

  const consumerKey = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '';
  const consumerSecret = process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '';
  const appName = 'MindGarden';

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
    initConfig.serviceUrlSchemeIOS = 'mindgarden-naver';
  }

  NaverLogin.initialize(initConfig);
  naverInitialized = true;
};

export const AuthService = {
  /**
   * 카카오 로그인
   * SDK 토큰 획득 → 프로필 조회 → 백엔드 소셜 로그인 → JWT 수신 → SecureStore 저장
   */
  async loginWithKakao(): Promise<SocialLoginResponse> {
    try {
      const token = await kakaoSDKLogin();
      const profile = await getKakaoProfile();

      const response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, {
        provider: 'KAKAO',
        accessToken: token.accessToken,
        userId: profile.id,
        email: profile.email,
        nickname: profile.nickname,
        profileImage: profile.profileImageUrl,
      });

      if (response?.success && response.user && response.accessToken && response.refreshToken) {
        await useAuthStore.getState().login(response.user, {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        return { success: true, user: response.user };
      }

      if (response?.requiresSignup) {
        return {
          success: false,
          requiresSignup: true,
          socialUserInfo: response.socialUserInfo,
        };
      }

      return { success: false, message: response?.message ?? '카카오 로그인에 실패했습니다.' };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : '카카오 로그인 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  },

  /**
   * 네이버 로그인
   * SDK 토큰 획득 → 프로필 조회 → 백엔드 소셜 로그인 → JWT 수신 → SecureStore 저장
   */
  async loginWithNaver(): Promise<SocialLoginResponse> {
    try {
      initializeNaverSDK();

      const loginResult = await NaverLogin.login();

      let accessToken: string | null = null;

      if (loginResult?.successResponse?.accessToken) {
        accessToken = loginResult.successResponse.accessToken;
      }

      if (!accessToken) {
        return { success: false, message: '네이버 로그인 응답에서 토큰을 찾을 수 없습니다.' };
      }

      let userId: string | null = null;
      let email: string | null = null;
      let nickname: string | null = null;
      let profileImage: string | null = null;

      try {
        const profileResult = await NaverLogin.getProfile(accessToken);
        if (profileResult?.response) {
          userId = profileResult.response.id ?? null;
          email = profileResult.response.email ?? null;
          nickname = profileResult.response.nickname ?? profileResult.response.name ?? null;
          profileImage = profileResult.response.profile_image ?? null;
        }
      } catch {
        // 프로필 가져오기 실패 — 백엔드에서 accessToken으로 조회 가능
      }

      const response = await apiPost<SocialLoginResponse>(AUTH_API.SOCIAL_LOGIN, {
        provider: 'NAVER',
        accessToken,
        userId,
        email,
        nickname: nickname ?? '',
        profileImage: profileImage ?? '',
      });

      if (response?.success && response.user && response.accessToken && response.refreshToken) {
        await useAuthStore.getState().login(response.user, {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        return { success: true, user: response.user };
      }

      if (response?.requiresSignup) {
        return {
          success: false,
          requiresSignup: true,
          socialUserInfo: response.socialUserInfo,
        };
      }

      return { success: false, message: response?.message ?? '네이버 로그인에 실패했습니다.' };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : '네이버 로그인 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  },

  /**
   * ID/PW 로그인
   */
  async loginWithCredentials(
    email: string,
    password: string,
  ): Promise<SocialLoginResponse> {
    try {
      const response = await apiPost<SocialLoginResponse>(AUTH_API.LOGIN, {
        email,
        password,
      });

      if (response?.success && response.user && response.accessToken && response.refreshToken) {
        await useAuthStore.getState().login(response.user, {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        });
        return { success: true, user: response.user };
      }

      return { success: false, message: response?.message ?? '로그인에 실패했습니다.' };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.';
      return { success: false, message };
    }
  },

  /**
   * 로그아웃 — SDK 로그아웃 + 로컬 토큰 삭제 + 서버 로그아웃
   */
  async logout(provider?: 'KAKAO' | 'NAVER'): Promise<void> {
    try {
      if (provider === 'KAKAO') {
        await kakaoSDKLogout();
      } else if (provider === 'NAVER') {
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

      const response = await apiPost<{ accessToken: string; refreshToken: string }>(
        AUTH_API.REFRESH_TOKEN,
        { refreshToken },
      );

      if (response?.accessToken && response?.refreshToken) {
        const tokens: Tokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
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
