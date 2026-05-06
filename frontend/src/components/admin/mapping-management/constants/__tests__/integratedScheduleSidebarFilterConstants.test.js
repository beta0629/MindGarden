import { canScheduleForMapping } from '../integratedScheduleSidebarFilterConstants';

describe('integratedScheduleSidebarFilterConstants — canScheduleForMapping', () => {
  it('returns true for ACTIVE with remainingSessions > 0', () => {
    expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: 3 })).toBe(true);
    expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: 1 })).toBe(true);
  });

  it('returns false for PAYMENT_CONFIRMED even with remaining sessions', () => {
    expect(
      canScheduleForMapping({ status: 'PAYMENT_CONFIRMED', remainingSessions: 5 })
    ).toBe(false);
  });

  it('returns false for DEPOSIT_PENDING', () => {
    expect(canScheduleForMapping({ status: 'DEPOSIT_PENDING', remainingSessions: 2 })).toBe(
      false
    );
  });

  it('returns false for ACTIVE when remainingSessions is 0, null, or undefined', () => {
    expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: 0 })).toBe(false);
    expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: null })).toBe(false);
    expect(canScheduleForMapping({ status: 'ACTIVE' })).toBe(false);
  });

  it('returns false for ACTIVE when remainingSessions is not a finite number', () => {
    expect(canScheduleForMapping({ status: 'ACTIVE', remainingSessions: Number.NaN })).toBe(
      false
    );
  });

  it('returns false when mapping is missing or has no status', () => {
    expect(canScheduleForMapping(undefined)).toBe(false);
    expect(canScheduleForMapping(null)).toBe(false);
    expect(canScheduleForMapping({})).toBe(false);
  });
});
