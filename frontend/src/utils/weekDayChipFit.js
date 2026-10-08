/**
 * 주/일 일정 칩 fit 판정 — 폭(time-first) + 높이(status→merge→title 숨김) 단계.
 * 뷰포트·하드코딩 109px·가정 font-size 금지. 화면별 분기 금지.
 *
 * Width stages (time first, never truncate/ellipsis time or badge):
 *   1. long + badge → 2. long → 3. short + badge → 4. short
 *   5. compact-pad → 6. hide-time
 *
 * Height stages (combine with width):
 *   full → hide-status → merge-time-title(한 줄) → hide-title → time-detail
 *
 * 빈 칩 금지: 어떤 폭·높이에서도 짧은 시간 또는 이름 중 하나 이상 표시.
 *
 * @author CoreSolution
 * @since 2026-10-08
 */

import { formatNameWithSecondary } from './safeDisplay';
import { MAPPING_ENGAGEMENT_TYPE_LABELS } from '../constants/mappingEngagementType';

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

export const WEEK_DAY_CHIP_HEIGHT_STAGE = Object.freeze({
  FULL: 'full',
  HIDE_STATUS: 'hide-status',
  MERGE_TIME_TITLE: 'merge-time-title',
  HIDE_TITLE: 'hide-title',
  TIME_DETAIL: 'time-detail'
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
 * 높이 단계: 상태 숨김 → 시간·이름 한 줄 병합 → 이름 숨김 → title·상세만.
 *
 * @param {{
 *   chipHeight?: number,
 *   timeRowHeight?: number,
 *   titleRowHeight?: number,
 *   statusRowHeight?: number,
 *   gapY?: number
 * }} input
 * @returns {{
 *   heightStage: string,
 *   showStatus: boolean,
 *   showTitle: boolean,
 *   mergeTimeTitle: boolean
 * }}
 */
export function judgeWeekDayChipHeightFit(input = {}) {
  const chipHeight = Number(input.chipHeight);
  const timeH = Number(input.timeRowHeight);
  const titleH = Number(input.titleRowHeight);
  const statusH = Number(input.statusRowHeight);
  const gapY = Number.isFinite(Number(input.gapY)) ? Math.max(0, Number(input.gapY)) : 0;

  const safeChip = Number.isFinite(chipHeight) && chipHeight > 0 ? chipHeight : 0;
  const safeTime = Number.isFinite(timeH) && timeH >= 0 ? timeH : 0;
  const safeTitle = Number.isFinite(titleH) && titleH >= 0 ? titleH : 0;
  const safeStatus = Number.isFinite(statusH) && statusH >= 0 ? statusH : 0;

  const fits = (need) => safeChip + 0.5 >= need;

  const fullNeed = safeTime + safeTitle + safeStatus
    + (safeTitle > 0 && safeTime > 0 ? gapY : 0)
    + (safeStatus > 0 && (safeTitle > 0 || safeTime > 0) ? gapY : 0);
  if (fits(fullNeed) || safeChip <= 0) {
    return {
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.FULL,
      showStatus: true,
      showTitle: true,
      mergeTimeTitle: false
    };
  }

  const withoutStatus = safeTime + safeTitle
    + (safeTitle > 0 && safeTime > 0 ? gapY : 0);
  if (fits(withoutStatus)) {
    return {
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_STATUS,
      showStatus: false,
      showTitle: true,
      mergeTimeTitle: false
    };
  }

  // 한 줄: 시간+이름을 같은 행에 배치 (두 줄 높이 미만)
  const mergeNeed = Math.max(safeTime, safeTitle, 1);
  if (fits(mergeNeed)) {
    return {
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.MERGE_TIME_TITLE,
      showStatus: false,
      showTitle: true,
      mergeTimeTitle: true
    };
  }

  if (fits(safeTime + 0.5) || safeTime <= 0) {
    return {
      heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_TITLE,
      showStatus: false,
      showTitle: false,
      mergeTimeTitle: false
    };
  }

  return {
    heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.TIME_DETAIL,
    showStatus: false,
    showTitle: false,
    mergeTimeTitle: false
  };
}

/**
 * 빈 칩 금지 — 짧은 시간 또는 이름 중 하나 이상 강제.
 *
 * @param {{
 *   showTime: boolean,
 *   showTitle: boolean,
 *   mergeTimeTitle?: boolean,
 *   heightStage?: string
 * }} fit
 * @returns {{
 *   showTime: boolean,
 *   showTitle: boolean,
 *   mergeTimeTitle: boolean,
 *   heightStage: string
 * }}
 */
export function enforceNonEmptyChipVisible(fit = {}) {
  let showTime = Boolean(fit.showTime);
  let showTitle = Boolean(fit.showTitle);
  let mergeTimeTitle = Boolean(fit.mergeTimeTitle);
  let heightStage = fit.heightStage || WEEK_DAY_CHIP_HEIGHT_STAGE.FULL;

  // 시간 미표시면 merge 불가
  if (!showTime && mergeTimeTitle) {
    mergeTimeTitle = false;
  }

  if (showTime || showTitle) {
    return { showTime, showTitle, mergeTimeTitle, heightStage };
  }

  // 폭이 시간을 숨긴 경우 → 이름 우선. 그 외 → 짧은 시간 우선.
  if (fit.stage === WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME) {
    showTitle = true;
    mergeTimeTitle = false;
    heightStage = WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_TITLE;
  } else {
    showTime = true;
    mergeTimeTitle = false;
    heightStage = WEEK_DAY_CHIP_HEIGHT_STAGE.HIDE_TITLE;
  }
  return { showTime, showTitle, mergeTimeTitle, heightStage };
}

/**
 * @param {{
 *   chipWidth: number,
 *   longTimeWidth: number,
 *   shortTimeWidth: number,
 *   badgeWidth?: number,
 *   gap?: number,
 *   considerBadge?: boolean,
 *   compactChipWidth?: number,
 *   chipHeight?: number,
 *   timeRowHeight?: number,
 *   titleRowHeight?: number,
 *   statusRowHeight?: number,
 *   gapY?: number
 * }} input
 * @returns {{
 *   stage: string,
 *   timeMode: 'long'|'short',
 *   showBadge: boolean,
 *   showTime: boolean,
 *   compactPad: boolean,
 *   heightStage: string,
 *   showStatus: boolean,
 *   showTitle: boolean,
 *   mergeTimeTitle: boolean
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

  let widthFit;
  if (considerBadge && fits(safeLong + gap + safeBadge)) {
    widthFit = {
      stage: WEEK_DAY_CHIP_FIT_STAGE.LONG_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.LONG,
      showBadge: true,
      showTime: true,
      compactPad: false
    };
  } else if (fits(safeLong)) {
    widthFit = {
      stage: WEEK_DAY_CHIP_FIT_STAGE.LONG,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.LONG,
      showBadge: false,
      showTime: true,
      compactPad: false
    };
  } else if (considerBadge && fits(safeShort + gap + safeBadge)) {
    widthFit = {
      stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT_BADGE,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: true,
      showTime: true,
      compactPad: false
    };
  } else if (fits(safeShort)) {
    widthFit = {
      stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: false,
      showTime: true,
      compactPad: false
    };
  } else if (considerBadge && fits(safeShort + gap + safeBadge, safeCompact)) {
    widthFit = {
      stage: WEEK_DAY_CHIP_FIT_STAGE.COMPACT_PAD,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: true,
      showTime: true,
      compactPad: true
    };
  } else if (fits(safeShort, safeCompact)) {
    widthFit = {
      stage: WEEK_DAY_CHIP_FIT_STAGE.COMPACT_PAD,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: false,
      showTime: true,
      compactPad: true
    };
  } else {
    widthFit = {
      stage: WEEK_DAY_CHIP_FIT_STAGE.HIDE_TIME,
      timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
      showBadge: considerBadge && fits(safeBadge, safeCompact),
      showTime: false,
      compactPad: true
    };
  }

  const heightFit = judgeWeekDayChipHeightFit(input);
  const combined = { ...widthFit, ...heightFit };
  const nonEmpty = enforceNonEmptyChipVisible(combined);
  return {
    ...combined,
    showTime: nonEmpty.showTime,
    showTitle: nonEmpty.showTitle,
    mergeTimeTitle: nonEmpty.mergeTimeTitle,
    heightStage: nonEmpty.heightStage
  };
}

/**
 * title / aria-label — 시간·이름·상태·기관연계(해당 시). 배지·시간 숨김과 무관.
 *
 * @param {{
 *   timeText?: string,
 *   clientName?: string,
 *   statusLabel?: string,
 *   institutionLabel?: string|null,
 *   showInstitution?: boolean
 * }} parts
 * @returns {string}
 */
export function buildWeekDayChipA11yLabel(parts = {}) {
  const time = formatNameWithSecondary(parts.timeText, '').trim();
  const name = formatNameWithSecondary(parts.clientName, '').trim();
  const status = formatNameWithSecondary(parts.statusLabel, '').trim();
  let institution = '';
  if (parts.showInstitution) {
    institution = formatNameWithSecondary(
      parts.institutionLabel || MAPPING_ENGAGEMENT_TYPE_LABELS.INSTITUTION_LINK,
      ''
    ).trim();
  } else if (parts.institutionLabel) {
    institution = formatNameWithSecondary(parts.institutionLabel, '').trim();
  }

  const nameStatus = [name, status].filter(Boolean).join(' - ');
  const core = [time, nameStatus].filter(Boolean).join(' · ');
  if (institution) {
    return core ? `${core} · ${institution}` : institution;
  }
  return core;
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
  WEEK_DAY_CHIP_HEIGHT_STAGE,
  judgeWeekDayChipFit,
  judgeWeekDayChipHeightFit,
  enforceNonEmptyChipVisible,
  buildWeekDayChipA11yLabel,
  measureTextWidth,
  resolveComputedFont,
  readHorizontalPadding,
  readChipPadTokens
};
