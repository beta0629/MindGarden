/**
 * 주/일 칩 가용폭 ResizeObserver + canvas 측정 → judgeWeekDayChipFit.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

import { useLayoutEffect, useState } from 'react';
import {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  judgeWeekDayChipFit,
  measureTextWidth
} from '../utils/weekDayChipFit';

const DEFAULT_GAP_PX = 4;
const DEFAULT_TIME_FONT = '600 11px "Pretendard", "Noto Sans KR", sans-serif';
const DEFAULT_BADGE_FONT = '600 10px "Pretendard", "Noto Sans KR", sans-serif';
const DEFAULT_BADGE_PAD_X = 8;

const INITIAL_FIT = Object.freeze({
  stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
  timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
  showBadge: false
});

/**
 * @param {{
 *   chipRef: { current: Element|null },
 *   longTime: string,
 *   shortTime: string,
 *   badgeLabel?: string,
 *   considerBadge?: boolean,
 *   gap?: number,
 *   timeFont?: string,
 *   badgeFont?: string
 * }} options
 * @returns {{ stage: string, timeMode: 'long'|'short', showBadge: boolean }}
 */
export default function useWeekDayChipFit(options) {
  const {
    chipRef,
    longTime,
    shortTime,
    badgeLabel = '',
    considerBadge = true,
    gap = DEFAULT_GAP_PX,
    timeFont = DEFAULT_TIME_FONT,
    badgeFont = DEFAULT_BADGE_FONT
  } = options || {};

  const [fit, setFit] = useState(INITIAL_FIT);

  useLayoutEffect(() => {
    const el = chipRef?.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      setFit(judgeWeekDayChipFit({
        chipWidth: el?.clientWidth || 0,
        longTimeWidth: measureTextWidth(longTime, timeFont),
        shortTimeWidth: measureTextWidth(shortTime, timeFont),
        badgeWidth: considerBadge && badgeLabel
          ? measureTextWidth(badgeLabel, badgeFont) + DEFAULT_BADGE_PAD_X
          : 0,
        gap,
        considerBadge: Boolean(considerBadge && badgeLabel)
      }));
      return undefined;
    }

    const measure = () => {
      const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null;
      const padX = style
        ? (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0)
        : 0;
      const chipWidth = Math.max(0, el.clientWidth - padX);
      const longTimeWidth = measureTextWidth(longTime, timeFont);
      const shortTimeWidth = measureTextWidth(shortTime, timeFont);
      const badgeWidth = considerBadge && badgeLabel
        ? measureTextWidth(badgeLabel, badgeFont) + DEFAULT_BADGE_PAD_X
        : 0;
      setFit(judgeWeekDayChipFit({
        chipWidth,
        longTimeWidth,
        shortTimeWidth,
        badgeWidth,
        gap,
        considerBadge: Boolean(considerBadge && badgeLabel)
      }));
    };

    measure();
    const ro = new ResizeObserver(() => {
      measure();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [
    chipRef,
    longTime,
    shortTime,
    badgeLabel,
    considerBadge,
    gap,
    timeFont,
    badgeFont
  ]);

  return fit;
}
