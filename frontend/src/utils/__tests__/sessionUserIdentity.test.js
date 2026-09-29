/**
 * silent SET_USER — 같은 세션 페이로드는 같은 사용자로 본다.
 *
 * @author CoreSolution
 * @since 2026-09-26
 */

import {
  isEquivalentSessionUser,
  resolveSessionUserId
} from '../sessionUserIdentity';

describe('sessionUserIdentity', () => {
  const base = {
    id: 7,
    role: 'ADMIN',
    name: '관리',
    tenantId: 'tenant-a',
    permissionGroupCodes: ['OPS', 'BILLING']
  };

  it('id 를 문자열로 정규화한다', () => {
    expect(resolveSessionUserId({ id: 7 })).toBe('7');
    expect(resolveSessionUserId({ userId: '7' })).toBe('7');
    expect(resolveSessionUserId(null)).toBeNull();
  });

  it('같은 참조·같은 페이로드·키 순서가 달라도 동등하다', () => {
    expect(isEquivalentSessionUser(base, base)).toBe(true);
    expect(isEquivalentSessionUser(base, { ...base })).toBe(true);
    expect(isEquivalentSessionUser(
      { name: '관리', id: 7, role: 'ADMIN' },
      { id: '7', role: 'ADMIN', name: '관리' }
    )).toBe(true);
  });

  it('빈 권한 배열과 필드 생략은 동등하다', () => {
    expect(isEquivalentSessionUser(
      { id: 1, role: 'ADMIN' },
      { id: 1, role: 'ADMIN', permissionGroupCodes: [], availableRoles: [] }
    )).toBe(true);
  });

  it('권한 코드 순서만 달라도 동등하다', () => {
    expect(isEquivalentSessionUser(
      base,
      { ...base, permissionGroupCodes: ['BILLING', 'OPS'] }
    )).toBe(true);
  });

  it('null 끼리는 동등하고, 사용자와 null 은 다르다', () => {
    expect(isEquivalentSessionUser(null, null)).toBe(true);
    expect(isEquivalentSessionUser(base, null)).toBe(false);
    expect(isEquivalentSessionUser(null, base)).toBe(false);
  });

  it('id·이름·휴대폰이 다르면 동등하지 않다', () => {
    expect(isEquivalentSessionUser(base, { ...base, id: 8 })).toBe(false);
    expect(isEquivalentSessionUser(base, { ...base, name: '다른' })).toBe(false);
    expect(isEquivalentSessionUser(base, { ...base, isPhoneVerified: true })).toBe(false);
  });
});
