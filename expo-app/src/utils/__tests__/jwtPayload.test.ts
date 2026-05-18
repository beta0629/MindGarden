import { decodeJwtPayload, parseJwtSubAsUserId } from '../jwtPayload';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('jwtPayload', () => {
  it('parseJwtSubAsUserId reads numeric and string sub', () => {
    expect(parseJwtSubAsUserId({ sub: 42 })).toBe(42);
    expect(parseJwtSubAsUserId({ sub: '99' })).toBe(99);
    expect(parseJwtSubAsUserId({ sub: '0' })).toBeNull();
    expect(parseJwtSubAsUserId({ sub: 'abc' })).toBeNull();
    expect(parseJwtSubAsUserId(null)).toBeNull();
  });

  it('decodeJwtPayload extracts sub from access token', () => {
    const token = fakeJwt({ sub: '12345', tenantId: 't-1' });
    const payload = decodeJwtPayload(token);
    expect(parseJwtSubAsUserId(payload)).toBe(12345);
    expect(payload?.tenantId).toBe('t-1');
  });
});
