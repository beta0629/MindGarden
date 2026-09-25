/**
 * 내담자 쇼핑 화면 — 세션·로그인 가드
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

/**
 * @param {{
 *   requireLogin?: boolean,
 *   loginRedirectPath?: string
 * }} [options]
 * @returns {{
 *   sessionLoading: boolean,
 *   isLoggedIn: boolean,
 *   user: object|null,
 *   isAwaitingSession: boolean
 * }}
 */
export const useClientShopAuth = (options = {}) => {
  const { requireLogin = true, loginRedirectPath } = options;
  const navigate = useNavigate();
  const { isLoggedIn, isLoading, hasCheckedSession, user } = useSession();
  const sessionLoading = !hasCheckedSession || isLoading;
  const isAwaitingSession = requireLogin
    ? sessionLoading || !isLoggedIn
    : sessionLoading;

  useEffect(() => {
    if (!requireLogin) {
      return;
    }
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn) {
      const redirectQuery = loginRedirectPath
        ? `?redirect=${encodeURIComponent(loginRedirectPath)}`
        : '';
      navigate(`/login${redirectQuery}`, { replace: true });
    }
  }, [sessionLoading, isLoggedIn, navigate, requireLogin, loginRedirectPath]);

  return { sessionLoading, isLoggedIn, user, isAwaitingSession };
};
