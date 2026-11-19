/** home-v3.7 scroll-scene shared types. */

export type PackId = '1440' | '390';

export type ScenePlace = {
  page_x: number;
  page_y: number;
  css_w: number;
  css_h: number;
  section: string;
  section_top: number;
  y_from_section_top: number;
  x_pct_of_viewport: number;
  w_pct_of_viewport: number;
  ground_y_in_box?: number;
  x_from_section_left?: number;
  button_top?: number;
  button_rect?: number[];
  clip_line_y?: number | null;
};

export type AtlasSheetMeta = {
  file: string;
  bytes: number;
  w: number;
  h: number;
};

/** index[i] = [sheet, x, y] in source px */
export type AtlasIndexEntry = [number, number, number];

export type AtlasMeta = {
  frame_w: number;
  frame_h: number;
  frames: number;
  cols: number;
  gutter: number;
  sheets: AtlasSheetMeta[];
  index: AtlasIndexEntry[];
};

export type AssetFileMeta = {
  file: string;
  bytes: number;
  w: number;
  h: number;
};

export type GateJson = {
  scene: 'gate';
  bp: PackId;
  scale: number;
  place: ScenePlace;
  door: {
    walk_frames: [number, number];
    walk_frame_of_index: number[];
    angles_deg_of_index: [number, number][];
    body_atlas: AtlasMeta;
    shadow_atlas: AtlasMeta;
  };
  static: {
    body: AssetFileMeta;
    shadow: AssetFileMeta;
    crossfade_frames: number;
    crossfade_walk_frames: [number, number];
    crossfade_curve: string;
  };
  poster_reduced_motion: AssetFileMeta;
  shadow_scale: number;
  body_scale: number;
};

export type AmbientTrackPoint = {
  f: number;
  cell: number;
  x: number;
  y: number;
  layer: 'front' | 'back';
};

export type AmbientButterfly = {
  css_w: number;
  css_h: number;
  front_blur: boolean;
  mirror: boolean;
  perch: [number, number] | null;
  first_frame: number;
  last_frame: number;
  atlas: AtlasMeta;
  track: AmbientTrackPoint[];
};

export type PerchShadowTrackPoint = {
  f: number;
  x: number;
  y: number;
  opacity: number;
};

export type BenchJson = {
  scene: 'bench';
  bp: PackId;
  scale: number;
  place: ScenePlace;
  body: AssetFileMeta;
  shadow: AssetFileMeta;
  poster_reduced_motion: AssetFileMeta;
  ambient: Record<string, AmbientButterfly>;
  perch_shadow: {
    butterfly: string;
    file: AssetFileMeta;
    css_w: number;
    css_h: number;
    layer: string;
    track: PerchShadowTrackPoint[];
  };
};

export type BookingJson = {
  scene: 'booking';
  bp: PackId;
  scale: number;
  place: ScenePlace;
  poster_reduced_motion: AssetFileMeta;
  landing: {
    walk_frames: [number, number];
    fps: number;
    atlas: AtlasMeta;
  };
  breathe: {
    walk_frames: [number, number];
    fps: number;
    loop: string;
    atlas: AtlasMeta;
    frame_of_index: number[];
  };
};

export type HoverJson = {
  scene: 'hover';
  bp: PackId;
  scale: number;
  place: ScenePlace;
  poster: string;
  angles_deg: number[];
  atlas: AtlasMeta;
  timeline: {
    fps: number;
    frames: number;
    enter_s: number;
    leave_s: number;
    formula: string;
    angle_index_per_frame: number[];
  };
};

export const ASSET_BASE = '/assets/home-v3.7';

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

/**
 * Booking motion poster / fade-hold atlas index.
 * Landing frame 0 is fully transparent — first opaque cell is index 1.
 * Keep in sync with `scripts/generate-v37-motion-posters.mjs`.
 */
export const BOOKING_MOTION_HOLD_FRAME = 1;

export type V37SceneKind = 'gate' | 'bench' | 'booking';

/** Static build-time motion poster (atlas frame 0 / body+shadow). */
export function v37MotionPosterSrc(kind: V37SceneKind, pack: PackId): string {
  return `${ASSET_BASE}/${kind}/${pack}/${kind}-poster-motion-${pack}.webp`;
}

/** Reduced-motion / software-GL / fail poster. */
export function v37RmPosterSrc(kind: V37SceneKind, pack: PackId): string {
  return `${ASSET_BASE}/${kind}/${pack}/${kind}-poster-rm-${pack}.webp`;
}

export function assetUrl(relativePath: string): string {
  const cleaned = relativePath.replace(/^\//, '');
  return `${ASSET_BASE}/${cleaned}`;
}
