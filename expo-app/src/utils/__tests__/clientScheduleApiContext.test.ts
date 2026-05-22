import {
  isClientScheduleQueryEnabled,
  resolveEffectiveClientScheduleUserId,
} from '../resolveClientScheduleUserId';

describe('resolveEffectiveClientScheduleUserId', () => {
  it('prefers explicit clientId when valid', () => {
    expect(resolveEffectiveClientScheduleUserId(99, 42)).toBe(99);
    expect(resolveEffectiveClientScheduleUserId('88', 42)).toBe(88);
  });

  it('falls back to auth userId when clientId is missing or invalid', () => {
    expect(resolveEffectiveClientScheduleUserId(undefined, 42)).toBe(42);
    expect(resolveEffectiveClientScheduleUserId(0, 42)).toBe(42);
    expect(resolveEffectiveClientScheduleUserId('abc', 42)).toBe(42);
    expect(resolveEffectiveClientScheduleUserId(undefined, undefined)).toBeUndefined();
  });
});

describe('client schedule query gate', () => {
  it('requires ready gate and positive effective userId', () => {
    expect(isClientScheduleQueryEnabled(true, 10)).toBe(true);
    expect(isClientScheduleQueryEnabled(false, 10)).toBe(false);
    expect(isClientScheduleQueryEnabled(true, undefined)).toBe(false);
    expect(isClientScheduleQueryEnabled(true, 0)).toBe(false);
  });
});
