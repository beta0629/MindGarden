/**
 * 로그인 후 클라이언트 유휴 4h 초과 시 performSignOut.
 * 웹 HTTP_SESSION_MAX_INACTIVE / SESSION_DURATION 정책과 정합.
 *
 * @author MindGarden
 * @since 2026-08-05
 */
import { useCallback, useEffect, useRef } from 'react';
import {
  AppState,
  type AppStateStatus,
  type GestureResponderEvent,
  type ViewProps,
} from 'react-native';
import {
  SESSION_IDLE_CHECK_INTERVAL_MS,
  SESSION_IDLE_MAX_MS,
} from '@/constants/session';
import { performSignOut } from '@/services/auth/performSignOut';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  evaluateSessionIdleSignOut,
  shouldRecordIdleActivity,
} from '@/utils/sessionIdle';

export type SessionIdleActivityCaptureProps = Pick<
  ViewProps,
  'onTouchStart' | 'onStartShouldSetResponderCapture'
>;

/**
 * 인증 상태에서 터치·포그라운드 활동을 추적하고, 유휴 4h 초과 시 공용 signOut.
 *
 * @returns 루트 View에 붙일 활동 캡처 props (터치 가로채기 없음)
 */
export function useSessionIdleSignOut(): SessionIdleActivityCaptureProps {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastActivityAtRef = useRef(Date.now());
  const signOutStartedRef = useRef(false);

  const resetActivity = useCallback((nowMs: number = Date.now()) => {
    lastActivityAtRef.current = nowMs;
    signOutStartedRef.current = false;
  }, []);

  const recordActivity = useCallback(() => {
    if (!useAuthStore.getState().isAuthenticated) {
      return;
    }
    const nowMs = Date.now();
    if (!shouldRecordIdleActivity(lastActivityAtRef.current, nowMs)) {
      return;
    }
    lastActivityAtRef.current = nowMs;
  }, []);

  const checkAndSignOutIfIdle = useCallback(() => {
    const { isAuthenticated: authed } = useAuthStore.getState();
    const decision = evaluateSessionIdleSignOut({
      isAuthenticated: authed,
      lastActivityAtMs: lastActivityAtRef.current,
      nowMs: Date.now(),
      idleMaxMs: SESSION_IDLE_MAX_MS,
    });
    if (decision !== 'sign_out' || signOutStartedRef.current) {
      return;
    }
    signOutStartedRef.current = true;
    void performSignOut().finally(() => {
      /* in-flight 공유는 performSignOut 내부; 재로그인 시 resetActivity */
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      signOutStartedRef.current = false;
      return;
    }
    resetActivity();

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        checkAndSignOutIfIdle();
        if (useAuthStore.getState().isAuthenticated) {
          recordActivity();
        }
      }
    };

    const sub = AppState.addEventListener('change', onAppState);
    const intervalId = setInterval(checkAndSignOutIfIdle, SESSION_IDLE_CHECK_INTERVAL_MS);

    return () => {
      sub.remove();
      clearInterval(intervalId);
    };
  }, [isAuthenticated, resetActivity, recordActivity, checkAndSignOutIfIdle]);

  const onTouchStart = useCallback(
    (_event: GestureResponderEvent) => {
      recordActivity();
    },
    [recordActivity],
  );

  const onStartShouldSetResponderCapture = useCallback(() => {
    recordActivity();
    return false;
  }, [recordActivity]);

  return {
    onTouchStart,
    onStartShouldSetResponderCapture,
  };
}
