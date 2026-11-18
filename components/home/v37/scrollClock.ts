import { WALK_FPS } from './types';

export type ScrollMetrics = {
  scrollY: number;
  vh: number;
  sectionTop: number;
  sectionHeight: number;
  maxScroll: number;
};

export type ScrollClockConfig = {
  triggerP: number;
  triggerWalkF: number;
  /** Booking: also fire near document end */
  nearMaxScroll?: boolean;
  /**
   * Once true, reverse scroll does not unwind below this walk frame
   * (booking perch / form10b rule).
   */
  lockFloorWalkF?: number | null;
};

/**
 * Time-based walk-frame clock with reverse + optional pre-trigger scrub.
 * Primary: after trigger, advance at 30fps; scrollY < trigger−1 reverses.
 */
export class ScrollClock {
  private walkF: number;
  private dir: 1 | -1 = 1;
  private lastNow = 0;
  private armed = false;
  private lockFloor: number | null = null;
  private readonly triggerP: number;
  private readonly triggerWalkF: number;
  private readonly nearMaxScroll: boolean;

  constructor(config: ScrollClockConfig) {
    this.triggerP = config.triggerP;
    this.triggerWalkF = config.triggerWalkF;
    this.nearMaxScroll = Boolean(config.nearMaxScroll);
    this.walkF = config.triggerWalkF;
    this.lockFloor = config.lockFloorWalkF ?? null;
  }

  getWalkFrame(): number {
    return this.walkF;
  }

  isArmed(): boolean {
    return this.armed;
  }

  setLockFloor(walkF: number): void {
    this.lockFloor = walkF;
  }

  /** Prevent a large dt jump after a long idle freeze. */
  syncTime(now: number): void {
    this.lastNow = now;
  }

  triggerScrollY(m: ScrollMetrics): number {
    return (
      this.triggerP * (m.sectionHeight + m.vh) - m.vh + m.sectionTop
    );
  }

  /**
   * True when the clock will consume wall-clock dt on the next update
   * (forward walk or reverse) — used to decide continuous rAF.
   */
  wouldAdvanceWithTime(m: ScrollMetrics): boolean {
    const triggerY = this.triggerScrollY(m);
    const past =
      m.scrollY >= triggerY - 1 ||
      (this.nearMaxScroll && m.scrollY >= m.maxScroll - 2);
    const below = m.scrollY < triggerY - 1;
    if (past && this.armed) return true;
    if (below && this.armed) {
      if (this.lockFloor != null && this.walkF >= this.lockFloor) return false;
      return true;
    }
    return false;
  }

  update(now: number, m: ScrollMetrics): number {
    const triggerY = this.triggerScrollY(m);
    const past =
      m.scrollY >= triggerY - 1 ||
      (this.nearMaxScroll && m.scrollY >= m.maxScroll - 2);
    const below = m.scrollY < triggerY - 1;
    const scrubStart = triggerY - 0.5 * m.vh;

    if (past) {
      if (!this.armed) {
        this.armed = true;
        this.walkF = this.triggerWalkF;
        this.dir = 1;
        this.lastNow = now;
        return this.walkF;
      }
      if (this.dir !== 1) {
        this.dir = 1;
        this.lastNow = now;
        return this.walkF;
      }
      const dt = Math.min(0.1, Math.max(0, (now - this.lastNow) / 1000));
      this.lastNow = now;
      this.walkF += dt * WALK_FPS;
      return this.walkF;
    }

    if (below && this.armed) {
      if (this.lockFloor != null && this.walkF >= this.lockFloor) {
        this.walkF = Math.max(this.walkF, this.lockFloor);
        return this.walkF;
      }
      if (this.dir !== -1) {
        this.dir = -1;
        this.lastNow = now;
        return this.walkF;
      }
      const dt = Math.min(0.1, Math.max(0, (now - this.lastNow) / 1000));
      this.lastNow = now;
      this.walkF -= dt * WALK_FPS;

      if (this.walkF <= this.triggerWalkF && m.scrollY >= scrubStart) {
        const t =
          (m.scrollY - scrubStart) / Math.max(1e-3, triggerY - scrubStart);
        // Linear scrub in 0.5·vh before trigger: hold at trigger frame at t→1
        this.walkF = this.triggerWalkF - (1 - Math.min(1, Math.max(0, t))) * 15;
      }

      if (this.walkF < this.triggerWalkF - 15) {
        this.walkF = this.triggerWalkF - 15;
      }
      return this.walkF;
    }

    // Optional scrub before first arm
    if (!this.armed && m.scrollY >= scrubStart && m.scrollY < triggerY) {
      const t =
        (m.scrollY - scrubStart) / Math.max(1e-3, triggerY - scrubStart);
      this.walkF = this.triggerWalkF - (1 - Math.min(1, Math.max(0, t))) * 15;
    } else if (!this.armed) {
      this.walkF = this.triggerWalkF - 15;
    }

    return this.walkF;
  }
}

