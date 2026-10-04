/**
 * 내담자 화면 세션 준비 SSOT.
 *
 * 로그인 여부 판단과 /login 이동은 {@link ../components/client/ClientRouteGuard} 한 곳에서만 한다.
 * 화면은 이 훅의 ready 가 true 일 때만 본인 데이터 로드를 시작하고,
 * SessionContext.isLoading(전역 세션 재확인 플래그)을 화면 로딩으로 쓰지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import { useSession } from '../contexts/SessionContext';
import { useStableUserId } from './useStableUserId';

/**
 * @returns {{
 *   ready: boolean,
 *   user: object|null,
 *   userId: string|number|null,
 *   userRef: React.MutableRefObject<object|null|undefined>
 * }}
 */
export function useClientSessionReady() {
  const { user, hasCheckedSession } = useSession();
  const { userId, userRef } = useStableUserId(user);
  const ready = Boolean(hasCheckedSession) && userId != null && userId !== '';
  return { ready, user, userId, userRef };
}

export default useClientSessionReady;
