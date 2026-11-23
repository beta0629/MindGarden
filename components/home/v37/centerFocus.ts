/** Fetch stacked-alpha mp4s only when this close to the viewport (protects first load). */
export const SRC_ROOT_MARGIN = '25% 0px';

/**
 * Shrink the IO root to the middle 20% of the viewport. Observe a 1px
 * sentinel at the scene's center so this fires when the scene center is
 * near the viewport center.
 */
export const FOCUS_ROOT_MARGIN = '-40% 0px -40% 0px';
