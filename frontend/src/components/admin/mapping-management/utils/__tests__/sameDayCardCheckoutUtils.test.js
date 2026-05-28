/**
 * sameDayCardCheckoutUtils 단위 테스트.
 *
 * 옵션 B (예약 우선 매칭) — 일정 등록 직후 CheckoutSameDayModal 자동 진입 분기 검증.
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import {
  shouldAutoOpenCheckoutSameDayAfterSchedule,
  buildSameDayCardCheckoutMapping,
  resolveMappingCreatedFollowUp
} from '../sameDayCardCheckoutUtils';

describe('shouldAutoOpenCheckoutSameDayAfterSchedule', () => {
  test('PENDING_PAYMENT + SAME_DAY_CARD + 필수 필드 → true', () => {
    expect(
      shouldAutoOpenCheckoutSameDayAfterSchedule({
        mappingStatus: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        mappingId: 1001,
        consultantId: 22,
        clientId: 33,
        packageName: '10회기 패키지'
      })
    ).toBe(true);
  });

  test('PENDING_PAYMENT + ADVANCE → false (옵션 B 분기 비대상)', () => {
    expect(
      shouldAutoOpenCheckoutSameDayAfterSchedule({
        mappingStatus: 'PENDING_PAYMENT',
        paymentTiming: 'ADVANCE',
        mappingId: 1001,
        consultantId: 22,
        packageName: '10회기 패키지'
      })
    ).toBe(false);
  });

  test('ACTIVE + SAME_DAY_CARD → false (PENDING_PAYMENT 일 때만 진입)', () => {
    expect(
      shouldAutoOpenCheckoutSameDayAfterSchedule({
        mappingStatus: 'ACTIVE',
        paymentTiming: 'SAME_DAY_CARD',
        mappingId: 1001,
        consultantId: 22,
        packageName: '10회기 패키지'
      })
    ).toBe(false);
  });

  test('mappingId 누락 → false', () => {
    expect(
      shouldAutoOpenCheckoutSameDayAfterSchedule({
        mappingStatus: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        consultantId: 22,
        packageName: '10회기 패키지'
      })
    ).toBe(false);
  });

  test('consultantId 누락 → false (P0 핫픽스 가드)', () => {
    expect(
      shouldAutoOpenCheckoutSameDayAfterSchedule({
        mappingStatus: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        mappingId: 1001,
        packageName: '10회기 패키지'
      })
    ).toBe(false);
  });

  test('packageName 누락 → false (P0 핫픽스 가드)', () => {
    expect(
      shouldAutoOpenCheckoutSameDayAfterSchedule({
        mappingStatus: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        mappingId: 1001,
        consultantId: 22
      })
    ).toBe(false);
  });

  test('null/undefined/비객체 안전', () => {
    expect(shouldAutoOpenCheckoutSameDayAfterSchedule(null)).toBe(false);
    expect(shouldAutoOpenCheckoutSameDayAfterSchedule(undefined)).toBe(false);
    expect(shouldAutoOpenCheckoutSameDayAfterSchedule('not-object')).toBe(false);
  });
});

describe('buildSameDayCardCheckoutMapping', () => {
  const prefill = {
    mappingStatus: 'PENDING_PAYMENT',
    paymentTiming: 'SAME_DAY_CARD',
    mappingId: 1001,
    consultantId: 22,
    consultantName: '김선희 선생님',
    clientId: 33,
    clientName: '이재학',
    packageName: '10회기 패키지',
    packagePrice: 500000,
    totalSessions: 10
  };

  test('createdSchedule.id 가 sameDaySessionScheduleId 로 prefill 됨', () => {
    const result = buildSameDayCardCheckoutMapping(prefill, { id: 777 });
    expect(result).toEqual({
      id: 1001,
      consultantId: 22,
      consultantName: '김선희 선생님',
      clientId: 33,
      clientName: '이재학',
      packageName: '10회기 패키지',
      packagePrice: 500000,
      totalSessions: 10,
      sameDaySessionScheduleId: 777
    });
  });

  test('createdSchedule.data.id (래핑) 도 정상 추출', () => {
    const result = buildSameDayCardCheckoutMapping(prefill, { data: { id: 888 } });
    expect(result.sameDaySessionScheduleId).toBe(888);
  });

  test('createdSchedule.scheduleId 케이스 호환', () => {
    const result = buildSameDayCardCheckoutMapping(prefill, { scheduleId: 999 });
    expect(result.sameDaySessionScheduleId).toBe(999);
  });

  test('createdSchedule null → sameDaySessionScheduleId null', () => {
    const result = buildSameDayCardCheckoutMapping(prefill, null);
    expect(result.sameDaySessionScheduleId).toBeNull();
  });

  test('packagePrice·totalSessions 누락 → null 로 정규화', () => {
    const minimalPrefill = { ...prefill };
    delete minimalPrefill.packagePrice;
    delete minimalPrefill.totalSessions;
    const result = buildSameDayCardCheckoutMapping(minimalPrefill);
    expect(result.packagePrice).toBeNull();
    expect(result.totalSessions).toBeNull();
  });
});

describe('resolveMappingCreatedFollowUp (P0 핫픽스 2026-05-28 회귀 가드)', () => {
  // 사용자 보고: 매칭 생성 직후 CheckoutSameDayModal 자동 진입을 영구 제거하고
  // 사이드바 드래그 / "당일 결제 + 활성화" 트리거로 일원화한다.
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
    // 추후 누군가 CheckoutSameDayModal 자동 진입을 다시 부활시키지 못하도록 명시 가드.
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
