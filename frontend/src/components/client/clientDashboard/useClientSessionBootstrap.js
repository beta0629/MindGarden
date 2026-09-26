/**
 * Client Dashboard — OAuth·localStorage 세션 부트스트랩
 *
 * <p>레거시 {@code oauth=success} 쿼리·{@code local_token} placeholder 로
 * setUser 만 호출해 팬텀 로그인하지 않는다. 실제 토큰이 있을 때만 restore 후
 * checkSession 으로 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import { useEffect } from 'react';
import { sessionManager } from '../../../utils/sessionManager';

const SESSION_RESTORE_DELAY_MS = 500;

export function useClientSessionBootstrap(checkSession) {
  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async() => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauth = urlParams.get('oauth');

      // 레거시 oauth=success 쿼리만으로 setUser 금지 — JWT 없는 팬텀 세션 차단.
      // soft SPA: 쿼리만 제거하고 서버 세션이 있으면 checkSession 으로 복원.
      if (oauth === 'success') {
        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
        if (isMounted) {
          await checkSession(true);
        }
        return;
      }

      const storedUser = localStorage.getItem('userInfo');
      const storedAccess = localStorage.getItem('accessToken');
      if (!storedUser || !storedAccess || storedAccess === 'local_token') {
        return;
      }

      try {
        const userInfo = JSON.parse(storedUser);
        const storedRefresh = localStorage.getItem('refreshToken');
        if (storedRefresh === 'local_refresh_token') {
          return;
        }
        sessionManager.setUser(userInfo, {
          accessToken: storedAccess,
          ...(storedRefresh ? { refreshToken: storedRefresh } : {})
        });
        if (isMounted) {
          await checkSession(true);
        }
      } catch (error) {
        console.error('localStorage 사용자 정보 파싱 실패:', error);
      }
    };

    if (!sessionIsLoggedIn && !sessionUser) {
      const timer = setTimeout(restoreSession, SESSION_RESTORE_DELAY_MS);
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [sessionIsLoggedIn, sessionUser, checkSession]);

  return { sessionUser, sessionIsLoggedIn };
}
