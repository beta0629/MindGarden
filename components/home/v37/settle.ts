import { smoothstep } from './atlas';

/** Rise distance in CSS px — §1 IMPLEMENTATION-v3.7.md */
export const SETTLE_RISE_PX = { '1440': 36, '390': 28 } as const;

const PHASE1_MS = 300;
const TOTAL_MS = 1200;
const DELAY_AFTER_TRIGGER_MS = 350;

/**
 * Sample cubic-bezier(0.32, 0.72, 0, 1) for t in [0,1].
 * Newton solve on x, return y.
 */
function cubicBezier01(t: number, x1: number, y1: number, x2: number, y2: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  let guess = clamped;
  for (let i = 0; i < 6; i += 1) {
    const u = 1 - guess;
    const x =
      3 * u * u * guess * x1 + 3 * u * guess * guess * x2 + guess * guess * guess;
    const dx =
      3 * u * u * x1 +
      6 * u * guess * (x2 - x1) +
      3 * guess * guess * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    guess -= (x - clamped) / dx;
    guess = Math.min(1, Math.max(0, guess));
  }
  const u = 1 - guess;
  return (
    3 * u * u * guess * y1 +
    3 * u * guess * guess * y2 +
    guess * guess * guess
  );
}

export type SettleState = {
  /** 0 = fully risen below, 1 = at rest */
  rise: number;
  opacity: number;
  shadowScaleX: number;
  shadowOpacity: number;
};

const IDLE: SettleState = {
  rise: 0,
  opacity: 0,
  shadowScaleX: 0.75,
  shadowOpacity: 0.35,
};

const DONE: SettleState = {
  rise: 1,
  opacity: 1,
  shadowScaleX: 1,
  shadowOpacity: 1,
};

/**
 * §1 two-phase settle from trigger time.
 * `elapsedSinceTriggerMs` may be negative (before trigger) or account for reverse.
 */
export function sampleSettle(elapsedSinceTriggerMs: number): SettleState {
  const local = elapsedSinceTriggerMs - DELAY_AFTER_TRIGGER_MS;
  if (local <= 0) return { ...IDLE };
  if (local >= TOTAL_MS) return { ...DONE };

  if (local <= PHASE1_MS) {
    const u = local / PHASE1_MS;
    // cos ease 0→1
    const opacity = 0.5 - 0.5 * Math.cos(Math.PI * u);
    return {
      rise: 0.25 * u,
      opacity,
      shadowScaleX: 0.75,
      shadowOpacity: 0.35,
    };
  }

  const u2 = (local - PHASE1_MS) / (TOTAL_MS - PHASE1_MS);
  const eased = cubicBezier01(u2, 0.32, 0.72, 0, 1);
  return {
    rise: 0.25 + 0.75 * eased,
    opacity: 1,
    shadowScaleX: 0.75 + 0.25 * eased,
    shadowOpacity: 0.35 + 0.65 * eased,
  };
}

/** Map walk-frame delta (at 30fps) into settle sample using forward time. */
export function settleFromWalkDelta(walkDeltaFromTrigger: number): SettleState {
  const ms = (walkDeltaFromTrigger / 30) * 1000;
  return sampleSettle(ms);
}

export function settleTranslateY(rise: number, risePx: number): number {
  return (1 - rise) * risePx;
}

/** Expose smoothstep for crossfades that share the settle module. */
export { smoothstep };
