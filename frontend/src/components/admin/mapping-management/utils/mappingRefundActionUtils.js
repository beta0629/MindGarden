/**
 * mappingRefundActionUtils — 배정 카드 「환불」 CTA 분기 SSOT
 *
 * 미병합 추가 패키지(회기가 아직 ACTIVE에 합산되지 않은 행)는 회기 환불이 아니라
 * 추가 회기 수입 전표 취소(무효)로 되돌려야 하므로 일반 ACTIVE 부분 환불과 분리한다.
 * 백엔드 플래그: GET /api/v1/admin/mappings 응답의 additionalPackagePendingMerge.
 *
 * @author CoreSolution
 * @since 2026-09-24
 */

import {
  MAPPING_STATUS_ACTIVE,
  MAPPING_STATUS_PENDING_PAYMENT
} from '../constants/integratedScheduleSidebarFilterConstants';

export const MAPPING_REFUND_ACTION = Object.freeze({
  /** 결제 대기 추가 패키지 — 배정 취소 모달(고아 추가 회기 수입 전표 함께 취소) */
  CANCEL_PENDING_ADDITIONAL: 'CANCEL_PENDING_ADDITIONAL',
  /** 결제·입금 확인 후 미병합 추가 패키지 — 전표 취소(무효) 확인 모달 */
  VOID_ADDITIONAL: 'VOID_ADDITIONAL',
  /** ACTIVE + 잔여 회기 — 부분 환불 모달 */
  PARTIAL_REFUND: 'PARTIAL_REFUND',
  BLOCKED_NOT_ACTIVE: 'BLOCKED_NOT_ACTIVE',
  BLOCKED_NO_REMAINING: 'BLOCKED_NO_REMAINING'
});

/**
 * 미병합 추가 패키지 행 여부 (백엔드 isAdditionalPackagePendingMerge 결과).
 *
 * @param {Object|null|undefined} mapping
 * @returns {boolean}
 */
export function isAdditionalPackagePendingMerge(mapping) {
  return mapping?.additionalPackagePendingMerge === true;
}

/**
 * 「환불」 클릭 시 수행할 동작을 결정한다.
 *
 * @param {Object|null|undefined} mapping - 배정 목록 행
 * @returns {string} MAPPING_REFUND_ACTION 값
 */
export function resolveMappingRefundAction(mapping) {
  if (!mapping) {
    return MAPPING_REFUND_ACTION.BLOCKED_NOT_ACTIVE;
  }
  if (isAdditionalPackagePendingMerge(mapping)) {
    return mapping.status === MAPPING_STATUS_PENDING_PAYMENT
      ? MAPPING_REFUND_ACTION.CANCEL_PENDING_ADDITIONAL
      : MAPPING_REFUND_ACTION.VOID_ADDITIONAL;
  }
  if (mapping.status !== MAPPING_STATUS_ACTIVE) {
    return MAPPING_REFUND_ACTION.BLOCKED_NOT_ACTIVE;
  }
  if (!(Number(mapping.remainingSessions) > 0)) {
    return MAPPING_REFUND_ACTION.BLOCKED_NO_REMAINING;
  }
  return MAPPING_REFUND_ACTION.PARTIAL_REFUND;
}

export default resolveMappingRefundAction;
