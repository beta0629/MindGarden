/**
 * 세션 user 객체에서 안정 키(userId) + ref 추출.
 * silent checkSession SET_USER 로 user 참조가 바뀌어도 userId 가 같으면
 * initial load effect 를 재실행하지 않는다 (ClientSettings 패턴).
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { useRef } from 'react';

/**
 * @param {object|null|undefined} user
 * @returns {{ userId: string|number|null, userRef: React.MutableRefObject<object|null|undefined> }}
 */
export function useStableUserId(user) {
  const userId = user?.id ?? null;
  const userRef = useRef(user);
  userRef.current = user;
  return { userId, userRef };
}

export default useStableUserId;
