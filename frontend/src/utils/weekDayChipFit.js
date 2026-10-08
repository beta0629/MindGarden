/**
 * 주/일 일정 칩 fit 판정 — 시간 우선 단계 (뷰포트·하드코딩 109px 금지).
 *
 * Stages (time first):
 *   1. long + badge  — 로케일 긴 시간(「오전 10:00」) + 기관연계 배지 전부 수용
 *   2. long          — 긴 시간만 (배지 생략, 상세에서 확인)
 *   3. short + badge — 짧은 시간(「10:00」) + 배지
 *   4. short         — 짧은 시간만
 *
 * Never ellipsis/truncate time or badge text. Badge is either full 4-char or absent.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

export const WEEK_DAY_CHIP_FIT_STAGE = Object.freeze({
  LONG_BADGE: 'long+badge',
  LONG: 'long',
  SHORT_BADGE: 'short+badge',
  SHORT: 'short'
});

export const WEEK_DAY_CHIP_TIME_MODE = Object.freeze({
  LONG: 'long',
  SHORT: 'short'
});

/**
 * @param {{
 *   chipWidth: number,
 *   longTimeWidth: number,
 *   shortTimeWidth: number,
 *   badgeWidth?: number,
 *   gap?: number,
 *   considerBadge?: boolean
 * }} input
 * @returns {{
 *   stage: string,
 *   timeMode: 'long'|'short',
 *   showBadge: boolean
 * }}
 */
export function judgeWeekDayChipFit(input = {}) {
  const chipWidth = Number(input.chipWidth);
  const longTimeWidth = Number(input.longTimeWidth);
  const shortTimeWidth = Number(input.shortTimeWidth);
  const badgeWidth = Number(input.badgeWidth);
  const gap = Number.isFinite(Number(input.gap)) ? Math.max(0, Number(input.gap)) : 0;
  const considerBadge = input.considerBadge !== false
    && Number.isFinite(badgeWidth)
    && badgeWidth > 0;

  const safeChip = Number.isFinite(chipWidth) && chipWidth > 0 ? chipWidth : 0;
  const safeLong = Number.isFinite(longTimeWidth) && longTimeWidth >= 0 ? longTimeWidth : 0;
  const safeShort = Number.isFinite(shortTimeWidth) && shortTimeWidth >= 0 ? shortTimeWidth : 0;
  const safeBadge = considerBadge ? badgeWidth : 0;

  const fits = (need) => safeChip + 0.5 >= need;

  if (considerBadge && fits(safeLong + gap + safeBadge)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.LONG_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.LONG,
      showBadge: true
    };
  }
  if (fits(safeLong)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.LONG,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.LONG,
      showBadge: false
    };
  }
  if (considerBadge && fits(safeShort + gap + safeBadge)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: true
    };
  }
  return {
    stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
    timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
    showBadge: false
  };
}

/**
 * Canvas 로 텍스트 폭 측정 (DOM 없이 stages 판정용).
 *
 * @param {string} text
 * @param {string} [font] CSS font 문자열
 * @returns {number}
 */
export function measureTextWidth(text, font = '12px sans-serif') {
  if (text == null || text === '') {
    return 0;
  }
  if (typeof document === 'undefined') {
    return String(text).length * 7;
  }
  const canvas = measureTextWidth._canvas
    || (measureTextWidth._canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return String(text).length * 7;
  }
  ctx.font = font;
  return ctx.measureText(String(text)).width;
}

export default {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  judgeWeekDayChipFit,
  measureTextWidth
};
