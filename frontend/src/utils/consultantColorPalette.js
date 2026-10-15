/**
 * 상담사 색 SSOT — GET /api/v1/admin/css-themes/consultant-colors.
 * 범례 스와치와 월간 칩 앞 점은 이 팔레트의 같은 슬롯을 쓴다.
 * 색 값 자체는 API 응답만 쓰고, 화면은 CSS 변수·클래스로만 칠한다.
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

import { sortConsultantsByIdAsc } from './getTeacherColor';

export const CONSULTANT_COLORS_ENDPOINT = '/api/v1/admin/css-themes/consultant-colors';

export const CONSULTANT_COLOR_CLASS = 'mg-v2-consultant-color';

export const CONSULTANT_COLOR_FALLBACK_CLASS = 'mg-v2-consultant-color--fallback';

export const CONSULTANT_COLOR_SLOT_STYLE_ID = 'mg-consultant-color-slots';

const CONSULTANT_COLOR_VARIABLE_PREFIX = '--consultant-color-';

/**
 * StandardizedApi 가 래퍼를 푼 뒤의 data, 또는 래퍼 그대로를 받는다.
 *
 * @param {unknown} payload
 * @returns {string[]}
 */
export function extractConsultantColors(payload) {
  const source = payload
    && typeof payload === 'object'
    && payload.success === true
    && payload.data
    && typeof payload.data === 'object'
    ? payload.data
    : payload;
  const raw = source && typeof source === 'object' ? source.colors : null;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((color) => (color == null ? '' : String(color).trim()))
    .filter((color) => color !== '');
}

/**
 * 상담사 목록 id 오름차순 순번으로 API 팔레트 슬롯(1-based)을 고른다.
 * 같은 목록·같은 id → 범례와 칩이 같은 슬롯.
 *
 * @param {unknown} consultantId
 * @param {Array<object>|null|undefined} consultants
 * @param {number} paletteSize
 * @returns {number|null}
 */
export function resolveConsultantColorSlot(consultantId, consultants, paletteSize) {
  const size = Number(paletteSize);
  if (!Number.isInteger(size) || size <= 0) {
    return null;
  }
  if (consultantId == null || String(consultantId).trim() === '') {
    return null;
  }
  const key = String(consultantId).trim();
  const sorted = sortConsultantsByIdAsc(consultants);
  let ordinal = sorted.findIndex((row) => {
    const rowId = row?.id ?? row?.consultantId;
    return rowId != null && String(rowId).trim() === key;
  });
  if (ordinal < 0) {
    ordinal = 0;
  }
  return (ordinal % size) + 1;
}

/**
 * @param {number|null|undefined} slot
 * @returns {string}
 */
export function consultantColorClassName(slot) {
  if (slot == null) {
    return `${CONSULTANT_COLOR_CLASS} ${CONSULTANT_COLOR_FALLBACK_CLASS}`;
  }
  return `${CONSULTANT_COLOR_CLASS} ${CONSULTANT_COLOR_CLASS}--${slot}`;
}

/**
 * 슬롯 클래스가 `--consultant-color-N` 을 가리키게 한다.
 * 요소 style 속성은 쓰지 않는다. 변수 값은 setConsultantColors 가 API 색으로 넣는다.
 *
 * @param {number} paletteSize
 */
export function syncConsultantColorSlotRules(paletteSize) {
  if (typeof document === 'undefined') {
    return;
  }
  const size = Number(paletteSize);
  let style = document.getElementById(CONSULTANT_COLOR_SLOT_STYLE_ID);
  if (!Number.isInteger(size) || size <= 0) {
    if (style) {
      style.textContent = '';
    }
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = CONSULTANT_COLOR_SLOT_STYLE_ID;
    document.head.appendChild(style);
  }
  const rules = [];
  for (let slot = 1; slot <= size; slot += 1) {
    rules.push(
      `.${CONSULTANT_COLOR_CLASS}--${slot}{--mg-consultant-color:var(${CONSULTANT_COLOR_VARIABLE_PREFIX}${slot})}`
    );
  }
  style.textContent = rules.join('');
}
