/**
 * 담당 선생님 색 점 SSOT.
 * - 데이터 색 우선 (color / gradeColor / colorCode 등)
 * - 없으면 테넌트 상담사 목록(비활성 포함) id 오름차순 순번 i → teacher-(i%8+1)
 * - i >= 8 이면 동일 팔레트 색의 속이 빈 점
 * - 해시·UnifiedSchedule 로컬 modulo 금지
 *
 * @author CoreSolution
 * @since 2026-10-14
 */

export const TEACHER_PALETTE_SIZE = 8;

export const TEACHER_COLOR_DATA_FIELDS = Object.freeze([
  'color',
  'gradeColor',
  'colorCode',
  'teacherColor'
]);

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeId(value) {
  if (value == null) {
    return '';
  }
  return String(value).trim();
}

/**
 * @param {object|null|undefined} source
 * @returns {string|null}
 */
function pickColorField(source) {
  if (source == null) {
    return null;
  }
  if (typeof source === 'string') {
    const trimmed = source.trim();
    return trimmed !== '' ? trimmed : null;
  }
  if (typeof source !== 'object') {
    return null;
  }
  for (let i = 0; i < TEACHER_COLOR_DATA_FIELDS.length; i += 1) {
    const key = TEACHER_COLOR_DATA_FIELDS[i];
    const raw = source[key];
    if (raw == null) {
      continue;
    }
    const text = String(raw).trim();
    if (text !== '') {
      return text;
    }
  }
  return null;
}

/**
 * @param {unknown} idA
 * @param {unknown} idB
 * @returns {number}
 */
export function compareConsultantIdsAsc(idA, idB) {
  const a = normalizeId(idA);
  const b = normalizeId(idB);
  if (a === '' && b === '') {
    return 0;
  }
  if (a === '') {
    return 1;
  }
  if (b === '') {
    return -1;
  }
  const numA = Number(a);
  const numB = Number(b);
  if (Number.isFinite(numA) && Number.isFinite(numB)
    && String(numA) === a && String(numB) === b) {
    return numA - numB;
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * 비활성 포함 전체 목록을 id 오름차순으로 정렬 (원본 배열 변경 없음).
 *
 * @param {Array<object>|null|undefined} consultants
 * @returns {Array<object>}
 */
export function sortConsultantsByIdAsc(consultants) {
  const list = Array.isArray(consultants) ? consultants.slice() : [];
  list.sort((left, right) => compareConsultantIdsAsc(
    left?.id ?? left?.consultantId,
    right?.id ?? right?.consultantId
  ));
  return list;
}

/**
 * @param {{
 *   consultantId?: string|number|null,
 *   consultants?: Array<object>|null,
 *   colorFromData?: string|object|null
 * }} input
 * @returns {{
 *   token: string|null,
 *   paletteIndex: number|null,
 *   ordinal: number,
 *   hollow: boolean,
 *   inlineColor?: string
 * }}
 */
export function getTeacherColor(input = {}) {
  const consultants = sortConsultantsByIdAsc(input.consultants);
  const idKey = normalizeId(input.consultantId);
  let ordinal = -1;
  let matched = null;
  if (idKey !== '') {
    ordinal = consultants.findIndex((row) => {
      const rowId = normalizeId(row?.id ?? row?.consultantId);
      return rowId !== '' && rowId === idKey;
    });
    if (ordinal >= 0) {
      matched = consultants[ordinal];
    }
  }

  const dataColor = pickColorField(input.colorFromData) || pickColorField(matched);
  if (dataColor) {
    if (dataColor.startsWith('var(')) {
      return {
        token: dataColor,
        paletteIndex: null,
        ordinal: ordinal >= 0 ? ordinal : 0,
        hollow: false
      };
    }
    return {
      token: null,
      paletteIndex: null,
      ordinal: ordinal >= 0 ? ordinal : 0,
      hollow: false,
      inlineColor: dataColor
    };
  }

  const safeOrdinal = ordinal >= 0 ? ordinal : 0;
  const paletteIndex = safeOrdinal % TEACHER_PALETTE_SIZE;
  const token = `var(--mg-v2-teacher-${paletteIndex + 1})`;
  return {
    token,
    paletteIndex,
    ordinal: safeOrdinal,
    hollow: safeOrdinal >= TEACHER_PALETTE_SIZE
  };
}

export default getTeacherColor;
