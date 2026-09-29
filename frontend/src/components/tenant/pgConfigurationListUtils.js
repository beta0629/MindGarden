/**
 * PG 설정 목록 유틸
 *
 * @author CoreSolution
 * @since 2026-03-22
 */

/**
 * PG 설정이 목록에서 삭제 가능한지 여부.
 * ACTIVE 상태만 삭제 불가 (비활성화 후 삭제).
 *
 * @param {Object|null|undefined} config - PG 설정 객체
 * @returns {boolean}
 */
export function isPgConfigDeletable(config) {
  return Boolean(config) && config.status !== 'ACTIVE';
}
