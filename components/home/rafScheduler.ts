/**
 * Single requestAnimationFrame fan-out for homepage hero + v3.7 scenes.
 * Cancel the global rAF when nothing is active; pause all while document.hidden.
 */

export type RafCallback = (now: number) => void;

export type SubscribeOpts = {
  /** Run every pumped frame while subscribed (and not paused). */
  continuous?: boolean;
};

type Entry = {
  fn: RafCallback;
  continuous: boolean;
  dirty: boolean;
  /** Offscreen / scene-local pause — skipped until resumed. */
  paused: boolean;
};

const entries = new Map<string, Entry>();

let rafId = 0;
let visibilityBound = false;
let docHidden =
  typeof document !== 'undefined' ? Boolean(document.hidden) : false;

/** Optional debug: count pumps while any subscriber is active. */
let debugPumpCount = 0;

function ensureVisibilityListener(): void {
  if (visibilityBound || typeof document === 'undefined') return;
  visibilityBound = true;
  document.addEventListener('visibilitychange', () => {
    docHidden = Boolean(document.hidden);
    if (docHidden) {
      cancelPump();
    } else {
      kick();
    }
  });
}

function cancelPump(): void {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
}

function needsPump(): boolean {
  if (docHidden) return false;
  for (const e of entries.values()) {
    if (e.paused) continue;
    if (e.continuous || e.dirty) return true;
  }
  return false;
}

function pump(now: number): void {
  rafId = 0;
  if (docHidden) {
    // Stay cancelled while hidden — visibilitychange will kick() on resume.
    return;
  }
  debugPumpCount += 1;
  for (const e of entries.values()) {
    if (e.paused) continue;
    if (!e.continuous && !e.dirty) continue;
    e.dirty = false;
    e.fn(now);
  }
  // Cancel when nothing is continuous/dirty after this frame.
  if (needsPump()) {
    rafId = requestAnimationFrame(pump);
  }
}

function kick(): void {
  ensureVisibilityListener();
  if (rafId || !needsPump()) return;
  rafId = requestAnimationFrame(pump);
}

/**
 * Register a frame callback. Starts dirty so the first frame paints once.
 * When `continuous` is false, further frames require {@link markDirty}.
 */
export function subscribe(
  id: string,
  fn: RafCallback,
  opts?: SubscribeOpts,
): void {
  ensureVisibilityListener();
  entries.set(id, {
    fn,
    continuous: Boolean(opts?.continuous),
    dirty: true,
    paused: false,
  });
  kick();
}

export function unsubscribe(id: string): void {
  entries.delete(id);
  if (!needsPump()) cancelPump();
}

export function markDirty(id: string): void {
  const e = entries.get(id);
  if (!e || e.paused) return;
  e.dirty = true;
  kick();
}

export function setContinuous(id: string, continuous: boolean): void {
  const e = entries.get(id);
  if (!e) return;
  e.continuous = continuous;
  if (continuous) {
    e.dirty = true;
    kick();
  } else if (!needsPump()) {
    cancelPump();
  }
}

/** Pause a subscriber (offscreen). Does not remove it; resumes via setPaused(false). */
export function setPaused(id: string, paused: boolean): void {
  const e = entries.get(id);
  if (!e) return;
  e.paused = paused;
  if (paused) {
    e.dirty = false;
    if (!needsPump()) cancelPump();
  } else {
    e.dirty = true;
    kick();
  }
}

export function isDocumentHidden(): boolean {
  return docHidden;
}

/** True when the shared rAF handle is scheduled. */
export function isRafScheduled(): boolean {
  return rafId !== 0;
}

export function getDebugPumpCount(): number {
  return debugPumpCount;
}

/** Test/debug helper — not used in production paths. */
export function __resetRafSchedulerForTests(): void {
  cancelPump();
  entries.clear();
  debugPumpCount = 0;
}
