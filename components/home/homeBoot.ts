/**
 * Session-once homepage boot gate.
 *
 * Poster gate (`home-boot-ready` / {@link HOME_BOOT_READY_EVENT}): unblocks
 * deferred work after the LCP poster — owned by HomeBootInline.
 * Visual bar dismiss + session key: owned by HomeBootProgress after the hero
 * decision ({@link dispatchHomeBootReady}) and min-visible time.
 * Soft-GL / fail may fire ready before the bar mounts — sticky
 * {@link isHomeBootHeroDecided} lets the bar still show then finish.
 */

export const HOME_BOOT_SESSION_KEY = 'mg-home-boot-done-v1';
export const HOME_BOOT_READY_EVENT = 'mg-home-boot-ready';
export const HOME_BOOT_PROGRESS_EVENT = 'mg-home-boot-progress';
export const HOME_BOOT_TIMEOUT_MS = 6000;
/** Soft fade when hero 3D / boot reveal completes. */
export const HOME_BOOT_FADE_MS = 400;
/** Keep the cream/green bar visible at least this long (no flash). */
export const HOME_BOOT_MIN_VISIBLE_MS = 300;
/** Safety dismiss if hero never signals (idle + GLB can exceed poster timeout). */
export const HOME_BOOT_BAR_TIMEOUT_MS = 15000;
/**
 * Soft ceiling while waiting for hero decision.
 * Must match `.home-boot-progress__bar.is-easing` scaleX in `app/globals.css`.
 */
export const HOME_BOOT_EASE_CEILING = 0.9;
/**
 * Wait-phase CSS `transition` duration (ms) — 0.35 → {@link HOME_BOOT_EASE_CEILING}.
 * Must match `transition: transform 8s …` on `.home-boot-progress__bar` in globals.css.
 * Compositor-owned so the bar keeps moving when JS is blocked on hero GLB.
 */
export const HOME_BOOT_EASE_DURATION_MS = 8000;

export type HomeBootProgressDetail = {
  ratio: number;
  done: boolean;
};

/** Hero GLB / soft-GL / fail decided this page life (may precede bar mount). */
let homeBootHeroDecided = false;
/** Visual bar has painted at least once this page life. */
let homeBootBarShown = false;
let homeBootBarShownWaiters: Array<() => void> = [];

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

const HOME_BOOT_BAR_SHOWN_EVENT = 'mg-home-boot-bar-shown';

type HomeBootWindow = Window & { __mgHomeBootBarShown?: number };

function readInlineBarShownFlag(): boolean {
  if (typeof window === 'undefined') return false;
  return (window as HomeBootWindow).__mgHomeBootBarShown === 1;
}

/**
 * Bar painted — unblocks soft-GL finish waiters that must not dismiss before show.
 */
export function notifyHomeBootBarShown(): void {
  if (homeBootBarShown) return;
  homeBootBarShown = true;
  if (typeof window !== 'undefined') {
    (window as HomeBootWindow).__mgHomeBootBarShown = 1;
  }
  const waiters = homeBootBarShownWaiters;
  homeBootBarShownWaiters = [];
  for (const resolve of waiters) resolve();
}

/**
 * Resolves when the visual boot bar has been shown (inline or React), session
 * already done (return visit), or timeout (belt so soft-GL cannot hang).
 */
export function whenHomeBootBarShown(
  timeoutMs = HOME_BOOT_MIN_VISIBLE_MS + 2000,
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (homeBootBarShown || hasHomeBootCompleted() || readInlineBarShownFlag()) {
    notifyHomeBootBarShown();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener(HOME_BOOT_BAR_SHOWN_EVENT, onShown);
      window.clearTimeout(timer);
      resolve();
    };
    const onShown = () => {
      notifyHomeBootBarShown();
      finish();
    };
    homeBootBarShownWaiters.push(finish);
    window.addEventListener(HOME_BOOT_BAR_SHOWN_EVENT, onShown);
    const timer = window.setTimeout(finish, timeoutMs);
  });
}

export function dispatchHomeBootProgress(ratio: number, done = false): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<HomeBootProgressDetail>(HOME_BOOT_PROGRESS_EVENT, {
      detail: { ratio: Math.min(1, Math.max(0, ratio)), done },
    }),
  );
}

/**
 * Hero decision complete (GLB mounted, soft-GL poster fallback, or mount fail).
 * Signals the visual boot bar via progress `done`. Does **not** write the
 * session-once key — HomeBootProgress marks that after min-visible so an
 * early soft-GL probe cannot skip the bar.
 * Also ensures the poster gate class/event so deferred work is unblocked.
 */
export function dispatchHomeBootReady(): void {
  if (typeof window === 'undefined') return;
  homeBootHeroDecided = true;
  dispatchHomeBootProgress(1, true);
  window.dispatchEvent(new CustomEvent(HOME_BOOT_READY_EVENT));
  document.documentElement.classList.add('home-boot-ready');
}

/**
 * Resolves when the homepage *poster* gate is ready (session already done,
 * ready event / class, or timeout). Does not wait on hero 3D.
 * Does not block LCP text.
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
  homeBootBarShown = false;
  homeBootBarShownWaiters = [];
}