/** Stable visual viewport height — prefer visualViewport; avoid RO feedback. */
let cachedVh = 0;
let cachedDocH = 0;
let vhListenersBound = false;

function readStableVh(): number {
  const vv = window.visualViewport?.height;
  const next =
    typeof vv === 'number' && vv > 0
      ? vv
      : window.innerHeight || cachedVh || 1;
  cachedVh = next;
  return next;
}

function readDocHeight(): number {
  const next = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );
  cachedDocH = next;
  return next;
}

function bindVhCache(): void {
  if (vhListenersBound || typeof window === 'undefined') return;
  vhListenersBound = true;
  const refresh = () => {
    cachedVh = readStableVh();
    cachedDocH = readDocHeight();
  };
  window.addEventListener('resize', refresh, { passive: true });
  window.visualViewport?.addEventListener('resize', refresh);
  window.visualViewport?.addEventListener('scroll', refresh);
  refresh();
}

/**
 * One-shot metrics read (layout). Prefer {@link createSectionMetricsCache}
 * inside rAF ticks so getBoundingClientRect is not called every frame.
 */
export function readScrollMetrics(sectionEl: HTMLElement): ScrollMetrics {
  bindVhCache();
  const rect = sectionEl.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const vh = cachedVh > 0 ? cachedVh : readStableVh();
  const sectionTop = scrollY + rect.top;
  const sectionHeight = Math.max(1, rect.height);
  const docH = cachedDocH > 0 ? cachedDocH : readDocHeight();
  const maxScroll = Math.max(0, docH - vh);
  return { scrollY, vh, sectionTop, sectionHeight, maxScroll };
}

export type SectionMetricsCache = {
  /** Re-read section rect + doc height (call on resize / IO / pack change). */
  refresh: () => void;
  /** ScrollY + cached section geometry — no getBoundingClientRect. */
  read: () => ScrollMetrics;
};

/**
 * Cache section top/height from resize / IntersectionObserver / pack changes.
 * Tick paths must use `read()` — never call getBoundingClientRect per frame.
 */
export function createSectionMetricsCache(
  sectionEl: HTMLElement,
): SectionMetricsCache {
  bindVhCache();
  let sectionTop = 0;
  let sectionHeight = 1;

  const refresh = () => {
    const rect = sectionEl.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    sectionTop = scrollY + rect.top;
    sectionHeight = Math.max(1, rect.height);
    cachedVh = readStableVh();
    cachedDocH = readDocHeight();
  };

  refresh();

  return {
    refresh,
    read: () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = cachedVh > 0 ? cachedVh : readStableVh();
      const docH = cachedDocH > 0 ? cachedDocH : readDocHeight();
      return {
        scrollY,
        vh,
        sectionTop,
        sectionHeight,
        maxScroll: Math.max(0, docH - vh),
      };
    },
  };
}
