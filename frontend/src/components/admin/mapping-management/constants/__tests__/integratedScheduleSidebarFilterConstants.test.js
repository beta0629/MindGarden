import {
  canConfirmedScheduleForMapping,
  canScheduleForMapping,
  canTentativeBeforeDepositScheduleForMapping,
  MAPPING_STATUS_ACTIVE,
  MAPPING_STATUS_DEPOSIT_PENDING
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

    it('DEPOSIT_PENDING이면 true', () => {
      expect(
        canTentativeBeforeDepositScheduleForMapping({ status: MAPPING_STATUS_DEPOSIT_PENDING })
      ).toBe(true);
    });

    it('PAYMENT_CONFIRMED이면 false', () => {
      expect(canTentativeBeforeDepositScheduleForMapping({ status: 'PAYMENT_CONFIRMED' })).toBe(false);
    });
  });

  describe('canScheduleForMapping', () => {
    it('ACTIVE + remaining > 0이면 true', () => {
      expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: 1 })).toBe(true);
    });

    it('DEPOSIT_PENDING이면 remaining과 무관하게 true (가예약)', () => {
      expect(canScheduleForMapping({ status: 'DEPOSIT_PENDING', remainingSessions: 0 })).toBe(true);
    });

    it('ACTIVE + remaining 0이면 가예약만 가능하므로 true', () => {
      expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: 0 })).toBe(true);
    });

    it('PAYMENT_CONFIRMED이면 false', () => {
      expect(canScheduleForMapping({ status: 'PAYMENT_CONFIRMED', remainingSessions: 5 })).toBe(false);
    });

    it('mapping 없으면 false', () => {
      expect(canScheduleForMapping(undefined)).toBe(false);
      expect(canScheduleForMapping(null)).toBe(false);
      expect(canScheduleForMapping({})).toBe(false);
    });
  });
});
