/**
 * scheduleDetailSameDayPaymentActions — 가예약 과거 슬롯 당일결제 enablement
 */
import { CONSULTATION_LOG_SESSION_START_TIME_ZONE } from '../../constants/consultationLogAutosaveConstants';
import {
  isTentativePendingPaymentStatus,
  resolveScheduleDetailPaymentActions,
  resolveScheduleSlotBounds,
  resolveSameDayActivationPrimaryAction
} from '../scheduleDetailSameDayPaymentActions';
import { dateFromWallClockInZone } from '../zonedDateTime';

describe('scheduleDetailSameDayPaymentActions', () => {
  // 2026-08-26 15:00 운영 타임존. 브라우저가 그 시간대이면 로컬 15:00 과 같은 순간.
  const now = dateFromWallClockInZone(
    { year: 2026, month: 8, day: 26, hour: 15, minute: 0 },
    CONSULTATION_LOG_SESSION_START_TIME_ZONE
  );

  describe('isTentativePendingPaymentStatus', () => {
    test('TENTATIVE_PENDING_PAYMENT / 가예약 → true', () => {
      expect(isTentativePendingPaymentStatus('TENTATIVE_PENDING_PAYMENT')).toBe(true);
      expect(isTentativePendingPaymentStatus('가예약')).toBe(true);
      expect(isTentativePendingPaymentStatus('결제 대기 (가예약)')).toBe(true);
    });

    test('BOOKED / CONFIRMED → false', () => {
      expect(isTentativePendingPaymentStatus('BOOKED')).toBe(false);
      expect(isTentativePendingPaymentStatus('CONFIRMED')).toBe(false);
      expect(isTentativePendingPaymentStatus('예약됨')).toBe(false);
    });
  });

  describe('resolveScheduleSlotBounds', () => {
    test('date + apiStartTime/apiEndTime → 운영 타임존 Date', () => {
      const { start, end } = resolveScheduleSlotBounds({
        date: '2026-08-26',
        apiStartTime: '10:00',
        apiEndTime: '11:00'
      });
      expect(start.toISOString()).toBe('2026-08-26T01:00:00.000Z');
      expect(end.toISOString()).toBe('2026-08-26T02:00:00.000Z');
      if (Intl.DateTimeFormat().resolvedOptions().timeZone === CONSULTATION_LOG_SESSION_START_TIME_ZONE) {
        expect(start.getFullYear()).toBe(2026);
        expect(start.getMonth()).toBe(7);
        expect(start.getDate()).toBe(26);
        expect(start.getHours()).toBe(10);
        expect(end.getHours()).toBe(11);
      }
    });
  });

  describe('resolveScheduleDetailPaymentActions', () => {
    test('가예약 + now > sessionEnd → 당일결제 활성, 확정 비활성, 취소 유지, 예약변경 비활성', () => {
      const result = resolveScheduleDetailPaymentActions(
        {
          statusCode: 'TENTATIVE_PENDING_PAYMENT',
          date: '2026-08-26',
          apiStartTime: '10:00',
          apiEndTime: '11:00',
          mappingId: 42
        },
        { now }
      );
      expect(result.isTentativePendingPayment).toBe(true);
      expect(result.isSessionEnded).toBe(true);
      expect(result.showSameDayPaymentActivation).toBe(true);
      expect(result.showScheduleConfirm).toBe(false);
      expect(result.showCancel).toBe(true);
      expect(result.showReschedule).toBe(false);
    });

    test('가예약 + now < sessionStart → 당일결제 없음, 확정·취소·예약변경 유지', () => {
      const result = resolveScheduleDetailPaymentActions(
        {
          status: '가예약',
          sessionDate: '2026-08-26',
          apiStartTime: '16:00',
          apiEndTime: '17:00',
          mappingId: 42
        },
        { now }
      );
      expect(result.isTentativePendingPayment).toBe(true);
      expect(result.isSessionEnded).toBe(false);
      expect(result.showSameDayPaymentActivation).toBe(false);
      expect(result.showScheduleConfirm).toBe(true);
      expect(result.showCancel).toBe(true);
      expect(result.showReschedule).toBe(true);
    });

    test('confirmed/paid past → 당일결제 CTA 없음', () => {
      const bookedPast = resolveScheduleDetailPaymentActions(
        {
          statusCode: 'BOOKED',
          date: '2026-08-26',
          apiStartTime: '10:00',
          apiEndTime: '11:00'
        },
        { now }
      );
      expect(bookedPast.showSameDayPaymentActivation).toBe(false);
      expect(bookedPast.isSessionEnded).toBe(true);
      expect(bookedPast.showReschedule).toBe(false);

      const confirmedPast = resolveScheduleDetailPaymentActions(
        {
          statusCode: 'CONFIRMED',
          date: '2026-08-25',
          apiStartTime: '09:00',
          apiEndTime: '10:00'
        },
        { now }
      );
      expect(confirmedPast.showSameDayPaymentActivation).toBe(false);

      const completedPast = resolveScheduleDetailPaymentActions(
        {
          statusCode: 'COMPLETED',
          date: '2026-08-20',
          apiStartTime: '09:00',
          apiEndTime: '10:00'
        },
        { now }
      );
      expect(completedPast.showSameDayPaymentActivation).toBe(false);
      expect(completedPast.showScheduleConfirm).toBe(false);
    });
  });

  describe('resolveSameDayActivationPrimaryAction (cancel-only 방지)', () => {
    test('과거 가예약 + checkout 콜백 있음 → checkout CTA', () => {
      expect(resolveSameDayActivationPrimaryAction({ hasCheckoutCallback: true }))
        .toBe('checkout');
    });

    test('과거 가예약 + checkout 콜백 없음 → 확정 fallback (cancel-only 금지)', () => {
      expect(resolveSameDayActivationPrimaryAction({ hasCheckoutCallback: false }))
        .toBe('confirm');
      expect(resolveSameDayActivationPrimaryAction({}))
        .toBe('confirm');
    });
  });
});
