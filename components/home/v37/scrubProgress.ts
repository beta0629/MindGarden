import type { ScrollMetrics } from './scrollClock';

/** Scroll distance, as a fraction of viewport height, over which a scene scrubs 0→1. */
export const SCRUB_RANGE_VH = 0.9;

/** Fetch stacked-alpha mp4s only when this close to the viewport (protects first load). */
export const SCRUB_SRC_ROOT_MARGIN = '25% 0px';

export function clamp01(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

/**
 * Map section scroll to 0..1 for stacked-alpha scrubbing.
 * 0 at the existing trigger (and below — hold first frame);
 * 1 after {@link SCRUB_RANGE_VH} viewports of further scroll (hold last frame).
 * Scroll up inverts the same map.
 */
export function scrollMediaProgress(
  metrics: ScrollMetrics,
  triggerP: number,
  rangeVh: number = SCRUB_RANGE_VH,
): number {
  const triggerY =
    triggerP * (metrics.sectionHeight + metrics.vh) -
    metrics.vh +
    metrics.sectionTop;
  const span = Math.max(1, rangeVh * metrics.vh);
  return clamp01((metrics.scrollY - triggerY) / span);
}
