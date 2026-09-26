import { PENDING_PAYMENT_KPI_LABEL } from '../../../../../utils/pendingPaymentAggregation';
import {
  canConfirmedScheduleForMapping,
  canScheduleForMapping,
  canTentativeBeforeDepositScheduleForMapping,
  excludeUnpaidSoftFromAssignmentQueues,
  isActiveAssignableMapping,
  isAssignmentQueueMapping,
  isCompletedSingleSessionExhausted,
  isOngoingMapping,
  isSessionsExhaustedListMapping,
  isPaymentConfirmed,
  isSameDayCardPending,
  isUnpaidSoftMapping,
  normalizedRemainingSessions,
  isInstitutionLinkMapping,
  isPreDepositMappingStatus,
  shouldShowUnpaidSoftCheckoutCta,
  MAPPING_STATUS_ACTIVE,
  MAPPING_STATUS_CANCELLED,
  MAPPING_STATUS_DEPOSIT_PENDING,
  MAPPING_STATUS_PENDING_PAYMENT,
  MAPPING_STATUS_PAYMENT_CONFIRMED,
  MAPPING_STATUS_SESSIONS_EXHAUSTED,
  PAYMENT_TIMING_ADVANCE,
  PAYMENT_TIMING_VOUCHER,
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

    it('PENDING_PAYMENT(unpaid soft) 는 ongoing 제외 — 가예약 카드 전용', () => {
      expect(
        isOngoingMapping({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          remainingSessions: 3
        })
      ).toBe(false);
      expect(
        isOngoingMapping({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          remainingSessions: 0
        })
      ).toBe(false);
    });

    it('완료 일정이 있는 단회기는 ACTIVE·잔여 1 이어도 신규배정에서 빠지고 회기 소진에 남는다', () => {
      const mapping = {
        status: MAPPING_STATUS_ACTIVE,
        totalSessions: 1,
        usedSessions: 0,
        remainingSessions: 1,
        paymentTiming: PAYMENT_TIMING_ADVANCE,
        consultationSchedules: [{ id: 11, status: 'COMPLETED' }]
      };
      expect(isCompletedSingleSessionExhausted(mapping)).toBe(true);
      expect(isOngoingMapping(mapping)).toBe(false);
      expect(isSessionsExhaustedListMapping(mapping)).toBe(true);
    });

    it('예약만 있는 단회기는 신규배정에 남고 회기 소진 목록에 넣지 않는다', () => {
      const mapping = {
        status: MAPPING_STATUS_ACTIVE,
        totalSessions: 1,
        usedSessions: 0,
        remainingSessions: 1,
        consultationSchedules: [{ id: 12, status: 'BOOKED' }]
      };
      expect(isCompletedSingleSessionExhausted(mapping)).toBe(false);
      expect(isOngoingMapping(mapping)).toBe(true);
      expect(isSessionsExhaustedListMapping(mapping)).toBe(false);
    });

    it('다회기는 완료 일정이 있어도 신규배정에 남는다', () => {
      const mapping = {
        status: MAPPING_STATUS_ACTIVE,
        totalSessions: 10,
        usedSessions: 1,
        remainingSessions: 9,
        consultationSchedules: [{ id: 13, status: 'COMPLETED' }]
      };
      expect(isCompletedSingleSessionExhausted(mapping)).toBe(false);
      expect(isOngoingMapping(mapping)).toBe(true);
      expect(isSessionsExhaustedListMapping(mapping)).toBe(false);
    });

    it('기관연동·바우처 단회기는 완료 일정이 있어도 신규배정 규칙을 바꾸지 않는다', () => {
      const institutionLink = {
        status: MAPPING_STATUS_ACTIVE,
        paymentTiming: PAYMENT_TIMING_INSTITUTION_LINK,
        totalSessions: 1,
        remainingSessions: 1,
        consultationSchedules: [{ id: 14, status: 'COMPLETED' }]
      };
      const voucher = {
        status: MAPPING_STATUS_ACTIVE,
        paymentTiming: PAYMENT_TIMING_VOUCHER,
        totalSessions: 1,
        remainingSessions: 1,
        consultationSchedules: [{ id: 15, status: 'COMPLETED' }]
      };
      expect(isCompletedSingleSessionExhausted(institutionLink)).toBe(false);
      expect(isOngoingMapping(institutionLink)).toBe(true);
      expect(isSessionsExhaustedListMapping(institutionLink)).toBe(false);
      expect(isCompletedSingleSessionExhausted(voucher)).toBe(false);
      expect(isOngoingMapping(voucher)).toBe(true);
      expect(isSessionsExhaustedListMapping(voucher)).toBe(false);
    });

    it('형제 매핑 완료 일정만으로는 단회기를 소진으로 보지 않는다', () => {
      const mapping = {
        status: MAPPING_STATUS_ACTIVE,
        totalSessions: 1,
        remainingSessions: 1,
        consultationSchedules: [{ id: 16, status: 'BOOKED' }],
        clientConsultationSchedules: [{ id: 17, status: 'COMPLETED' }]
      };
      expect(isCompletedSingleSessionExhausted(mapping)).toBe(false);
      expect(isOngoingMapping(mapping)).toBe(true);
    });

    it('가예약 + 예약 확정 + 입금 미확인 + 잔여 0 은 소진이 아니고 CTA 유지', () => {
      const mapping = {
        status: MAPPING_STATUS_PENDING_PAYMENT,
        paymentStatus: 'PENDING',
        paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
        depositConfirmed: false,
        totalSessions: 1,
        usedSessions: 0,
        remainingSessions: 0,
        consultationSchedules: [{ id: 21, status: 'CONFIRMED' }]
      };
      expect(isPreDepositMappingStatus(mapping)).toBe(true);
      expect(shouldShowUnpaidSoftCheckoutCta(mapping)).toBe(true);
      expect(isCompletedSingleSessionExhausted(mapping)).toBe(false);
      expect(isSessionsExhaustedListMapping(mapping)).toBe(false);
    });

    it('가예약에 COMPLETED 일정이 있어도 입금 전이면 소진으로 보지 않는다', () => {
      const mapping = {
        status: MAPPING_STATUS_PENDING_PAYMENT,
        paymentStatus: 'PENDING',
        paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
        totalSessions: 1,
        usedSessions: 0,
        remainingSessions: 0,
        consultationSchedules: [{ id: 22, status: 'COMPLETED' }]
      };
      expect(isCompletedSingleSessionExhausted(mapping)).toBe(false);
      expect(isSessionsExhaustedListMapping(mapping)).toBe(false);
    });

    it('PAYMENT_CONFIRMED 잔여 0 은 입금 확인 전이라 소진이 아니다', () => {
      const mapping = {
        status: MAPPING_STATUS_PAYMENT_CONFIRMED,
        paymentStatus: 'CONFIRMED',
        totalSessions: 1,
        usedSessions: 0,
        remainingSessions: 0,
        consultationSchedules: [{ id: 23, status: 'COMPLETED' }]
      };
      expect(isPreDepositMappingStatus(mapping)).toBe(true);
      expect(shouldShowUnpaidSoftCheckoutCta(mapping)).toBe(false);
      expect(isCompletedSingleSessionExhausted(mapping)).toBe(false);
    });
  });

  describe('assignment queue Soft 분리 SSOT', () => {
    const softA = {
      id: 'A',
      status: MAPPING_STATUS_PENDING_PAYMENT,
      paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
      remainingSessions: 0
    };
    const activeB = {
      id: 'B',
      status: MAPPING_STATUS_ACTIVE,
      remainingSessions: 2
    };

    it('isUnpaidSoftMapping / isAssignmentQueueMapping 분리', () => {
      expect(isUnpaidSoftMapping(softA)).toBe(true);
      expect(isUnpaidSoftMapping(activeB)).toBe(false);
      expect(isAssignmentQueueMapping(softA)).toBe(false);
      expect(isAssignmentQueueMapping(activeB)).toBe(true);
    });

    it('soft A + active B → 배정 큐에는 B만 (가예약 카드와 id 겹침 없음)', () => {
      const assignmentList = excludeUnpaidSoftFromAssignmentQueues([softA, activeB]);
      expect(assignmentList.map((m) => m.id)).toEqual(['B']);
      const softIds = new Set([softA.id]);
      assignmentList.forEach((m) => {
        expect(softIds.has(m.id)).toBe(false);
      });
      // default NEW+ongoing 경로와 동일: ongoing 필터 후 soft 없음
      const ongoing = assignmentList.filter(isOngoingMapping);
      expect(ongoing.map((m) => m.id)).toEqual(['B']);
    });
  });

  describe('shouldShowUnpaidSoftCheckoutCta', () => {
    it('PENDING_PAYMENT + rem>0 → true', () => {
      expect(
        shouldShowUnpaidSoftCheckoutCta({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          remainingSessions: 1
        })
      ).toBe(true);
    });

    it('PENDING_PAYMENT + rem≤0 → true (입금 전 rem=0 이어도 CTA 유지)', () => {
      expect(
        shouldShowUnpaidSoftCheckoutCta({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          paymentTiming: PAYMENT_TIMING_SAME_DAY_CARD,
          remainingSessions: 0
        })
      ).toBe(true);
      expect(
        shouldShowUnpaidSoftCheckoutCta({
          status: MAPPING_STATUS_PENDING_PAYMENT,
          remainingSessions: null
        })
      ).toBe(true);
    });

    it('ACTIVE 등 non-soft → false', () => {
      expect(
        shouldShowUnpaidSoftCheckoutCta({
          status: MAPPING_STATUS_ACTIVE,
          remainingSessions: 5
        })
      ).toBe(false);
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

    it('PENDING_PAYMENT 칩 라벨은 KPI SSOT(결제 대기) — unpaid soft, pending-deposit/TENTATIVE 아님', () => {
      const pendingOpt = STATUS_FILTER_OPTIONS.find((o) => o.value === 'PENDING_PAYMENT');
      expect(pendingOpt).toBeDefined();
      expect(pendingOpt.label).toBe(PENDING_PAYMENT_KPI_LABEL);
      expect(pendingOpt.label).toBe('결제 대기');
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
