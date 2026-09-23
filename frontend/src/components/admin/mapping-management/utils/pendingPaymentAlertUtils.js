/**
 * IntegratedMatchingSchedule 옵션 B (예약 우선 매칭) unpaid soft 알림 카드 유틸리티.
 *
 * 건수·목록은 {@link selectPendingPaymentMappings} SSOT 를 사용한다
 * (status === 'PENDING_PAYMENT' 리터럴 중복 금지).
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import { selectPendingPaymentMappings } from '../../../../utils/pendingPaymentAggregation';

/**
 * 매핑 목록에서 unpaid soft(PENDING_PAYMENT) 매핑만 추출한다.
 *
 * @param {Array<{status?: string}>} mappings 매핑 목록 (nullable safe)
 * @returns {Array} unpaid soft 매핑 배열
 */
export const filterPendingPaymentMappings = (mappings) => {
  return selectPendingPaymentMappings(mappings);
};

/**
 * unpaid soft 매핑 알림 카드 표시 여부 + 카운트 + 우선 후보를 계산한다.
 * 호출부는 반드시 전체 merged `mappings` 를 넘긴다 (filteredMappings 금지).
 *
 * @param {Array} mappings 매핑 목록 (full merged)
 * @returns {{ visible: boolean, count: number, firstPending: object | null }}
 */
export const computePendingPaymentAlert = (mappings) => {
  const pending = selectPendingPaymentMappings(mappings);
  return {
    visible: pending.length > 0,
    count: pending.length,
    firstPending: pending[0] || null
  };
};
