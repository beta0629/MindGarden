/**
 * 서브카테고리 코드 그룹 → 상위(부모) 코드 그룹 단일 매핑.
 * 화면 분산 if 대신 이 모듈만 사용한다.
 *
 * @author CoreSolution
 * @since 2026-04-08
 */

/** @type {Readonly<Record<string, string>>} */
export const SUBCATEGORY_TO_PARENT_GROUP = Object.freeze({
  EXPENSE_SUBCATEGORY: 'EXPENSE_CATEGORY',
  INCOME_SUBCATEGORY: 'INCOME_CATEGORY'
});

/**
 * @param {string} [codeGroup]
 * @returns {string|null}
 */
export function getParentCodeGroupForSubcategory(codeGroup) {
  if (!codeGroup) {
    return null;
  }
  return SUBCATEGORY_TO_PARENT_GROUP[codeGroup] ?? null;
}

/**
 * @param {string} [codeGroup]
 * @returns {boolean}
 */
export function isSubcategoryCodeGroup(codeGroup) {
  return Boolean(codeGroup && SUBCATEGORY_TO_PARENT_GROUP[codeGroup]);
}
