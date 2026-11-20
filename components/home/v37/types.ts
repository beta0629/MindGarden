/** home-v3.7 scroll-scene shared types (triggers + pack ids). */

export type PackId = '1440' | '390';

export const TRIGGER_P: Record<PackId, { gate: number; bench: number; booking: number }> = {
  /* Design-spec trigger p from IMPLEMENTATION-v3.7.md §0 (fix10c). */
  '1440': { gate: 0.5291, bench: 0.5082, booking: 0.5612 },
  '390': { gate: 0.4365, bench: 0.5057, booking: 0.5659 },
};

export const TRIGGER_WALK_F = {
  gate: 174,
  bench: 320,
  booking: 468,
} as const;

export const WALK_FPS = 30;

/** Matches `.v37-scene__canvas` opacity transition in globals.css. */
export const V37_CANVAS_FADE_MS = 180;

export type V37SceneKind = 'gate' | 'bench' | 'booking';
