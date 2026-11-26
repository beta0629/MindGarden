/**
 * 매핑 회기 수 불변식(total == used + remaining) 사용자 메시지.
 * BE AdminServiceUserFacingMessages 와 동일 규칙.
 *
 * @author CoreSolution
 * @since 2026-11-26
 */

export const MAPPING_SESSION_COUNT_MESSAGES = Object.freeze({
  NEGATIVE: '회기 수는 0 이상이어야 합니다.',
  MISMATCH: '회기 수가 일치하지 않습니다. 총 회기 = 사용 회기 + 잔여 회기 이어야 합니다.',
  REMAINING_NEGATIVE: '잔여 회기 수는 0 이상이어야 합니다.',
  REMAINING_EXCEEDS_TOTAL: '잔여 회기 수가 총 회기 수를 초과할 수 없습니다.',
  TOTAL_NEGATIVE: '총 회기 수는 0 이상이어야 합니다.',
  TOTAL_LESS_THAN_USED: '총 회기 수는 사용된 회기 수 이상이어야 합니다.',
  USED_NEGATIVE: '사용 회기 수는 0 이상이어야 합니다.'
});
