/**
 * 중복 로그인 피해자 기기 — 서버가 구 Access/Refresh 를 무효화한 뒤
 * 로컬 토큰으로 UI 가 살아 남지 않도록 주기·포그라운드에서 세션을 확인하고
 * 필요 시 {@link performSignOut} 까지 탄다.
 *
 * 웹 `duplicateLoginManager` 폴링(60s) + forceLogout(/logout) 과 정합.
 * 테넌트 `duplicate-login.allowed=true` 이면 서버가 hasDuplicateLogin=false 를 주므로
 * 폴링만으로는 강제종료하지 않는다(401·refresh 실패 경로는 인터셉터가 처리).
 *
 * @author MindGarden
 * @since 2026-08-07
 */
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { apiGet } from '@/api/client';
import { AUTH_API } from '@/api/endpoints';
import { DUPLICATE_LOGIN_VICTIM_POLL_MS } from '@/constants/session';
import { performSignOut } from '@/services/auth/performSignOut';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  shouldForceSignOutFromDuplicatePoll,
  type DuplicateLoginPollPayload,
} from '@/utils/duplicateLoginSignal';

/**
 * 인증된 동안 중복 로그인 폴링·current-user 핑을 수행한다.
 * 401 은 api client 인터셉터가 performSignOut 한다.
 * hasDuplicateLogin=true 이고 allowed=false 이면 명시적으로 performSignOut.
 */
export function useDuplicateLoginVictimGuard(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const inFlightRef = useRef(false);
  const signOutStartedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      signOutStartedRef.current = false;
      return undefined;
    }

    const runCheck = async () => {
      if (inFlightRef.current || signOutStartedRef.current) {
        return;
      }
      inFlightRef.current = true;
      try {
        // 구 Access 가 서버에서 거부되면 401 → 인터셉터 → refresh 실패 → performSignOut
        await apiGet(AUTH_API.GET_CURRENT_USER);

        const poll = await apiGet<DuplicateLoginPollPayload>(AUTH_API.CHECK_DUPLICATE_LOGIN);
        if (shouldForceSignOutFromDuplicatePoll(poll)) {
          signOutStartedRef.current = true;
          await performSignOut();
        }
      } catch {
        /* 401·네트워크: 인터셉터 또는 다음 주기에 재시도 */
      } finally {
        inFlightRef.current = false;
      }
    };

    void runCheck();
    const intervalId = setInterval(() => {
      void runCheck();
    }, DUPLICATE_LOGIN_VICTIM_POLL_MS);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void runCheck();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      clearInterval(intervalId);
      sub.remove();
    };
  }, [isAuthenticated, accessToken]);
}
