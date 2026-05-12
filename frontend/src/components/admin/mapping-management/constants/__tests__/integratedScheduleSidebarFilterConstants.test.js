import {
  canConfirmedScheduleForMapping,
  canScheduleForMapping,
  canTentativeBeforeDepositScheduleForMapping,
  isPaymentConfirmed,
  normalizedRemainingSessions,
  MAPPING_STATUS_ACTIVE,
  MAPPING_STATUS_DEPOSIT_PENDING,
  MAPPING_STATUS_PENDING_PAYMENT,
  MAPPING_STATUS_PAYMENT_CONFIRMED
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

    it('DEPOSIT_PENDING이면 false (확정 예약만)', () => {
      expect(
        canConfirmedScheduleForMapping({ status: MAPPING_STATUS_DEPOSIT_PENDING, remainingSessions: 2 })
      ).toBe(false);
    });
  });

  describe('canTentativeBeforeDepositScheduleForMapping', () => {
    it('ACTIVE이면 true', () => {
      expect(canTentativeBeforeDepositScheduleForMapping({ status: MAPPING_STATUS_ACTIVE })).toBe(true);
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
  });
});
