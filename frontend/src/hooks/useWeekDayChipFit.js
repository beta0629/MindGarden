/**
 * 주/일 칩 가용폭 ResizeObserver + 실제 computed font 측정 → judgeWeekDayChipFit.
 * DEFAULT_TIME_FONT(11px 등) 가정 금지 — getComputedStyle(timeEl).font 사용.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

import { useLayoutEffect, useState } from 'react';
import {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  judgeWeekDayChipFit,
  measureTextWidth,
  resolveComputedFont,
  readChipPadTokens
} from '../utils/weekDayChipFit';

const DEFAULT_GAP_PX = 4;
const DEFAULT_BADGE_PAD_X = 8;

const INITIAL_FIT = Object.freeze({
  stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
  timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
  showBadge: false,
  showTime: true,
  compactPad: false
});

/**
 * 배지 폭 측정용 hidden probe (실제 EngagementTypeBadge 클래스 font).
 *
 * @param {Element} chipEl
 * @returns {string|null}
 */
function resolveBadgeFont(chipEl) {
  const existing = chipEl.querySelector('.mg-engagement-type-badge');
  if (existing) {
    return resolveComputedFont(existing);
  }
  if (typeof document === 'undefined') {
    return null;
  }
  let probe = chipEl.querySelector('[data-week-day-badge-font-probe="1"]');
  if (!probe) {
    probe = document.createElement('span');
    probe.setAttribute('data-week-day-badge-font-probe', '1');
    probe.className = 'mg-common-badge mg-common-badge--sm mg-engagement-type-badge';
    probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;';
    chipEl.appendChild(probe);
  }
  return resolveComputedFont(probe);
}

/**
 * @param {{
 *   chipRef: { current: Element|null },
 *   timeRef?: { current: Element|null },
 *   longTime: string,
 *   shortTime: string,
 *   badgeLabel?: string,
 *   considerBadge?: boolean,
 *   gap?: number
 * }} options
 * @returns {{
 *   stage: string,
 *   timeMode: 'long'|'short',
 *   showBadge: boolean,
 *   showTime: boolean,
 *   compactPad: boolean
 * }}
 */
export default function useWeekDayChipFit(options) {
  const {
    chipRef,
    timeRef,
    longTime,
    shortTime,
    badgeLabel = '',
    considerBadge = true,
    gap = DEFAULT_GAP_PX
  } = options || {};

  const [fit, setFit] = useState(INITIAL_FIT);

  useLayoutEffect(() => {
    const el = chipRef?.current;
    if (!el) {
      setFit(INITIAL_FIT);
      return undefined;
    }

    const measure = () => {
      const timeEl = timeRef?.current
        || el.querySelector('.mg-v2-ad-calendar-event__time-measured')
        || el.querySelector('.mg-v2-ad-calendar-event__time');
      const timeFont = resolveComputedFont(timeEl) || resolveComputedFont(el);
      const badgeFont = resolveBadgeFont(el) || timeFont;

      const { normalPadX, compactPadX } = readChipPadTokens(el);
      const outer = el.clientWidth;
      const chipWidth = Math.max(0, outer - normalPadX);
      const compactChipWidth = Math.max(0, outer - compactPadX);

      const longTimeWidth = measureTextWidth(longTime, timeFont);
      const shortTimeWidth = measureTextWidth(shortTime, timeFont);
      const badgeWidth = considerBadge && badgeLabel
        ? measureTextWidth(badgeLabel, badgeFont) + DEFAULT_BADGE_PAD_X
        : 0;

      setFit(judgeWeekDayChipFit({
        chipWidth,
        compactChipWidth,
        longTimeWidth,
        shortTimeWidth,
        badgeWidth,
        gap,
        considerBadge: Boolean(considerBadge && badgeLabel)
      }));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [
    chipRef,
    timeRef,
    longTime,
    shortTime,
    badgeLabel,
    considerBadge,
    gap
  ]);

  return fit;
}
