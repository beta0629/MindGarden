/**
 * IntegratedMatchingSchedule 옵션 B (예약 우선 매칭) PENDING_PAYMENT 알림 카드 유틸리티.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

/**
 * 매핑 목록에서 `PENDING_PAYMENT` 상태 매핑만 추출한다.
 *
 * @param {Array<{status?: string}>} mappings 매핑 목록 (nullable safe)
 * @returns {Array} PENDING_PAYMENT 매핑 배열
 */
export const filterPendingPaymentMappings = (mappings) => {
  if (!Array.isArray(mappings)) {
    return [];
  }
  return mappings.filter((m) => m && m.status === 'PENDING_PAYMENT');
};

/**
 * PENDING_PAYMENT 매핑 알림 카드 표시 여부 + 카운트 + 우선 후보를 계산한다.
 *
 * @param {Array} mappings 매핑 목록
 * @returns {{ visible: boolean, count: number, firstPending: object | null }}
 */
export const computePendingPaymentAlert = (mappings) => {
  const pending = filterPendingPaymentMappings(mappings);
  return {
    visible: pending.length > 0,
    count: pending.length,
    firstPending: pending[0] || null
  };
};
