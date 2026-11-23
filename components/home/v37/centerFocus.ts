/** Fetch stacked-alpha mp4s only when this close to the viewport (protects first load). */
export const SRC_ROOT_MARGIN = '25% 0px';

/**
 * Enter when a 1px sentinel at the scene center hits the mid-viewport band.
 * Desktop stays a tight mid 20%. Mobile uses a wider mid 50% — a short
 * phone viewport + stacked title/bench would otherwise enter, then leave
 * (iOS URL-bar resize / small scroll), which stopped the loop.
 */
export const FOCUS_ENTER_MARGIN = '-40% 0px -40% 0px';
export const FOCUS_ENTER_MARGIN_MOBILE = '-25% 0px -25% 0px';

/**
 * Leave only after the sentinel exits a wider band than the enter band
 * (hysteresis), so the loop is not cut off by IO flapping.
 */
export const FOCUS_LEAVE_MARGIN = '-20% 0px -20% 0px';
export const FOCUS_LEAVE_MARGIN_MOBILE = '-8% 0px -8% 0px';

const MOBILE_MQ = '(max-width: 767px)';

export function observeCenterFocus(
  target: Element,
  handlers: { onEnter: () => void; onLeave: () => void },
): () => void {
  const mobile =
    typeof window !== 'undefined' &&
    window.matchMedia(MOBILE_MQ).matches;
  const enterMargin = mobile ? FOCUS_ENTER_MARGIN_MOBILE : FOCUS_ENTER_MARGIN;
  const leaveMargin = mobile ? FOCUS_LEAVE_MARGIN_MOBILE : FOCUS_LEAVE_MARGIN;

  const enterIO = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) handlers.onEnter();
    },
    { rootMargin: enterMargin, threshold: 0 },
  );
  const leaveIO = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) handlers.onLeave();
    },
    { rootMargin: leaveMargin, threshold: 0 },
  );
  enterIO.observe(target);
  leaveIO.observe(target);
  return () => {
    enterIO.disconnect();
    leaveIO.disconnect();
  };
}
