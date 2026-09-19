import {
  aggregateSessionBalance,
  countsTowardClientRemainingSessions,
} from '../clientMappingBalance';

describe('countsTowardClientRemainingSessions', () => {
  it('includes shop-paid statuses only', () => {
    expect(countsTowardClientRemainingSessions('ACTIVE')).toBe(true);
    expect(countsTowardClientRemainingSessions('PAYMENT_CONFIRMED')).toBe(true);
    expect(countsTowardClientRemainingSessions('DEPOSIT_PENDING')).toBe(true);
    expect(countsTowardClientRemainingSessions('DEPOSIT_CONFIRMED')).toBe(true);
    expect(countsTowardClientRemainingSessions('PENDING_PAYMENT')).toBe(false);
    expect(countsTowardClientRemainingSessions('SESSIONS_EXHAUSTED')).toBe(false);
    expect(countsTowardClientRemainingSessions(undefined)).toBe(false);
  });
});

describe('aggregateSessionBalance — web home SSOT', () => {
  it('PAYMENT_CONFIRMED rem=10 + SESSIONS_EXHAUSTED rem=0 → remaining===10', () => {
    const balance = aggregateSessionBalance(20, [
      {
        status: 'PAYMENT_CONFIRMED',
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10,
      },
      {
        status: 'SESSIONS_EXHAUSTED',
        totalSessions: 10,
        usedSessions: 10,
        remainingSessions: 0,
      },
    ]);
    expect(balance.remainingSessions).toBe(10);
    expect(balance.clientId).toBe(20);
  });

  it('ACTIVE rem=3 + PAYMENT_CONFIRMED rem=10 → remaining===13', () => {
    const balance = aggregateSessionBalance(1, [
      { status: 'ACTIVE', totalSessions: 5, usedSessions: 2, remainingSessions: 3 },
      {
        status: 'PAYMENT_CONFIRMED',
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 10,
      },
    ]);
    expect(balance.remainingSessions).toBe(13);
  });

  it('does not count PENDING_PAYMENT unpaid as paid remaining', () => {
    const balance = aggregateSessionBalance(1, [
      {
        status: 'PENDING_PAYMENT',
        totalSessions: 10,
        usedSessions: 0,
        remainingSessions: 0,
      },
    ]);
    expect(balance.remainingSessions).toBe(0);
    expect(balance.totalSessions).toBe(0);
  });
});
