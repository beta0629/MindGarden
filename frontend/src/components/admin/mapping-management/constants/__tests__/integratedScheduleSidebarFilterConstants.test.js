import {
  canConfirmedScheduleForMapping,
  canScheduleForMapping,
  canTentativeBeforeDepositScheduleForMapping,
  isActiveAssignableMapping,
  isOngoingMapping,
  isPaymentConfirmed,
  isSameDayCardPending,
  normalizedRemainingSessions,
  isInstitutionLinkMapping,
  MAPPING_STATUS_ACTIVE,
  MAPPING_STATUS_CANCELLED,
  MAPPING_STATUS_DEPOSIT_PENDING,
  MAPPING_STATUS_PENDING_PAYMENT,
  MAPPING_STATUS_PAYMENT_CONFIRMED,
  PAYMENT_TIMING_ADVANCE,
  PAYMENT_TIMING_INSTITUTION_LINK,
  PAYMENT_TIMING_SAME_DAY_CARD,
  SIDEBAR_CARD_DRAGGABLE_CLASS,
  SIDEBAR_CARD_DRAGGABLE_SELECTOR,
  STATUS_FILTER_OPTIONS
} from '../integratedScheduleSidebarFilterConstants';

describe('integratedScheduleSidebarFilterConstants', () => {
  describe('canConfirmedScheduleForMapping', () => {
    it('ACTIVE이고 remainingSessions > 0이면 true', () => {
      expect(canConfirmedScheduleForMapping({ status: MAPPING_STATUS_ACTIVE, remainingSessions: 3 })).toBe(
        true
      );
    });

    it('ACTIVE인데 remainingSessions 0이면 false', () => {
      expect(canConfirmedScheduleForMapping({ status: MAPPING_STATUS_ACTIVE, remainingSessions: 0 })).toBe(
        false
      );
    });

    it('타기관 연계 ACTIVE rem=0이면 true', () => {
      expect(
        canConfirmedScheduleForMapping({
          status: MAPPING_STATUS_ACTIVE,
          paymentTiming: PAYMENT_TIMING_INSTITUTION_LINK,
          remainingSessions: 0
        })
      ).toBe(true);
    });

    it('DEPOSIT_PENDING이면 false (확정 예약만)', () => {
      expect(
        canConfirmedScheduleForMapping({ status: MAPPING_STATUS_DEPOSIT_PENDING, remainingSessions: 2 })
      ).toBe(false);
    });

    it('CANCELLED + remaining > 0이면 재배정 가능', () => {
      expect(
        canConfirmedScheduleForMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 5 })
      ).toBe(true);
    });

    it('CANCELLED + remaining 0이면 false', () => {
      expect(
        canConfirmedScheduleForMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 0 })
      ).toBe(false);
    });
  });

  describe('isActiveAssignableMapping', () => {
    it('ACTIVE이면 true', () => {
      expect(isActiveAssignableMapping({ status: MAPPING_STATUS_ACTIVE, remainingSessions: 0 })).toBe(true);
    });

    it('CANCELLED + rem>0이면 true', () => {
      expect(isActiveAssignableMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 1 })).toBe(true);
    });

    it('CANCELLED + rem 0이면 false', () => {
      expect(isActiveAssignableMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 0 })).toBe(false);
    });
  });

  describe('isOngoingMapping', () => {
    it('ACTIVE는 ongoing', () => {
      expect(isOngoingMapping({ status: MAPPING_STATUS_ACTIVE, remainingSessions: 1 })).toBe(true);
    });

    it('CANCELLED + rem>0 는 회기 남은 배정으로 ongoing', () => {
      expect(isOngoingMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 5 })).toBe(true);
    });

    it('CANCELLED + rem 0 은 ongoing 제외', () => {
      expect(isOngoingMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 0 })).toBe(false);
    });

    it('TERMINATED / SESSIONS_EXHAUSTED 는 제외', () => {
      expect(isOngoingMapping({ status: 'TERMINATED', remainingSessions: 2 })).toBe(false);
      expect(isOngoingMapping({ status: 'SESSIONS_EXHAUSTED', remainingSessions: 0 })).toBe(false);
    });
  });

  describe('canTentativeBeforeDepositScheduleForMapping', () => {
    it('ACTIVE이면 true', () => {
      expect(canTentativeBeforeDepositScheduleForMapping({ status: MAPPING_STATUS_ACTIVE })).toBe(true);
    });

    it('기관연계 ACTIVE는 가예약 불가', () => {
      expect(
        canTentativeBeforeDepositScheduleForMapping({
          status: MAPPING_STATUS_ACTIVE,
          paymentTiming: PAYMENT_TIMING_INSTITUTION_LINK
        })
      ).toBe(false);
    });

    it('DEPOSIT_PENDING이면 false (승인 전 가예약 불가)', () => {
      expect(
        canTentativeBeforeDepositScheduleForMapping({ status: MAPPING_STATUS_DEPOSIT_PENDING })
      ).toBe(false);
    });

    it('PAYMENT_CONFIRMED이면 false', () => {
      expect(canTentativeBeforeDepositScheduleForMapping({ status: MAPPING_STATUS_PAYMENT_CONFIRMED })).toBe(false);
    });
  });

  describe('isPaymentConfirmed', () => {
    it('PENDING_PAYMENT이면 false (결제 미확인)', () => {
      expect(isPaymentConfirmed({ status: MAPPING_STATUS_PENDING_PAYMENT })).toBe(false);
    });

    it('PAYMENT_CONFIRMED이면 true', () => {
      expect(isPaymentConfirmed({ status: MAPPING_STATUS_PAYMENT_CONFIRMED })).toBe(true);
    });

    it('ACTIVE이면 true', () => {
      expect(isPaymentConfirmed({ status: MAPPING_STATUS_ACTIVE })).toBe(true);
    });

    it('DEPOSIT_PENDING이면 true', () => {
      expect(isPaymentConfirmed({ status: MAPPING_STATUS_DEPOSIT_PENDING })).toBe(true);
    });

    it('status 없으면 false', () => {
      expect(isPaymentConfirmed(null)).toBe(false);
      expect(isPaymentConfirmed({})).toBe(false);
    });
  });

  describe('normalizedRemainingSessions', () => {
    it('숫자 그대로 반환', () => {
      expect(normalizedRemainingSessions({ remainingSessions: 5 })).toBe(5);
    });

    it('null/undefined → 0', () => {
      expect(normalizedRemainingSessions({ remainingSessions: null })).toBe(0);
      expect(normalizedRemainingSessions({})).toBe(0);
    });

    it('문자열 숫자도 변환', () => {
      expect(normalizedRemainingSessions({ remainingSessions: '3' })).toBe(3);
    });
  });

  describe('canScheduleForMapping', () => {
    it('ACTIVE + remaining > 0이면 true', () => {
      expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: 1 })).toBe(true);
    });

    it('DEPOSIT_PENDING이면 remaining과 무관하게 false', () => {
      expect(canScheduleForMapping({ status: 'DEPOSIT_PENDING', remainingSessions: 0 })).toBe(false);
    });

    it('ACTIVE + remaining 0이면 회기 부족으로 false', () => {
      expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: 0 })).toBe(false);
    });

    it('타기관 연계 ACTIVE rem=0이면 회기 게이트 없이 true', () => {
      expect(
        canScheduleForMapping({
          status: MAPPING_STATUS_ACTIVE,
          paymentTiming: PAYMENT_TIMING_INSTITUTION_LINK,
          remainingSessions: 0
        })
      ).toBe(true);
    });

    it('타기관 연계 PENDING_PAYMENT rem=0이면 선납 전이므로 false', () => {
      expect(
        canScheduleForMapping({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_INSTITUTION_LINK,
          remainingSessions: 0
        })
      ).toBe(false);
    });

    it('타기관 내담자 SAME_DAY PENDING 오배정은 가예약 드래그 불가', () => {
      expect(
        canScheduleForMapping({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          clientEngagementType: 'INSTITUTION_LINK',
          remainingSessions: 0
        })
      ).toBe(false);
    });

    it('PENDING_PAYMENT이면 결제 미확인으로 false', () => {
      expect(canScheduleForMapping({ status: 'PENDING_PAYMENT', remainingSessions: 5 })).toBe(false);
    });

    it('hasUpcomingConsultationSchedule true여도 remainingSessions > 0이면 true (다중 스케줄 허용)', () => {
      expect(
        canScheduleForMapping({
          status: 'ACTIVE',
          remainingSessions: 3,
          hasUpcomingConsultationSchedule: true
        })
      ).toBe(true);
    });

    it('hasUpcomingConsultationSchedule false이면 기존 규칙 유지', () => {
      expect(
        canScheduleForMapping({
          status: 'ACTIVE',
          remainingSessions: 2,
          hasUpcomingConsultationSchedule: false
        })
      ).toBe(true);
    });

    it('PAYMENT_CONFIRMED이면 false (ACTIVE만 스케줄 가능)', () => {
      expect(canScheduleForMapping({ status: 'PAYMENT_CONFIRMED', remainingSessions: 5 })).toBe(false);
    });

    it('mapping 없으면 false', () => {
      expect(canScheduleForMapping(undefined)).toBe(false);
      expect(canScheduleForMapping(null)).toBe(false);
      expect(canScheduleForMapping({})).toBe(false);
    });

    // 옵션 B SAME_DAY_CARD 분기
    it('옵션 B SAME_DAY_CARD + PENDING_PAYMENT 이면 결제·회기 가드를 건너뛰고 true', () => {
      expect(
        canScheduleForMapping({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          remainingSessions: 0
        })
      ).toBe(true);
    });

    it('옵션 B SAME_DAY_CARD + ACTIVE + remaining 0 이면 회기 가드로 false (PENDING_PAYMENT 만 우회)', () => {
      expect(
        canScheduleForMapping({
          status: MAPPING_STATUS_ACTIVE,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          remainingSessions: 0
        })
      ).toBe(false);
    });

    it('옵션 B SAME_DAY_CARD + ACTIVE + remaining 1 이상이면 기본 가드 통과 → true', () => {
      expect(
        canScheduleForMapping({
          status: MAPPING_STATUS_ACTIVE,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          remainingSessions: 1
        })
      ).toBe(true);
    });

    it('CANCELLED + remaining > 0이면 일정 등록 가능', () => {
      expect(canScheduleForMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 5 })).toBe(true);
    });

    it('CANCELLED + remaining 0이면 false', () => {
      expect(canScheduleForMapping({ status: MAPPING_STATUS_CANCELLED, remainingSessions: 0 })).toBe(false);
    });

    it('ADVANCE + PENDING_PAYMENT 는 기존과 동일하게 false (옵션 B 분기 비대상)', () => {
      expect(
        canScheduleForMapping({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_ADVANCE,
          remainingSessions: 5
        })
      ).toBe(false);
    });
  });

  describe('isSameDayCardPending', () => {
    it('PENDING_PAYMENT + SAME_DAY_CARD 이면 true', () => {
      expect(
        isSameDayCardPending({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD
        })
      ).toBe(true);
    });

    it('PENDING_PAYMENT + ADVANCE 면 false', () => {
      expect(
        isSameDayCardPending({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_ADVANCE
        })
      ).toBe(false);
    });

    it('PENDING_PAYMENT + paymentTiming 누락이면 false (레거시 ADVANCE 동등)', () => {
      expect(isSameDayCardPending({ status: MAPPING_STATUS_PENDING_PAYMENT })).toBe(false);
    });

    it('ACTIVE + SAME_DAY_CARD 이면 false (PENDING_PAYMENT 일 때만 분기)', () => {
      expect(
        isSameDayCardPending({
          status: MAPPING_STATUS_ACTIVE,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD
        })
      ).toBe(false);
    });

    it('mapping 없으면 false', () => {
      expect(isSameDayCardPending(null)).toBe(false);
      expect(isSameDayCardPending(undefined)).toBe(false);
      expect(isSameDayCardPending({})).toBe(false);
    });

    it('타기관 내담자 SAME_DAY PENDING 은 가예약 경로 false', () => {
      expect(
        isSameDayCardPending({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          clientEngagementType: 'INSTITUTION_LINK'
        })
      ).toBe(false);
    });
  });

  describe('isInstitutionLinkMapping', () => {
    it('paymentTiming INSTITUTION_LINK 이면 true', () => {
      expect(isInstitutionLinkMapping({ paymentTiming: PAYMENT_TIMING_INSTITUTION_LINK })).toBe(true);
    });

    it('clientEngagementType 만으로도 true', () => {
      expect(
        isInstitutionLinkMapping({
          clientEngagementType: 'INSTITUTION_LINK',
          remainingSessions: 12
        })
      ).toBe(true);
    });

    it('rem=0 만으로는 false', () => {
      expect(isInstitutionLinkMapping({ remainingSessions: 0 })).toBe(false);
    });
  });

  describe('STATUS_FILTER_OPTIONS', () => {
    it('고정 10개 옵션·순서를 유지한다 (사이드바 2열 그리드 계약)', () => {
      expect(STATUS_FILTER_OPTIONS).toHaveLength(10);
      expect(STATUS_FILTER_OPTIONS.map((o) => o.value)).toEqual([
        'ongoing',
        '',
        'PENDING_PAYMENT',
        'PAYMENT_CONFIRMED',
        'DEPOSIT_PENDING',
        'ACTIVE',
        'INACTIVE',
        'TERMINATED',
        'SESSIONS_EXHAUSTED',
        'SUSPENDED'
      ]);
      STATUS_FILTER_OPTIONS.forEach((opt) => {
        expect(typeof opt.label).toBe('string');
        expect(opt.label.length).toBeGreaterThan(0);
      });
    });
  });


  describe('SIDEBAR_CARD_DRAGGABLE', () => {
    it('exports FC-free draggable class and selector', () => {
      expect(SIDEBAR_CARD_DRAGGABLE_CLASS).toBe('integrated-schedule__card--draggable');
      expect(SIDEBAR_CARD_DRAGGABLE_SELECTOR).toBe('.integrated-schedule__card--draggable');
      expect(SIDEBAR_CARD_DRAGGABLE_CLASS).not.toMatch(/fc-event/);
      expect(SIDEBAR_CARD_DRAGGABLE_SELECTOR).not.toMatch(/fc-event/);
    });
  });

});
