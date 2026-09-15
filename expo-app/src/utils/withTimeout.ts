/**
 * Promise 에 상한 시간을 두고, 초과 시 reject 한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */

export class TimeoutError extends Error {
  readonly timedOut = true as const;

  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * @param promise 원본 Promise
 * @param timeoutMs 상한 (ms). 0 이하면 timeout 없이 그대로 반환
 * @param label 에러 메시지용 식별자
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label = 'operation',
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }
  });
}
