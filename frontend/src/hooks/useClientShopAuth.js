/**
 * 내담자 쇼핑 화면 — 세션 준비 상태 (가드와 정렬)
 *
 * 로그인·역할·/login 이동은 ClientRouteGuard / ProtectedRoute 가 담당한다.
 * 이 훅은 hasCheckedSession 전 대기만 노출하며, SessionContext.isLoading 을
 * 화면 대기 게이트로 쓰지 않는다 (재확인 중 로딩 고착·이중 soft-kick 방지).
 *
 * @author MindGarden
 * @since 2026-05-19
 */

import { useSession } from '../contexts/SessionContext';

/**
 * @param {{
 *   requireLogin?: boolean,
 *   loginRedirectPath?: string
 * }} [options] loginRedirectPath 는 호출부 API 호환용(미사용). 리다이렉트는 가드 SSOT.
 * @returns {{
 *   sessionLoading: boolean,
 *   isLoggedIn: boolean,
 *   user: object|null,
 *   isAwaitingSession: boolean
 * }}
 */
export const useClientShopAuth = (options = {}) => {
  const { requireLogin = true } = options;
  const { isLoggedIn, hasCheckedSession, user } = useSession();
  // 전역 세션 재확인(isLoading)은 OR 하지 않는다
  const sessionLoading = !hasCheckedSession;
  const isAwaitingSession = requireLogin
    ? sessionLoading || !isLoggedIn
    : sessionLoading;

  return { sessionLoading, isLoggedIn, user, isAwaitingSession };
};
