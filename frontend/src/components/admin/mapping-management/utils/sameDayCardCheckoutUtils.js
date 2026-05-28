/**
 * 옵션 B (예약 우선 매칭) — 사이드바 카드/드래그 흐름의 SAME_DAY_CARD 분기 유틸 SSOT.
 *
 * 합의서:
 *  - docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md (v1)
 *  - docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md (v2 — Path 3 UX 핫픽스 정착)
 *
 * 옵션 B v2.0 Path 3 UX 핫픽스 (2026-05-28 사용자 결재 14:48 KST):
 *  - 사용자 의도: 일정 등록은 "예약" 단계이므로 결제 수단 선택을 강제하지 않는다.
 *  - 일정 등록 직후 `CheckoutSameDayModal` 자동 진입(`shouldAutoOpenCheckoutSameDayAfterSchedule`
 *    + `buildSameDayCardCheckoutMapping`)은 영구 제거되었다.
 *  - 결제 진입 경로는 사이드바 카드의 "당일 결제 + 활성화" 버튼 단일 경로로 일원화되었으며,
 *    `IntegratedMatchingSchedule.handleOpenCheckoutSameDayFromCard` 에서만 모달을 연다.
 *
 * - `resolveMappingCreatedFollowUp`: 신규 매칭 생성 직후 후속 동작 결정.
 *   매칭 생성 시 자동 모달 진입은 영구 false 이며, 사이드바 안내 토스트만 노출한다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import { PAYMENT_TIMING_SAME_DAY_CARD } from '../constants/integratedScheduleSidebarFilterConstants';

/**
 * 신규 매칭 생성 직후 후속 동작 결정 SSOT.
 *
 * P0 핫픽스 2026-05-28 (사용자 보고) + v2.0 Path 3 정착:
 *  - SAME_DAY_CARD 신규 매칭 생성 시 `CheckoutSameDayModal` 자동 진입은 영구 제거한다.
 *    (이전: handleMappingCreated 에서 paymentTiming === SAME_DAY_CARD 면 모달 자동 오픈 → 사용자 혼란)
 *  - 사용자는 매칭 생성 후 사이드바에서 직접 트리거한다 — 일정 등록(드래그/버튼)
 *    또는 "당일 결제 + 활성화" 버튼.
 *  - 일정 등록 직후 자동 진입 또한 v2.0 Path 3 에서 제거되었으므로, 어떠한 자동 모달 진입도
 *    본 SSOT 에서는 발생하지 않는다.
 *
 * @param {object|null|undefined} result - MappingCreationModal onMappingCreated 콜백 페이로드
 * @returns {{ shouldOpenCheckoutModal: boolean, shouldShowSameDayCardGuidance: boolean }}
 */
export function resolveMappingCreatedFollowUp(result) {
  if (!result || typeof result !== 'object') {
    return { shouldOpenCheckoutModal: false, shouldShowSameDayCardGuidance: false };
  }
  const isSameDayCard =
    result.paymentTiming === PAYMENT_TIMING_SAME_DAY_CARD && Boolean(result.mappingId);
  return {
    shouldOpenCheckoutModal: false,
    shouldShowSameDayCardGuidance: isSameDayCard
  };
}
