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
 * 세션 확인 중·미로그인 시에도 호출 페이지는 `ShopClientSessionLoading` 등으로 DOM을 유지한다.
 *
 * @returns {{
 *   sessionLoading: boolean,
 *   isLoggedIn: boolean,
 *   user: object|null,
 *   isAwaitingSession: boolean
 * }}
 */
export const useClientShopAuth = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isLoading: sessionLoading, user } = useSession();
  const isAwaitingSession = sessionLoading || !isLoggedIn;

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
    }
  }, [sessionLoading, isLoggedIn, navigate]);

  return { sessionLoading, isLoggedIn, user, isAwaitingSession };
};
