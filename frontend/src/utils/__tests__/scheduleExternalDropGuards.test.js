import {
  assertExternalMappingDropAllowed,
  assertDropDateNotPast,
  calendarHasOccupyingConsultationForMapping,
  notifyExternalMappingDropBlocked,
  EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE,
  EXTERNAL_DROP_PAYMENT_NOT_CONFIRMED_MESSAGE,
  EXTERNAL_DROP_NO_REMAINING_SESSIONS_MESSAGE,
  EXTERNAL_DROP_NOT_SCHEDULEABLE_MESSAGE,
  EXTERNAL_DROP_PAST_DATE_MESSAGE,
  EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE,
  EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS
} from '../scheduleExternalDropGuards';

describe('scheduleExternalDropGuards', () => {
  describe('assertExternalMappingDropAllowed', () => {
    it('returns invalid_payload when consultantId is missing', () => {
      const r = assertExternalMappingDropAllowed({
        clientId: 'c1',
        status: 'ACTIVE',
        remainingSessions: 2
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('invalid_payload');
      expect(r.userMessage).toBe(EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE);
    });

    it('returns invalid_payload when clientId is missing', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        status: 'ACTIVE',
        remainingSessions: 2
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('invalid_payload');
    });

    it('returns payment_not_confirmed for PENDING_PAYMENT', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        remainingSessions: 5
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('payment_not_confirmed');
      expect(r.userMessage).toBe(EXTERNAL_DROP_PAYMENT_NOT_CONFIRMED_MESSAGE);
    });

    it('returns no_remaining_sessions for ACTIVE with 0 sessions', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'ACTIVE',
        remainingSessions: 0
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('no_remaining_sessions');
      expect(r.userMessage).toBe(EXTERNAL_DROP_NO_REMAINING_SESSIONS_MESSAGE);
    });

    it('returns ok for INSTITUTION_LINK ACTIVE rem=0', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'ACTIVE',
        paymentTiming: 'INSTITUTION_LINK',
        remainingSessions: 0
      });
      expect(r).toEqual({ ok: true });
    });

    it('returns not_scheduleable for DEPOSIT_PENDING (승인 대기)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'DEPOSIT_PENDING',
        remainingSessions: 3
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('not_scheduleable');
      expect(r.userMessage).toBe(EXTERNAL_DROP_NOT_SCHEDULEABLE_MESSAGE);
    });

    it('returns ok for ACTIVE with remaining sessions', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'ACTIVE',
        remainingSessions: 1
      });
      expect(r).toEqual({ ok: true });
    });

    // 옵션 B SAME_DAY_CARD 분기 — 결제·회기 가드 우회
    it('returns ok for PENDING_PAYMENT + SAME_DAY_CARD (옵션 B)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0
      });
      expect(r).toEqual({ ok: true });
    });

    it('allows provisional SAME_DAY_CARD rem=0 when hasConsultationSchedule is history only', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 269,
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: true,
        hasOpenOccupyingConsultationSchedule: false
      });
      expect(r).toEqual({ ok: true });
    });

    it('rejects provisional SAME_DAY_CARD rem=0 when current mapping has OPEN occupy', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 269,
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: true,
        hasOpenOccupyingConsultationSchedule: true
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('provisional_already_has_schedule');
      expect(r.userMessage).toBe(EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE);
    });

    it('allows rem=0 SAME_DAY_CARD when API history flag is COMPLETED-backed (hasConsultationSchedule)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: true
      });
      expect(r).toEqual({ ok: true });
    });

    it('allows provisional SAME_DAY_CARD when rem>0 even if hasConsultationSchedule', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 2,
        hasConsultationSchedule: true
      });
      expect(r).toEqual({ ok: true });
    });

    it('allows provisional SAME_DAY_CARD when hasConsultationSchedule is false (cancelled-only/no-calendar)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: false
      });
      expect(r).toEqual({ ok: true });
    });

    it('allows when hasConsultationSchedule false BUT calendar COMPLETED for mappingId (이력)', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 100,
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: false
      }, {
        calendarEvents: [
          {
            id: 1,
            extendedProps: {
              mappingId: 100,
              consultantId: 'x',
              clientId: 'y',
              status: 'COMPLETED'
            }
          }
        ]
      });
      expect(r).toEqual({ ok: true });
    });

    it('rejects when hasConsultationSchedule false BUT calendar TENTATIVE for current mappingId', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 101,
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: false
      }, {
        calendarEvents: [
          {
            id: 2,
            extendedProps: {
              mappingId: 101,
              consultantId: 'other',
              clientId: 'other',
              status: 'TENTATIVE_PENDING_PAYMENT'
            }
          }
        ]
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('provisional_already_has_schedule');
    });

    it('allows calendar pair COMPLETED when current mappingId has no OPEN occupy', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 200,
        consultantId: 11,
        clientId: 22,
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: false
      }, {
        calendarEvents: [
          {
            id: 3,
            extendedProps: {
              mappingId: null,
              consultantId: 11,
              clientId: 22,
              status: 'COMPLETED'
            }
          }
        ]
      });
      expect(r).toEqual({ ok: true });
    });

    it('allows CANCELLED-only calendar when hasConsultationSchedule false', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 300,
        consultantId: 11,
        clientId: 22,
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: false
      }, {
        calendarEvents: [
          {
            id: 4,
            extendedProps: {
              mappingId: 300,
              consultantId: 11,
              clientId: 22,
              status: 'CANCELLED'
            }
          }
        ]
      });
      expect(r).toEqual({ ok: true });
    });

    it('allows rem>0 even with occupying calendar events', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 400,
        consultantId: 11,
        clientId: 22,
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 2,
        hasConsultationSchedule: false
      }, {
        existingCalendarHasOccupyingSchedule: true,
        calendarEvents: [
          {
            id: 5,
            extendedProps: {
              mappingId: 400,
              consultantId: 11,
              clientId: 22,
              status: 'BOOKED'
            }
          }
        ]
      });
      expect(r).toEqual({ ok: true });
    });

    it('rejects when options.existingCalendarHasOccupyingSchedule is true (rem=0)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: false
      }, {
        existingCalendarHasOccupyingSchedule: true
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('provisional_already_has_schedule');
      expect(r.userMessage).toBe(EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE);
    });

    /**
     * 리더 SSOT 회귀 — provisional rem=0 + 캘린더 점유 시
     * 정확한 한국어 토스트만 허용 (모달 오픈은 IntegratedMatchingSchedule 가드 return).
     */
    it('SSOT: provisional rem=0 + calendar COMPLETED history → ok (등록 허용)', () => {
      const r = assertExternalMappingDropAllowed({
        mappingId: 901,
        consultantId: 11,
        clientId: 22,
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: true,
        hasOpenOccupyingConsultationSchedule: false
      }, {
        calendarEvents: [
          {
            id: 91,
            extendedProps: {
              mappingId: 999,
              consultantId: 11,
              clientId: 22,
              status: 'COMPLETED'
            }
          }
        ]
      });
      expect(r).toEqual({ ok: true });
    });

    it('SSOT: provisional rem=0 + current mapping TENTATIVE → exact toast, not ok', () => {
      const exactToast = '이미 등록된 가예약(또는 상담) 일정이 있어 다시 등록할 수 없습니다.';
      const r = assertExternalMappingDropAllowed({
        mappingId: 901,
        consultantId: 11,
        clientId: 22,
        status: 'PENDING_PAYMENT',
        paymentTiming: 'SAME_DAY_CARD',
        remainingSessions: 0,
        hasConsultationSchedule: false,
        hasOpenOccupyingConsultationSchedule: false
      }, {
        calendarEvents: [
          {
            id: 91,
            extendedProps: {
              mappingId: 901,
              consultantId: 11,
              clientId: 22,
              status: 'TENTATIVE_PENDING_PAYMENT'
            }
          }
        ]
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('provisional_already_has_schedule');
      expect(r.userMessage).toBe(exactToast);
      expect(EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE).toBe(exactToast);
    });

    it('allows ACTIVE rem>0 with hasConsultationSchedule (existing multi-schedule)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'ACTIVE',
        remainingSessions: 3,
        hasConsultationSchedule: true
      });
      expect(r).toEqual({ ok: true });
    });

    it('returns payment_not_confirmed for PENDING_PAYMENT + ADVANCE (옵션 B 분기 비대상)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        paymentTiming: 'ADVANCE',
        remainingSessions: 5
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('payment_not_confirmed');
    });

    it('returns payment_not_confirmed for PENDING_PAYMENT + 미지정(레거시)', () => {
      const r = assertExternalMappingDropAllowed({
        consultantId: 'x',
        clientId: 'y',
        status: 'PENDING_PAYMENT',
        remainingSessions: 5
      });
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('payment_not_confirmed');
    });
  });

  describe('calendarHasOccupyingConsultationForMapping', () => {
    it('returns false for empty events', () => {
      expect(calendarHasOccupyingConsultationForMapping([], {
        mappingId: 1,
        consultantId: 2,
        clientId: 3
      })).toBe(false);
    });

    it('matches by current mappingId OPEN only, not pair COMPLETED on other mapping', () => {
      expect(calendarHasOccupyingConsultationForMapping([
        {
          id: 9,
          extendedProps: {
            mappingId: 999,
            consultantId: '7',
            clientId: '8',
            status: 'IN_PROGRESS'
          }
        }
      ], {
        mappingId: 1,
        consultantId: 7,
        clientId: 8
      })).toBe(false);
    });

    it('reads UnifiedSchedule `type` as scheduleType (CONSULTATION TENTATIVE OPEN)', () => {
      expect(calendarHasOccupyingConsultationForMapping([
        {
          id: 44,
          extendedProps: {
            mappingId: 901,
            consultantId: 11,
            clientId: 22,
            status: 'TENTATIVE_PENDING_PAYMENT',
            type: 'CONSULTATION'
          }
        }
      ], {
        mappingId: 901,
        consultantId: 11,
        clientId: 22
      })).toBe(true);
    });

    it('ignores COMPLETED CONSULTATION on current mappingId (이력, 차단 아님)', () => {
      expect(calendarHasOccupyingConsultationForMapping([
        {
          id: 44,
          extendedProps: {
            mappingId: 901,
            consultantId: 11,
            clientId: 22,
            status: 'COMPLETED',
            type: 'CONSULTATION'
          }
        }
      ], {
        mappingId: 901,
        consultantId: 11,
        clientId: 22
      })).toBe(false);
    });

    it('ignores non-CONSULTATION type even with COMPLETED status', () => {
      expect(calendarHasOccupyingConsultationForMapping([
        {
          id: 45,
          extendedProps: {
            mappingId: 901,
            consultantId: 11,
            clientId: 22,
            status: 'COMPLETED',
            type: 'VACATION'
          }
        }
      ], {
        mappingId: 901,
        consultantId: 11,
        clientId: 22
      })).toBe(false);
    });
  });

  describe('notifyExternalMappingDropBlocked', () => {
    it('calls warning with exact provisional toast + long duration', () => {
      const notifier = { error: jest.fn(), warning: jest.fn() };
      notifyExternalMappingDropBlocked({
        ok: false,
        kind: 'provisional_already_has_schedule',
        userMessage: EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE
      }, notifier);
      expect(EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS).toBe(4500);
      expect(notifier.warning).toHaveBeenCalledWith(
        '이미 등록된 가예약(또는 상담) 일정이 있어 다시 등록할 수 없습니다.',
        4500
      );
      expect(notifier.warning).toHaveBeenCalledWith(
        EXTERNAL_DROP_PROVISIONAL_ALREADY_HAS_SCHEDULE_MESSAGE,
        EXTERNAL_DROP_PROVISIONAL_TOAST_DURATION_MS
      );
      expect(notifier.error).not.toHaveBeenCalled();
    });

    it('calls error for invalid_payload', () => {
      const notifier = { error: jest.fn(), warning: jest.fn() };
      notifyExternalMappingDropBlocked({
        ok: false,
        kind: 'invalid_payload',
        userMessage: EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE
      }, notifier);
      expect(notifier.error).toHaveBeenCalledWith(EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE);
      expect(notifier.warning).not.toHaveBeenCalled();
    });

    it('no-ops when ok is not false (silent toast forbid only on block)', () => {
      const notifier = { error: jest.fn(), warning: jest.fn() };
      notifyExternalMappingDropBlocked({ ok: true }, notifier);
      expect(notifier.error).not.toHaveBeenCalled();
      expect(notifier.warning).not.toHaveBeenCalled();
    });
  });

  describe('assertDropDateNotPast', () => {
    it('returns past_date for a date before today (midnight)', () => {
      const r = assertDropDateNotPast(new Date('2000-01-01'));
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('past_date');
      expect(r.userMessage).toBe(EXTERNAL_DROP_PAST_DATE_MESSAGE);
    });

    it('accepts ISO string same as Date for past', () => {
      const r = assertDropDateNotPast('1999-06-15');
      expect(r.ok).toBe(false);
      expect(r.kind).toBe('past_date');
    });

    it('returns ok for future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 14);
      expect(assertDropDateNotPast(future)).toEqual({ ok: true });
    });
  });
});
