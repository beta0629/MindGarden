/**
 * Client Dashboard — OAuth·localStorage 세션 부트스트랩
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import { useEffect } from 'react';
import { sessionManager } from '../../../utils/sessionManager';
import { USER_ROLES } from '../../../constants/roles';

const SESSION_RESTORE_DELAY_MS = 500;

export function useClientSessionBootstrap(checkSession) {
  const sessionUser = sessionManager.getUser();
  const sessionIsLoggedIn = sessionManager.isLoggedIn();

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async() => {
      const urlParams = new URLSearchParams(window.location.search);
      const oauth = urlParams.get('oauth');

      if (oauth === 'success') {
        const userInfo = {
          id: parseInt(urlParams.get('userId'), 10) || 0,
          email: urlParams.get('email') || '',
          name: decodeURIComponent(urlParams.get('name') || ''),
          nickname: decodeURIComponent(urlParams.get('nickname') || ''),
          role: urlParams.get('role') || USER_ROLES.CLIENT,
          profileImageUrl: decodeURIComponent(urlParams.get('profileImage') || ''),
          provider: urlParams.get('provider') || 'UNKNOWN'
        };

        sessionManager.setUser(userInfo, {
          accessToken: 'oauth2_token',
          refreshToken: 'oauth2_refresh_token'
        });

        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);

        if (isMounted) {
          await checkSession(true);
        }
        return;
      }

      const storedUser = localStorage.getItem('userInfo');
      if (!storedUser) return;

      try {
        const userInfo = JSON.parse(storedUser);
        sessionManager.setUser(userInfo, {
          accessToken: userInfo.accessToken || 'local_token',
          refreshToken: userInfo.refreshToken || 'local_refresh_token'
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
