/**
 * 주/일 칩 가용폭·높이 ResizeObserver + 실제 computed font 측정 → judgeWeekDayChipFit.
 * DEFAULT_TIME_FONT(11px 등) 가정 금지 — getComputedStyle(timeEl).font 사용.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

import { useLayoutEffect, useState } from 'react';
import {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_HEIGHT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  judgeWeekDayChipFit,
  measureTextWidth,
  resolveComputedFont,
  readChipPadTokens
} from '../utils/weekDayChipFit';

const DEFAULT_GAP_PX = 4;
const DEFAULT_BADGE_PAD_X = 8;
const DEFAULT_GAP_Y_PX = 2;

const INITIAL_FIT = Object.freeze({
  stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
  timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
  showBadge: false,
  showTime: true,
  compactPad: false,
  heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.FULL,
  showStatus: true,
  showTitle: true
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
 * @param {Element|null} el
 * @returns {number}
 */
function readRowHeight(el) {
  if (!el) {
    return 0;
  }
  const rect = el.getBoundingClientRect();
  return rect && Number.isFinite(rect.height) ? rect.height : 0;
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
 *   compactPad: boolean,
 *   heightStage: string,
 *   showStatus: boolean,
 *   showTitle: boolean
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
      // harness(부모) 높이를 가용 높이로 — 숨긴 줄 때문에 chip 이 줄어들며 FULL 로 되돌아가는 플리커 방지
      const parentH = el.parentElement?.clientHeight || 0;
      const selfH = el.clientHeight > 0
        ? el.clientHeight
        : (el.getBoundingClientRect()?.height || 0);
      const chipHeight = parentH > 0 ? parentH : selfH;

      const timeRow = el.querySelector('.mg-v2-ad-calendar-event__time');
      const titleRow = el.querySelector('.mg-v2-ad-calendar-event__title');
      const statusRow = el.querySelector('.mg-v2-ad-calendar-event__status');
      const cs = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
      const lineH = cs
        ? (Number.parseFloat(cs.lineHeight) || Number.parseFloat(cs.fontSize) || 14)
        : 14;
      // 숨김 행은 getBoundingClientRect=0 → 줄 높이 추정으로 본래 필요 높이 유지
      const timeRowHeight = readRowHeight(timeRow) || lineH;
      const titleRowHeight = readRowHeight(titleRow) || lineH;
      const statusRowHeight = readRowHeight(statusRow) || lineH;

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
        considerBadge: Boolean(considerBadge && badgeLabel),
        chipHeight,
        timeRowHeight,
        titleRowHeight,
        statusRowHeight,
        gapY: DEFAULT_GAP_Y_PX
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
