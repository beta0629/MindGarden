/**
 * 최신 요청만 유효하게 만드는 AbortController + epoch 가드.
 * 경합(느린 이전 응답이 최신 응답 뒤에 도착) 시 stale 반영을 막는다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

/**
 * @typedef {object} LatestRequestHandle
 * @property {number} requestId
 * @property {AbortSignal|undefined} signal
 * @property {() => boolean} isStale
 * @property {() => boolean} isCurrent
 */

/**
 * @returns {{
 *   begin: () => LatestRequestHandle,
 *   abort: () => void,
 *   getEpoch: () => number
 * }}
 */
export function createLatestRequestGuard() {
  let epoch = 0;
  /** @type {AbortController|null} */
  let controller = null;

  return {
    /**
     * 이전 요청을 abort 하고 새 epoch 핸들을 반환한다.
     * @returns {LatestRequestHandle}
     */
    begin() {
      if (controller) {
        try {
          controller.abort();
        } catch (_err) {
          // AbortController.abort 는 동기·무해 — 환경별 예외만 무시
        }
      }
      const nextController =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
      controller = nextController;
      const requestId = epoch + 1;
      epoch = requestId;
      const signal = nextController ? nextController.signal : undefined;
      const isCurrent = () => requestId === epoch && !Boolean(signal?.aborted);
      return {
        requestId,
        signal,
        isStale: () => !isCurrent(),
        isCurrent
      };
    },

    /**
     * 진행 중 요청을 취소하고 epoch 를 올려 in-flight 를 stale 처리한다.
     */
    abort() {
      if (controller) {
        try {
          controller.abort();
        } catch (_err) {
          // ignore
        }
        controller = null;
      }
      epoch += 1;
    },

    /**
     * @returns {number}
     */
    getEpoch() {
      return epoch;
    }
  };
}

/**
 * AbortError / 취소 여부를 판별한다.
 * @param {unknown} err
 * @returns {boolean}
 */
export function isAbortError(err) {
  if (err == null) {
    return false;
  }
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
    return err.name === 'AbortError';
  }
  const name = /** @type {{ name?: string }} */ (err).name;
  return name === 'AbortError';
}

export default createLatestRequestGuard;
