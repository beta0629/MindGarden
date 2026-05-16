import {
  adminMobileScheduleUserRole,
  canAccessCommunityModeration,
  isAdminMobileAdminRole,
  isAdminMobileShellRole,
  isAdminRole,
  isStaffRole,
  mapApiRoleToStoreRole,
  resolveAdminMobileJwtRole,
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
});
