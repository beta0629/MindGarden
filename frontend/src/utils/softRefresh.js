/**
 * Admin FE soft refresh — mutation 후 페이지 로딩(AdminCommonLayout)을 건드리지 않는 재조회.
 *
 * Initial load: options.silent 생략/false → setLoading 사용 가능.
 * Post-mutation: softRefresh / silent:true → setLoading 미호출.
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

/**
 * 리소스 로드 래퍼. silent=true 이면 setLoading 을 호출하지 않는다.
 *
 * @template T
 * @param {{ silent?: boolean }} [options]
 * @param {(value: boolean) => void} setLoading
 * @param {() => Promise<T>} loader
 * @returns {Promise<T>}
 */
export async function runResourceLoad(options, setLoading, loader) {
  const silent = options?.silent === true;
  if (!silent && typeof setLoading === 'function') {
    setLoading(true);
  }
  try {
    return await loader();
  } finally {
    if (!silent && typeof setLoading === 'function') {
      setLoading(false);
    }
  }
}

/**
 * 항상 silent 인 post-mutation refresh.
 * loadFn 은 첫 인자로 `{ silent?: boolean, ... }` options 를 받는다.
 *
 * @template T
 * @param {(options: { silent?: boolean } & Record<string, unknown>) => Promise<T>} loadFn
 * @param {Record<string, unknown>} [options]
 * @returns {Promise<T>}
 */
export function softRefresh(loadFn, options = {}) {
  return loadFn({ ...options, silent: true });
}

export default {
  runResourceLoad,
  softRefresh
};
