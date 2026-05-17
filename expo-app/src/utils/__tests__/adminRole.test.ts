import {
  adminMobileScheduleUserRole,
  canAccessCommunityModeration,
  isAdminMobileAdminRole,
  isAdminMobileShellRole,
  isAdminRole,
  isStaffRole,
  mapApiRoleToStoreRole,
  resolveAdminMobileJwtRole,
  resolveStoreRoleFromAccessToken,
  resolveStoreRoleFromJwtPayload,
} from '../adminRole';

function fakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.sig`;
}

describe('adminRole', () => {
  it('maps ADMIN and legacy tenant admin to admin', () => {
    expect(mapApiRoleToStoreRole('ADMIN')).toBe('admin');
    expect(mapApiRoleToStoreRole('TENANT_ADMIN')).toBe('admin');
    expect(mapApiRoleToStoreRole('ROLE_ADMIN')).toBe('admin');
  });

  it('maps STAFF and legacy office roles to staff', () => {
    expect(mapApiRoleToStoreRole('STAFF')).toBe('staff');
    expect(mapApiRoleToStoreRole('OFFICE_STAFF')).toBe('staff');
  });

  it('maps professional providers to consultant', () => {
    expect(mapApiRoleToStoreRole('CONSULTANT')).toBe('consultant');
    expect(mapApiRoleToStoreRole('PLAY_THERAPIST')).toBe('consultant');
  });

  it('does not collapse ADMIN into client', () => {
    expect(mapApiRoleToStoreRole('ADMIN')).not.toBe('client');
  });

  it('gates community moderation to admin only', () => {
    expect(canAccessCommunityModeration('admin')).toBe(true);
    expect(canAccessCommunityModeration('staff')).toBe(false);
    expect(canAccessCommunityModeration('client')).toBe(false);
    expect(isAdminRole('admin')).toBe(true);
    expect(isStaffRole('staff')).toBe(true);
  });

  it('allows admin mobile shell for admin and staff only', () => {
    expect(isAdminMobileShellRole('admin')).toBe(true);
    expect(isAdminMobileShellRole('staff')).toBe(true);
    expect(isAdminMobileShellRole('client')).toBe(false);
    expect(isAdminMobileShellRole('consultant')).toBe(false);
    expect(isAdminMobileShellRole(null)).toBe(false);
  });

  it('resolves JWT role for schedule API from access token', () => {
    const adminToken = fakeJwt({ role: 'ADMIN' });
    const staffToken = fakeJwt({ authorities: ['ROLE_STAFF'] });
    expect(resolveAdminMobileJwtRole(adminToken)).toBe('ADMIN');
    expect(resolveAdminMobileJwtRole(staffToken)).toBe('STAFF');
    expect(resolveAdminMobileJwtRole(null)).toBeNull();
    expect(isAdminMobileAdminRole('ADMIN')).toBe(true);
    expect(isAdminMobileAdminRole('STAFF')).toBe(false);
    expect(adminMobileScheduleUserRole('ADMIN')).toBe('ADMIN');
    expect(adminMobileScheduleUserRole(null)).toBeNull();
  });

  it('resolves store role from JWT for token restore (admin over stale client)', () => {
    const adminToken = fakeJwt({ role: 'ADMIN', sub: '42' });
    expect(resolveStoreRoleFromAccessToken(adminToken)).toBe('admin');
    expect(resolveStoreRoleFromJwtPayload({ role: 'TENANT_ADMIN' })).toBe('admin');
  });

  it('resolves store role for staff and consultant from JWT claims', () => {
    expect(resolveStoreRoleFromAccessToken(fakeJwt({ userRole: 'STAFF' }))).toBe('staff');
    expect(resolveStoreRoleFromAccessToken(fakeJwt({ role: 'CONSULTANT' }))).toBe('consultant');
    expect(resolveStoreRoleFromAccessToken(fakeJwt({ role: 'CLIENT' }))).toBe('client');
  });

  it('picks highest privilege when JWT has multiple role claims', () => {
    expect(
      resolveStoreRoleFromJwtPayload({
        role: 'CLIENT',
        authorities: ['ROLE_STAFF', 'ROLE_ADMIN'],
      }),
    ).toBe('admin');
  });

  it('returns null when JWT has no role claims (keep MMKV role)', () => {
    expect(resolveStoreRoleFromJwtPayload({ tenantId: 't1', sub: '1' })).toBeNull();
    expect(resolveStoreRoleFromAccessToken('not-a-jwt')).toBeNull();
    expect(resolveStoreRoleFromAccessToken(null)).toBeNull();
  });
});
