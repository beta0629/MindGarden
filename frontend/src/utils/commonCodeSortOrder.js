/**
 * 공통코드 추가 모달의 정렬 순서 기본값.
 * 같은 그룹에 코드가 있으면 최댓값 + 증분, 없으면 빈 목록 기본값.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */

/** 다음 정렬 순서를 띄우는 간격. */
export const COMMON_CODE_SORT_ORDER_STEP = 10;

/** 그룹에 코드가 없을 때 쓰는 기존 기본값. */
export const COMMON_CODE_SORT_ORDER_WHEN_EMPTY = 0;

/**
 * @param {Array<{ sortOrder?: number|string }>|null|undefined} rows 현재 그룹 코드
 * @param {number} [emptyDefault] 코드가 없을 때의 기본값
 * @returns {number}
 */
export function nextCommonCodeSortOrder(rows, emptyDefault = COMMON_CODE_SORT_ORDER_WHEN_EMPTY) {
  const list = Array.isArray(rows) ? rows : [];
  let maxOrder = null;
  for (const row of list) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const value = Number(row.sortOrder);
    if (!Number.isFinite(value)) {
      continue;
    }
    if (maxOrder == null || value > maxOrder) {
      maxOrder = value;
    }
  }
  if (maxOrder == null) {
    return emptyDefault;
  }
  return maxOrder + COMMON_CODE_SORT_ORDER_STEP;
}
