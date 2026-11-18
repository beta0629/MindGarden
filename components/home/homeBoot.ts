/** Session-once homepage boot gate (progress bar + hero 3D reveal). */

export const HOME_BOOT_SESSION_KEY = 'mg-home-boot-done-v1';
export const HOME_BOOT_READY_EVENT = 'mg-home-boot-ready';
export const HOME_BOOT_PROGRESS_EVENT = 'mg-home-boot-progress';
export const HOME_BOOT_TIMEOUT_MS = 6000;
/** Soft fade when hero 3D / boot reveal completes. */
export const HOME_BOOT_FADE_MS = 400;

export type HomeBootProgressDetail = {
  ratio: number;
  done: boolean;
};

export function hasHomeBootCompleted(): boolean {
  try {
    return sessionStorage.getItem(HOME_BOOT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHomeBootCompleted(): void {
  try {
    sessionStorage.setItem(HOME_BOOT_SESSION_KEY, '1');
  } catch {
    /* private mode / blocked storage */
  }
}

export function dispatchHomeBootProgress(ratio: number, done = false): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<HomeBootProgressDetail>(HOME_BOOT_PROGRESS_EVENT, {
      detail: { ratio: Math.min(1, Math.max(0, ratio)), done },
    }),
  );
}

export function dispatchHomeBootReady(): void {
  if (typeof window === 'undefined') return;
  markHomeBootCompleted();
  dispatchHomeBootProgress(1, true);
  window.dispatchEvent(new CustomEvent(HOME_BOOT_READY_EVENT));
  document.documentElement.classList.add('home-boot-ready');
}

/**
 * Resolves when the homepage boot gate is ready (session already done,
 * ready event, or timeout). Does not block LCP text.
 */
export function whenHomeBootReady(
  timeoutMs = HOME_BOOT_TIMEOUT_MS,
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (hasHomeBootCompleted()) return Promise.resolve();
  if (document.documentElement.classList.contains('home-boot-ready')) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener(HOME_BOOT_READY_EVENT, onReady);
      window.clearTimeout(timer);
      resolve();
    };
    const onReady = () => finish();
    window.addEventListener(HOME_BOOT_READY_EVENT, onReady);
    const timer = window.setTimeout(finish, timeoutMs);
  });
}
