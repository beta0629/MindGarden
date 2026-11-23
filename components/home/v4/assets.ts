import type { PackId, V37SceneKind } from '@/components/home/v37/types';

export const V4_BASE = '/assets/v4-60fps';

/** Desktop pack key (≥768) vs mobile (&lt;768). */
export type V4Key = 'd' | 'm';

export function packToV4Key(pack: PackId): V4Key {
  return pack === '1440' ? 'd' : 'm';
}

/** MatchMedia once — same breakpoint as {@link useBreakpointPack}. */
export function v4KeyFromViewport(): V4Key {
  if (typeof window === 'undefined') return 'm';
  return window.matchMedia('(min-width: 768px)').matches ? 'd' : 'm';
}

export function heroStackSrc(key: V4Key): string {
  return `${V4_BASE}/hero/hero-${key}-stack.mp4`;
}

export function heroPosterSrc(key: V4Key): string {
  return `${V4_BASE}/hero/hero-${key}-poster.webp`;
}

/** Query rev for immutable `/assets/v4-60fps/gate/*` (stable filenames). */
const GATE_ASSET_V = 'scrub1';

export function gateStackSrc(key: V4Key): string {
  return `${V4_BASE}/gate/gate-${key}-stack.mp4?v=${GATE_ASSET_V}`;
}

export function gatePosterSrc(key: V4Key): string {
  return `${V4_BASE}/gate/gate-${key}-poster.webp?v=${GATE_ASSET_V}`;
}

export function gateEndPosterSrc(key: V4Key): string {
  return `${V4_BASE}/gate/gate-${key}-end-poster.webp?v=${GATE_ASSET_V}`;
}

/** Query rev for bench stacked-alpha clips (same ?v= as gate after GOP-4 re-encode). */
const BENCH_ASSET_V = 'scrub1';

export function benchBackSrc(key: V4Key): string {
  return `${V4_BASE}/bench/bench-${key}-back-stack.mp4?v=${BENCH_ASSET_V}`;
}

export function benchFrontSrc(key: V4Key): string {
  return `${V4_BASE}/bench/bench-${key}-front-stack.mp4?v=${BENCH_ASSET_V}`;
}

export function bookingLandingSrc(key: V4Key): string {
  return `${V4_BASE}/booking/booking-${key}-landing-stack.mp4`;
}

export function bookingBreatheSrc(key: V4Key): string {
  return `${V4_BASE}/booking/booking-${key}-breathe-stack.mp4`;
}

export function bookingHoverSrc(key: V4Key): string {
  return `${V4_BASE}/booking/booking-${key}-hover-stack.mp4`;
}

export function bookingPosterSrc(key: V4Key): string {
  return `${V4_BASE}/booking/booking-${key}-poster.webp`;
}

export function bookingEndPosterSrc(key: V4Key): string {
  return `${V4_BASE}/booking/booking-${key}-end-poster.webp`;
}

/** Static bench body / shadow (kept from home-v3.7). */
export function benchBodySrc(pack: PackId): string {
  return `/assets/home-v3.7/bench/${pack}/bench-body-${pack}.webp`;
}

export function benchShadowSrc(pack: PackId): string {
  return `/assets/home-v3.7/bench/${pack}/bench-shadow-${pack}.webp`;
}

/** Reduced-motion stills (unchanged paths under home-v3.7). */
export function v4RmPosterSrc(kind: V37SceneKind, pack: PackId): string {
  return `/assets/home-v3.7/${kind}/${pack}/${kind}-poster-rm-${pack}.webp`;
}

/** Motion / LCP still for gate + booking (v4 decoded frame posters). */
export function v4ScenePosterSrc(kind: V37SceneKind, pack: PackId): string {
  const key = packToV4Key(pack);
  if (kind === 'gate') return gatePosterSrc(key);
  if (kind === 'booking') return bookingPosterSrc(key);
  // Bench uses body as the layout still (no composite motion poster).
  return benchBodySrc(pack);
}

/** Bench overflow pad (CSS px at design place width) — from layout.json. */
export const BENCH_OVERFLOW = {
  '1440': {
    placeW: 404.8573877074131,
    placeH: 350.33388021716854,
    padL: 144.065,
    padT: 452.571,
    padR: 346.16261229258686,
    padB: 4,
    overflowW: 895.085,
    overflowH: 806.9048802171685,
  },
  '390': {
    placeW: 223.36959321788316,
    placeH: 193.28765805085166,
    padL: 219.679,
    padT: 202.662,
    padR: 187.79040678211686,
    padB: 4,
    overflowW: 630.839,
    overflowH: 399.94965805085167,
  },
} as const;

/** Booking video box relative to place (layout.json). Desktop extends 8px above. */
export const BOOKING_VIDEO_BOX = {
  '1440': { x: 0, y: -8, w: 291, h: 225 },
  '390': { x: 0, y: 0, w: 195, h: 113 },
} as const;

/** Booking landing starts at decoded poster frame 10 when poster was shown. */
export const BOOKING_POSTER_START_S = 10 / 60;

/** Bench butterflies start 0.567s after walk trigger (f320 → f337 @ 30fps). */
export const BENCH_VIDEO_DELAY_S = 0.5667;

/**
 * Last fully-opaque butterfly time (walk f421). The clip fades to empty
 * between 2.8s and 3.15s (f421–f431) — ping-pong turns around here so
 * they never vanish.
 */
export const BENCH_HOLD_S = 2.8;

/** Desktop hover crossfade. */
export const BOOKING_HOVER_FADE_MS = 300;

/** 390 hero frame framing (hero.json). */
export const HERO_MOBILE_FRAME_TRANSFORM = 'translateY(-13%) scale(1.059)';
