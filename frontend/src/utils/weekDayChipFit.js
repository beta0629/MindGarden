/**
 * 주/일 일정 칩 fit 판정 — 시간 우선 단계 (뷰포트·하드코딩 109px·가정 font-size 금지).
 *
 * Stages (time first, never truncate/ellipsis time or badge):
 *   1. long + badge     — 로케일 긴 시간(「오전 10:00」) + 기관연계 배지 전부 수용
 *   2. long             — 긴 시간만 (배지 생략, 상세에서 확인)
 *   3. short + badge    — 짧은 시간(「10:00」) + 배지
 *   4. short            — 짧은 시간만 (「11:00」)
 *   5. compact-pad      — 칩 좌우 패딩을 토큰 compact 로 줄여 short 수용
 *   6. hide-time        — 칩에서 시간 텍스트 미렌더; title/aria-label·상세는 전체 시간 유지.
 *                         배지는 4자 전부 수용될 때만.
 *
 * 측정은 실제 computed font(getComputedStyle) 기준 — 11px 등 가정 금지.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

export const WEEK_DAY_CHIP_FIT_STAGE = Object.freeze({
  LONG_BADGE: 'long+badge',
  LONG: 'long',
  SHORT_BADGE: 'short+badge',
  SHORT: 'short',
  COMPACT_PAD: 'compact-pad',
  HIDE_TIME: 'hide-time'
});

export const WEEK_DAY_CHIP_TIME_MODE = Object.freeze({
  LONG: 'long',
  SHORT: 'short'
});

/**
 * DOM 요소의 실제 computed font 문자열.
 * style.font 가 비면 weight/size/family 조합.
 *
 * @param {Element|null|undefined} el
 * @returns {string|null}
 */
export function resolveComputedFont(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return null;
  }
  const style = window.getComputedStyle(el);
  if (!style) {
    return null;
  }
  // font-size/weight/family 조합 우선 — shorthand 의 size/line-height 모호성 회피
  const weight = style.fontWeight || '400';
  const size = style.fontSize || '';
  const family = style.fontFamily || 'sans-serif';
  if (size) {
    return `${weight} ${size} ${family}`.trim();
  }
  const shorthand = style.font;
  if (shorthand && String(shorthand).trim() !== '') {
    return String(shorthand).trim();
  }
  return null;
}

/**
 * @param {{
 *   chipWidth: number,
 *   longTimeWidth: number,
 *   shortTimeWidth: number,
 *   badgeWidth?: number,
 *   gap?: number,
 *   considerBadge?: boolean,
 *   compactChipWidth?: number
 * }} input
 * @returns {{
 *   stage: string,
 *   timeMode: 'long'|'short',
 *   showBadge: boolean,
 *   showTime: boolean,
 *   compactPad: boolean
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
  const compactRaw = Number(input.compactChipWidth);
  const safeCompact = Number.isFinite(compactRaw) && compactRaw > 0
    ? compactRaw
    : safeChip;
  const safeLong = Number.isFinite(longTimeWidth) && longTimeWidth >= 0 ? longTimeWidth : 0;
  const safeShort = Number.isFinite(shortTimeWidth) && shortTimeWidth >= 0 ? shortTimeWidth : 0;
  const safeBadge = considerBadge ? badgeWidth : 0;

  const fits = (need, width = safeChip) => width + 0.5 >= need;

  if (considerBadge && fits(safeLong + gap + safeBadge)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.LONG_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.LONG,
      showBadge: true,
      showTime: true,
      compactPad: false
    };
  }
  if (fits(safeLong)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.LONG,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.LONG,
      showBadge: false,
      showTime: true,
      compactPad: false
    };
  }
  if (considerBadge && fits(safeShort + gap + safeBadge)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: true,
      showTime: true,
      compactPad: false
    };
  }
  if (fits(safeShort)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: false,
      showTime: true,
      compactPad: false
    };
  }

  // Stage 5: compact padding — short (±badge) in reduced-pad content width
  if (considerBadge && fits(safeShort + gap + safeBadge, safeCompact)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.COMPACT_PAD,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: true,
      showTime: true,
      compactPad: true
    };
  }
  if (fits(safeShort, safeCompact)) {
    return {
      stage: WEEK_DAY_CHIP_FIT_STAGE.COMPACT_PAD,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: false,
      showTime: true,
      compactPad: true
    };
  }

  // Stage 6: hide time — badge only if full width fits in compact content
  return {
    stage: WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME,
    timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
    showBadge: considerBadge && fits(safeBadge, safeCompact),
    showTime: false,
    compactPad: true
  };
}

/**
 * Canvas 로 텍스트 폭 측정 (DOM 없이 stages 판정용).
 * font 는 호출측이 실제 computed font 를 넘겨야 한다. 가정 11px 금지.
 *
 * @param {string} text
 * @param {string} font CSS font 문자열 (필수에 가깝게 — 미지정 시 길이 추정만)
 * @returns {number}
 */
