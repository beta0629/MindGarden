/**
 * sameDayCardCheckoutUtils 단위 테스트.
 *
 * 옵션 B (예약 우선 매칭) — 신규 매칭 생성 직후 후속 동작 SSOT 검증.
 * 합의서:
 *  - docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md (v1)
 *  - docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md (v2 — Path 3 UX 핫픽스)
 *
 * v2.0 Path 3 핫픽스 (2026-05-28):
 *  - `shouldAutoOpenCheckoutSameDayAfterSchedule` / `buildSameDayCardCheckoutMapping` 헬퍼는
 *    영구 제거되었다. (일정 등록 직후 결제 모달 자동 진입 제거 — Q3 default 권장안 채택)
 *  - 본 테스트는 잔존 SSOT(`resolveMappingCreatedFollowUp`) 의 회귀 가드만 다룬다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import { resolveMappingCreatedFollowUp } from '../sameDayCardCheckoutUtils';

describe('resolveMappingCreatedFollowUp (P0 핫픽스 + v2.0 Path 3 회귀 가드)', () => {
  // 사용자 보고: 매칭 생성 직후 CheckoutSameDayModal 자동 진입을 영구 제거하고
  // 사이드바 "당일 결제 + 활성화" 트리거로 일원화한다.
  test('SAME_DAY_CARD + mappingId → 자동 모달 진입은 항상 false, 가이드 토스트는 true', () => {
    const result = resolveMappingCreatedFollowUp({
      paymentTiming: 'SAME_DAY_CARD',
      mappingId: 9001,
      consultantId: 11,
      packageName: '10회기 패키지'
    });
    expect(result).toEqual({
      shouldOpenCheckoutModal: false,
      shouldShowSameDayCardGuidance: true
    });
  });

  test('ADVANCE 결제 → 자동 모달·가이드 토스트 모두 false', () => {
    const result = resolveMappingCreatedFollowUp({
      paymentTiming: 'ADVANCE',
      mappingId: 9001
    });
    expect(result.shouldOpenCheckoutModal).toBe(false);
    expect(result.shouldShowSameDayCardGuidance).toBe(false);
  });

  test('SAME_DAY_CARD 이지만 mappingId 누락 → 가이드 토스트도 false (방어)', () => {
    const result = resolveMappingCreatedFollowUp({
      paymentTiming: 'SAME_DAY_CARD'
    });
    expect(result.shouldShowSameDayCardGuidance).toBe(false);
    expect(result.shouldOpenCheckoutModal).toBe(false);
  });

  test('회귀 가드: paymentTiming/mappingId 가 갖춰져도 shouldOpenCheckoutModal 은 절대 true 가 되지 않는다', () => {
    // v2.0 Path 3: 일정 등록 직후 자동 진입 또한 제거되었으므로, 매칭 생성 / 일정 등록 어떤 시점에서도
    // CheckoutSameDayModal 자동 진입이 부활하지 못하도록 명시 가드.
    const result = resolveMappingCreatedFollowUp({
      paymentTiming: 'SAME_DAY_CARD',
      mappingId: 9001,
      consultantId: 11,
      packageName: '10회기 패키지',
      packagePrice: 500000,
      totalSessions: 10
    });
    expect(result.shouldOpenCheckoutModal).toBe(false);
  });

  test('null / undefined / 비객체 → 모두 false (안전)', () => {
    expect(resolveMappingCreatedFollowUp(null)).toEqual({
      shouldOpenCheckoutModal: false,
      shouldShowSameDayCardGuidance: false
    });
    expect(resolveMappingCreatedFollowUp(undefined)).toEqual({
      shouldOpenCheckoutModal: false,
      shouldShowSameDayCardGuidance: false
    });
    expect(resolveMappingCreatedFollowUp('not-object')).toEqual({
      shouldOpenCheckoutModal: false,
      shouldShowSameDayCardGuidance: false
    });
  });
});
