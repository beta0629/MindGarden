/**
 * 주/일 칩 가용폭·높이 ResizeObserver + 실제 computed font 측정 → judgeWeekDayChipFit.
 * DEFAULT_TIME_FONT(11px 등) 가정 금지 — getComputedStyle(timeEl).font 사용.
 * client/counselor 텍스트 폭도 computed font 로 측정해 showCounselorName 판정.
 * shortTime 1글자 폭(minTimeGlyphWidth)으로 marker 단계를 판정한다.
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
  readChipPadTokens,
  readRowHeight
} from '../utils/weekDayChipFit';

const DEFAULT_GAP_PX = 4;
const DEFAULT_BADGE_PAD_X = 8;
const DEFAULT_GAP_Y_PX = 2;
const DEFAULT_NAME_GAP_PX = 4;

const INITIAL_FIT = Object.freeze({
  stage: WEEK_DAY_CHIP_FIT_STAGE.SHORT,
  timeMode: WEEK_DAY_CHIP_TIME_MODE.SHORT,
  showBadge: false,
  showTime: true,
  compactPad: false,
  heightStage: WEEK_DAY_CHIP_HEIGHT_STAGE.FULL,
  showStatus: true,
  showTitle: true,
  mergeTimeTitle: false,
  showCounselorName: false,
  markerOnly: false
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
 * title 줄 client/counselor computed font — 미렌더 시 probe 또는 title 상속.
 *
 * @param {Element} chipEl
 * @param {'client'|'counselor'} kind
 * @returns {string|null}
 */
function resolveNameFont(chipEl, kind) {
  const sel = kind === 'counselor' ? '.counselor-name' : '.client-name';
  const existing = chipEl.querySelector(sel);
  if (existing) {
    return resolveComputedFont(existing);
  }
  const title = chipEl.querySelector('.mg-v2-ad-calendar-event__title');
  if (title) {
    return resolveComputedFont(title);
  }
  return resolveComputedFont(chipEl);
}

/**
 * @param {{
 *   chipRef: { current: Element|null },
 *   timeRef?: { current: Element|null },
 *   longTime: string,
 *   shortTime: string,
 *   badgeLabel?: string,
 *   considerBadge?: boolean,
 *   gap?: number,
 *   clientName?: string,
 *   counselorName?: string,
 *   nameGap?: number
 * }} options
 * @returns {{
 *   stage: string,
 *   timeMode: 'long'|'short',
 *   showBadge: boolean,
 *   showTime: boolean,
 *   compactPad: boolean,
 *   heightStage: string,
 *   showStatus: boolean,
 *   showTitle: boolean,
 *   mergeTimeTitle: boolean,
 *   showCounselorName: boolean,
 *   markerOnly: boolean
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
    gap = DEFAULT_GAP_PX,
    clientName = '',
    counselorName = '',
    nameGap = DEFAULT_NAME_GAP_PX
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
      const clientFont = resolveNameFont(el, 'client') || timeFont;
      const counselorFont = resolveNameFont(el, 'counselor') || clientFont || timeFont;

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
      // 숨김 행·flex 눌림: 공용 readRowHeight(line-height/scrollHeight). clientHeight 금지
      const timeRowHeight = readRowHeight(timeRow) || lineH;
      const titleRowHeight = readRowHeight(titleRow) || lineH;
      const statusRowHeight = readRowHeight(statusRow) || lineH;

      const longTimeWidth = measureTextWidth(longTime, timeFont);
      const shortTimeWidth = measureTextWidth(shortTime, timeFont);
      const shortGlyph = shortTime != null && String(shortTime).length > 0
        ? String(shortTime).charAt(0)
        : '';
      const minTimeGlyphWidth = shortGlyph
        ? measureTextWidth(shortGlyph, timeFont)
        : 0;
      const badgeWidth = considerBadge && badgeLabel
        ? measureTextWidth(badgeLabel, badgeFont) + DEFAULT_BADGE_PAD_X
        : 0;

      const clientText = clientName != null ? String(clientName) : '';
      const counselorText = counselorName != null ? String(counselorName) : '';
      const clientNameWidth = clientText
        ? measureTextWidth(clientText, clientFont)
        : 0;
      const counselorNameWidth = counselorText
        ? measureTextWidth(counselorText, counselorFont)
        : 0;
      const minClientWidth = clientText
        ? measureTextWidth(clientText.charAt(0), clientFont)
        : 0;

      setFit(judgeWeekDayChipFit({
        chipWidth,
        compactChipWidth,
        longTimeWidth,
        shortTimeWidth,
        minTimeGlyphWidth,
        badgeWidth,
        gap,
        considerBadge: Boolean(considerBadge && badgeLabel),
        chipHeight,
        timeRowHeight,
        titleRowHeight,
        statusRowHeight,
        gapY: DEFAULT_GAP_Y_PX,
        clientNameWidth,
        counselorNameWidth,
        minClientWidth,
        nameGap
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
    gap,
    clientName,
    counselorName,
    nameGap
  ]);

  return fit;
}
