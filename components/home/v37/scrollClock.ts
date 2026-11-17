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

  triggerScrollY(m: ScrollMetrics): number {
    return (
      this.triggerP * (m.sectionHeight + m.vh) - m.vh + m.sectionTop
    );
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

export function readScrollMetrics(sectionEl: HTMLElement): ScrollMetrics {
  const rect = sectionEl.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const vh = window.innerHeight || 1;
  const sectionTop = scrollY + rect.top;
  const sectionHeight = Math.max(1, rect.height);
  const docH = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  );
  const maxScroll = Math.max(0, docH - vh);
  return { scrollY, vh, sectionTop, sectionHeight, maxScroll };
}
