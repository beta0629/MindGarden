/**
 * userId 변경 시에만 initial resource load.
 * silent checkSession 으로 user 객체가 갱신돼도 userId 가 같으면 재로드하지 않는다.
 *
 * loadFn / onMissingUserId 는 ref 로 두어 인라인 콜백이 effect 를 재실행하지 않게 한다
 * (세션 ping → 리렌더 → setLoading(true) 무한 스피너 방지).
 *
 * ClientSettings / softRefresh SSOT 패턴 캡슐화.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { useEffect, useRef } from 'react';

/**
 * @param {object} params
 * @param {string|number|null|undefined} params.userId
 * @param {(options?: { silent?: boolean }) => Promise<unknown>} params.loadFn
 *   — softRefresh 호환 (첫 인자 options)
 * @param {boolean} [params.enabled=true] — false 이면 로드 스킵 (세션 로딩 중 등)
 * @param {() => void} [params.onMissingUserId] — userId 없을 때 (예: setLoading(false))
 * @param {unknown[]} [params.extraDeps=[]] — period/filter 등 의도적 재로드 키
 */
export function useUserIdScopedLoad({
  userId,
  loadFn,
  enabled = true,
  onMissingUserId,
  extraDeps = []
}) {
  const loadFnRef = useRef(loadFn);
  loadFnRef.current = loadFn;
  const onMissingUserIdRef = useRef(onMissingUserId);
  onMissingUserIdRef.current = onMissingUserId;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    if (userId == null || userId === '') {
      if (typeof onMissingUserIdRef.current === 'function') {
        onMissingUserIdRef.current();
      }
      return undefined;
    }
    void loadFnRef.current({ silent: false });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadFn/onMissingUserId 는 ref; extraDeps 만 호출자 명시
  }, [userId, enabled, ...extraDeps]);
}

export default useUserIdScopedLoad;
