/**
 * 내담자 쇼핑 화면 — 세션·로그인 가드
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from './useSession';

/**
 * @returns {{ sessionLoading: boolean, isLoggedIn: boolean, user: object|null }}
 */
export const useClientShopAuth = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: sessionLoading, user } = useSession();

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [sessionLoading, isLoggedIn, navigate]);

  return { sessionLoading, isLoggedIn, user };
};