export function measureTextWidth(text, font) {
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
  if (font && String(font).trim() !== '') {
    ctx.font = font;
  }
  return ctx.measureText(String(text)).width;
}

/**
 * 칩 요소에서 수평 패딩(좌+우) 합.
 *
 * @param {Element|null|undefined} el
 * @returns {number}
 */
export function readHorizontalPadding(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return 0;
  }
  const style = window.getComputedStyle(el);
  return (Number.parseFloat(style.paddingLeft) || 0)
    + (Number.parseFloat(style.paddingRight) || 0);
}

/**
 * CSS 길이(px/rem) → px. parseFloat('0.5rem')===0.5 함정 방지.
 *
 * @param {string} raw
 * @param {Element} [el]
 * @returns {number}
 */
export function parseCssLengthToPx(raw, el) {
  const v = String(raw || '').trim();
  if (!v) return 0;
  if (v.endsWith('rem')) {
    const rootPx = typeof document !== 'undefined'
      ? (Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16)
      : 16;
    return (Number.parseFloat(v) || 0) * rootPx;
  }
  if (v.endsWith('em') && el && typeof window !== 'undefined') {
    const parentPx = Number.parseFloat(window.getComputedStyle(el).fontSize) || 16;
    return (Number.parseFloat(v) || 0) * parentPx;
  }
  return Number.parseFloat(v) || 0;
}

/**
 * 디자인 토큰 기준 정상/compact 수평 패딩 (calendar event padding SSOT).
 * 정상: space-1 / space-2 · compact(--chip-pad-compact): space-0-5 / space-1.
 * rem 토큰은 px 로 환산하거나, 가능하면 probe 의 computed padding 을 사용.
 *
 * @param {Element|null|undefined} el
 * @returns {{ normalPadX: number, compactPadX: number }}
 */
export function readChipPadTokens(el) {
  if (!el || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return { normalPadX: 0, compactPadX: 0 };
  }
  const doc = el.ownerDocument || document;
  const probe = doc.createElement('div');
  probe.className = 'mg-v2-ad-calendar-event mg-v2-ad-calendar-event--week-day-fit';
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;pointer-events:none;';
  (el.parentElement || doc.body).appendChild(probe);
  const normalPadX = readHorizontalPadding(probe);
  probe.classList.add('mg-v2-ad-calendar-event--chip-pad-compact');
  const compactPadX = readHorizontalPadding(probe);
  probe.remove();
  if (normalPadX > 0 || compactPadX > 0) {
    return { normalPadX, compactPadX };
  }
  // fallback: 토큰 rem → px
  const cs = window.getComputedStyle(el);
  const space1 = parseCssLengthToPx(cs.getPropertyValue('--mg-v2-space-1'), el);
  const space2 = parseCssLengthToPx(cs.getPropertyValue('--mg-v2-space-2'), el);
  return {
    normalPadX: space2 * 2,
    compactPadX: space1 * 2
  };
}

export default {
  WEEK_DAY_CHIP_FIT_STAGE,
  WEEK_DAY_CHIP_TIME_MODE,
  judgeWeekDayChipFit,
  measureTextWidth,
  resolveComputedFont,
  readHorizontalPadding,
  readChipPadTokens
};
