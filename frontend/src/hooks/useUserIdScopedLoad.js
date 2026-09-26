/**
 * userId 변경 시에만 initial resource load.
 * silent checkSession 으로 user 객체가 갱신돼도 userId 가 같으면 재로드하지 않는다.
 *
 * ClientSettings / softRefresh SSOT 패턴 캡슐화.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import { useEffect } from 'react';

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
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    if (userId == null || userId === '') {
      if (typeof onMissingUserId === 'function') {
        onMissingUserId();
      }
      return undefined;
    }
    void loadFn({ silent: false });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- extraDeps 는 호출자가 명시
  }, [userId, loadFn, enabled, onMissingUserId, ...extraDeps]);
}

export default useUserIdScopedLoad;
