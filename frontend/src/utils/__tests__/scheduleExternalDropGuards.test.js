import {
  assertExternalMappingDropAllowed,
  assertDropDateNotPast,
  EXTERNAL_DROP_INVALID_PAYLOAD_MESSAGE,
  EXTERNAL_DROP_PAYMENT_NOT_CONFIRMED_MESSAGE,
  EXTERNAL_DROP_NO_REMAINING_SESSIONS_MESSAGE,
  EXTERNAL_DROP_NOT_SCHEDULEABLE_MESSAGE,
  EXTERNAL_DROP_PAST_DATE_MESSAGE
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
