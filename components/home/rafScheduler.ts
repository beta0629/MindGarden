/**
 * Single requestAnimationFrame fan-out for homepage hero + v3.7 scenes.
 * Cancel the global rAF when nothing is active; pause all while document.hidden.
 *
 * Mutable state lives on `globalThis.__mgRafScheduler` so lazy chunk duplicates
 * (hero / gate / bench / booking) still share one entries map and pump handle.
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

type RafSchedulerState = {
  entries: Map<string, Entry>;
  rafId: number;
  /**
   * True once a frame callback is queued (or running). Prefer this over rafId
   * alone so kick() cannot double-schedule when pump clears rafId at entry.
   */
  scheduled: boolean;
  /** True while pump() is iterating subscribers — kick() must not schedule. */
  pumping: boolean;
  visibilityBound: boolean;
  docHidden: boolean;
  debugPumpCount: number;
};

const GLOBAL_KEY = '__mgRafScheduler' as const;

type GlobalWithScheduler = typeof globalThis & {
  [GLOBAL_KEY]?: RafSchedulerState;
};

function getState(): RafSchedulerState {
  const g = globalThis as GlobalWithScheduler;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      entries: new Map(),
      rafId: 0,
      scheduled: false,
      pumping: false,
      visibilityBound: false,
      docHidden:
        typeof document !== 'undefined' ? Boolean(document.hidden) : false,
      debugPumpCount: 0,
    };
  }
  // Older chunk copies may lack `scheduled` — normalize in place.
  if (g[GLOBAL_KEY].scheduled == null) {
    g[GLOBAL_KEY].scheduled = g[GLOBAL_KEY].rafId !== 0;
  }
  return g[GLOBAL_KEY];
}

function ensureVisibilityListener(): void {
  const state = getState();
  if (state.visibilityBound || typeof document === 'undefined') return;
  state.visibilityBound = true;
  document.addEventListener('visibilitychange', () => {
    const s = getState();
    s.docHidden = Boolean(document.hidden);
    if (s.docHidden) {
      cancelPump();
    } else {
      kick();
    }
  });
}

function cancelPump(): void {
  const state = getState();
  if (state.rafId) {
    cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }
  state.scheduled = false;
}

function needsPump(): boolean {
  const state = getState();
  if (state.docHidden) return false;
  for (const e of state.entries.values()) {
    if (e.paused) continue;
    if (e.continuous || e.dirty) return true;
  }
  return false;
}

function pump(now: number): void {
  const state = getState();
  // Mark running before clearing rafId so concurrent kick() sees scheduled.
  state.pumping = true;
  state.rafId = 0;
  try {
    if (state.docHidden) {
      // Stay cancelled while hidden — visibilitychange will kick() on resume.
      return;
    }
    state.debugPumpCount += 1;
    for (const e of state.entries.values()) {
      if (e.paused) continue;
      if (!e.continuous && !e.dirty) continue;
      e.dirty = false;
      e.fn(now);
    }
  } finally {
    state.pumping = false;
    state.scheduled = false;
  }
  // Re-arm only via kick() so the scheduled flag stays consistent.
  if (needsPump()) kick();
}

function kick(): void {
  ensureVisibilityListener();
  const state = getState();
  if (state.pumping || state.scheduled || !needsPump()) return;
  state.scheduled = true;
  state.rafId = requestAnimationFrame(pump);
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
  const state = getState();
  state.entries.set(id, {
    fn,
    continuous: Boolean(opts?.continuous),
    dirty: true,
    paused: false,
  });
  kick();
}

export function unsubscribe(id: string): void {
  const state = getState();
  state.entries.delete(id);
  if (!needsPump()) cancelPump();
}

export function markDirty(id: string): void {
  const state = getState();
  const e = state.entries.get(id);
  if (!e || e.paused) return;
  e.dirty = true;
  kick();
}

export function setContinuous(id: string, continuous: boolean): void {
  const state = getState();
  const e = state.entries.get(id);
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
  const state = getState();
  const e = state.entries.get(id);
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
  return getState().docHidden;
}

/** True when the shared rAF handle is scheduled. */
export function isRafScheduled(): boolean {
  return getState().rafId !== 0;
}

export function getDebugPumpCount(): number {
  return getState().debugPumpCount;
}

/** Test/debug helper — not used in production paths. */
export function __resetRafSchedulerForTests(): void {
  cancelPump();
  const state = getState();
  state.entries.clear();
  state.debugPumpCount = 0;
  state.pumping = false;
  state.scheduled = false;
}
