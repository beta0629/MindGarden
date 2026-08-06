/**
 * 공용 signOut — 401·refresh 실패·UI 로그아웃이 동일 경로를 탄다.
 *
 * 순서: (선택) 소셜 SDK → unregisterToken → POST /auth/logout → SecureStore/store clear.
 * {@code clearTenant} 는 호출하지 않는다(테넌트 조기 삭제 시 재등록 403 방지).
 *
 * @author MindGarden
 * @since 2026-08-05
 */
import { logout as kakaoSDKLogout } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { NativeModules } from 'react-native';
import { apiPost } from '@/api/client';
import { AUTH_API } from '@/api/endpoints';
import { showInAppToast } from '@/components/organisms/InAppNotificationToast';
import { PUSH_PERMISSION_COPY } from '@/constants/pushPermissionCopy';
import { NotificationService } from '@/services/NotificationService';
import { signOutFromGoogle } from '@/services/auth/googleSignIn';
import { useAuthStore } from '@/stores/useAuthStore';

export type SignOutProvider = 'KAKAO' | 'NAVER' | 'GOOGLE';

export type PerformSignOutOptions = {
  provider?: SignOutProvider;
};

let inFlight: Promise<void> | null = null;

function isKakaoNativeLinked(): boolean {
  return NativeModules.RNKakaoLogins != null;
}

function isNaverNativeLinked(): boolean {
  return NativeModules.RNNaverLogin != null;
}

function toastUnregisterFailure(): void {
  showInAppToast({
    id: `${PUSH_PERMISSION_COPY.unregisterFailToastId}-${Date.now()}`,
    title: PUSH_PERMISSION_COPY.unregisterFailedTitle,
    body: PUSH_PERMISSION_COPY.unregisterFailedBody,
    icon: 'AlertTriangle',
  });
}

/**
 * 앱 전역 로그아웃. 중복 호출은 in-flight Promise를 공유한다.
 *
 * @param options 소셜 provider 가 있으면 해당 SDK 세션도 정리
 */
export async function performSignOut(options?: PerformSignOutOptions): Promise<void> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const provider = options?.provider;

    try {
      if (provider === 'KAKAO' && isKakaoNativeLinked()) {
        try {
          await kakaoSDKLogout();
        } catch {
          /* SDK 실패해도 서버·로컬 정리 진행 */
        }
      } else if (provider === 'NAVER' && isNaverNativeLinked()) {
        try {
          await NaverLogin.logout();
        } catch {
          /* noop */
        }
      } else if (provider === 'GOOGLE') {
        try {
          await signOutFromGoogle();
        } catch {
          /* noop */
        }
      }

      try {
        const unregistered = await NotificationService.unregisterToken();
        if (!unregistered) {
          // 로그아웃은 계속하되 실패를 가시화(조용히 삼키지 않음)
          // eslint-disable-next-line no-console -- reason 은 unregisterToken 내부에서 이미 기록
          console.warn('[performSignOut] unregister token returned false');
          toastUnregisterFailure();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unregister_failed';
        // eslint-disable-next-line no-console -- 토큰 원문 미포함, 메시지만
        console.warn('[performSignOut] unregister token failed', message);
        toastUnregisterFailure();
      }

      try {
        await apiPost(AUTH_API.LOGOUT);
      } catch {
        /* 서버 로그아웃 실패해도 로컬 정리 진행 */
      }
    } finally {
      // clearTenant 호출 금지 — 합의된 안전 범위: 테넌트는 유지(register 403 방지)
      await useAuthStore.getState().logout();
      inFlight = null;
    }
  })();

  return inFlight;
}
