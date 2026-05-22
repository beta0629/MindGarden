import {
  isClientScheduleQueryEnabled,
  resolveClientScheduleUserId,
  resolveEffectiveClientScheduleUserId,
} from '../resolveClientScheduleUserId';
import { decodeJwtPayload } from '../jwtPayload';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('resolveClientScheduleUserId', () => {
  it('prefers store user id when valid', () => {
    expect(resolveClientScheduleUserId(42, null)).toBe(42);
    expect(resolveClientScheduleUserId(42, fakeJwt({ sub: '99' }))).toBe(42);
  });

  it('falls back to JWT sub when store id is missing', () => {
    const token = fakeJwt({ sub: '12345', tenantId: 't-1' });
    expect(resolveClientScheduleUserId(undefined, token)).toBe(12345);
    expect(resolveClientScheduleUserId(0, token)).toBe(12345);
  });

  it('returns undefined when neither store nor JWT has a valid id', () => {
    expect(resolveClientScheduleUserId(undefined, null)).toBeUndefined();
    expect(resolveClientScheduleUserId(0, fakeJwt({ sub: '0' }))).toBeUndefined();
    expect(decodeJwtPayload(fakeJwt({ sub: 'abc' }))).not.toBeNull();
    expect(resolveClientScheduleUserId(undefined, fakeJwt({ sub: 'abc' }))).toBeUndefined();
  });
});

describe('isClientScheduleQueryEnabled', () => {
  it('requires ready gate and positive userId', () => {
    expect(isClientScheduleQueryEnabled(true, 10)).toBe(true);
    expect(isClientScheduleQueryEnabled(false, 10)).toBe(false);
    expect(isClientScheduleQueryEnabled(true, undefined)).toBe(false);
    expect(isClientScheduleQueryEnabled(true, 0)).toBe(false);
  });
});

describe('resolveEffectiveClientScheduleUserId', () => {
  it('prefers explicit clientId when valid', () => {
    expect(resolveEffectiveClientScheduleUserId(99, 42)).toBe(99);
    expect(resolveEffectiveClientScheduleUserId('88', 42)).toBe(88);
  });

  it('falls back to auth userId when clientId is missing or invalid', () => {
    expect(resolveEffectiveClientScheduleUserId(undefined, 42)).toBe(42);
    expect(resolveEffectiveClientScheduleUserId(0, 42)).toBe(42);
    expect(resolveEffectiveClientScheduleUserId('abc', 42)).toBe(42);
  });
});
