/**
 * Homepage boot gate (poster-ready).
 *
 * Poster gate (`home-boot-ready` / {@link HOME_BOOT_READY_EVENT}): unblocks
 * deferred work after the LCP poster — owned by HomeBootInline.
 * Visual top progress bar removed (v4 stacked-alpha) — session key is marked
 * when {@link dispatchHomeBootReady} fires.
 */

export const HOME_BOOT_SESSION_KEY = 'mg-home-boot-done-v1';
export const HOME_BOOT_READY_EVENT = 'mg-home-boot-ready';
export const HOME_BOOT_TIMEOUT_MS = 6000;

/** Hero / poster path decided this page life. */
let homeBootHeroDecided = false;

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

/** True after {@link dispatchHomeBootReady} this page load (in-memory). */
export function isHomeBootHeroDecided(): boolean {
  return homeBootHeroDecided;
}

/**
 * Hero / poster path ready. Marks session-once and unblocks deferred work.
 * (No visual progress bar.)
 */
export function dispatchHomeBootReady(): void {
  if (typeof window === 'undefined') return;
  homeBootHeroDecided = true;
  markHomeBootCompleted();
  window.dispatchEvent(new CustomEvent(HOME_BOOT_READY_EVENT));
  document.documentElement.classList.add('home-boot-ready');
}

/**
 * Resolves when the homepage poster gate is ready (session already done,
 * ready event / class, or timeout). Does not block LCP text.
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

/** Test helper — reset in-memory boot flags between cases. */
export function __resetHomeBootStateForTests(): void {
  homeBootHeroDecided = false;
}
