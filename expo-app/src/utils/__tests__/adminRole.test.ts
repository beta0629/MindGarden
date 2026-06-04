import {
  adminMobileScheduleListUserRole,
  adminMobileScheduleUserRole,
  canAccessCommunityModeration,
  canManageMappingsOnMobile,
  canRegisterConsultantOnMobile,
  canRegisterStaffOnMobile,
  canViewMappingsOnMobile,
  coerceApiRoleString,
  hasJwtPermission,
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
  it('coerces object-shaped API roles to strings', () => {
    expect(coerceApiRoleString({ name: 'ADMIN' })).toBe('ADMIN');
    expect(coerceApiRoleString({ role: 'STAFF' })).toBe('STAFF');
    expect(coerceApiRoleString('  TENANT_ADMIN  ')).toBe('TENANT_ADMIN');
    expect(coerceApiRoleString(null)).toBeNull();
    expect(coerceApiRoleString({})).toBeNull();
  });

  it('maps ADMIN and legacy tenant admin to admin', () => {
    expect(mapApiRoleToStoreRole('ADMIN')).toBe('admin');
    expect(mapApiRoleToStoreRole('TENANT_ADMIN')).toBe('admin');
    expect(mapApiRoleToStoreRole('ROLE_ADMIN')).toBe('admin');
    expect(mapApiRoleToStoreRole({ name: 'ADMIN' })).toBe('admin');
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

  it('maps ADMIN to STAFF for hub schedule list API only', () => {
    expect(adminMobileScheduleListUserRole('ADMIN')).toBe('STAFF');
    expect(adminMobileScheduleListUserRole('STAFF')).toBe('STAFF');
    expect(adminMobileScheduleListUserRole(null)).toBeNull();
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

  it('reads JWT permissions for consultant registration gate', () => {
    const withPerm = fakeJwt({ role: 'STAFF', permissions: ['CONSULTANT_MANAGE'] });
    const withoutPerm = fakeJwt({ role: 'STAFF', permissions: ['CLIENT_MANAGE'] });
    expect(hasJwtPermission(withPerm, 'CONSULTANT_MANAGE')).toBe(true);
    expect(hasJwtPermission(withoutPerm, 'CONSULTANT_MANAGE')).toBe(false);
    expect(canRegisterConsultantOnMobile('admin', null)).toBe(true);
    expect(canRegisterConsultantOnMobile('staff', withPerm)).toBe(true);
    expect(canRegisterConsultantOnMobile('staff', withoutPerm)).toBe(false);
    expect(canRegisterStaffOnMobile('admin')).toBe(true);
    expect(canRegisterStaffOnMobile('staff')).toBe(false);
  });

  it('allows mapping view and manage for ADMIN and STAFF (STAFF == ADMIN 1.0.5)', () => {
    // 정책: ADMIN/STAFF 둘 다 자동 허용 (JWT permission 의존 제거).
    expect(canViewMappingsOnMobile('admin', null)).toBe(true);
    expect(canViewMappingsOnMobile('staff', null)).toBe(true);
    expect(canManageMappingsOnMobile('admin', null)).toBe(true);
    expect(canManageMappingsOnMobile('staff', null)).toBe(true);
  });

  it('blocks mapping view and manage for CONSULTANT and CLIENT (회귀)', () => {
    expect(canViewMappingsOnMobile('consultant', null)).toBe(false);
    expect(canViewMappingsOnMobile('client', null)).toBe(false);
    expect(canViewMappingsOnMobile(null, null)).toBe(false);
    expect(canManageMappingsOnMobile('consultant', null)).toBe(false);
    expect(canManageMappingsOnMobile('client', null)).toBe(false);
    expect(canManageMappingsOnMobile(null, null)).toBe(false);
  });

  it('treats legacy admin tokens (BRANCH_SUPER_ADMIN 등) as admin for mapping', () => {
    // 레거시 토큰을 mapApiRoleToStoreRole 로 정규화하면 'admin' 으로 매핑되어 mapping 게이트 통과.
    expect(canViewMappingsOnMobile(mapApiRoleToStoreRole('BRANCH_SUPER_ADMIN'), null)).toBe(true);
    expect(canViewMappingsOnMobile(mapApiRoleToStoreRole('TENANT_ADMIN'), null)).toBe(true);
    expect(canManageMappingsOnMobile(mapApiRoleToStoreRole('HQ_ADMIN'), null)).toBe(true);
  });

  it('treats accessToken arg as optional (signature compat, JWT 의존 제거)', () => {
    // 1.0.5 이후 accessToken 인자는 호환을 위해 유지되지만 무시된다.
    const noMappingClaim = fakeJwt({ role: 'STAFF', permissions: ['CLIENT_MANAGE'] });
    expect(canViewMappingsOnMobile('staff', noMappingClaim)).toBe(true);
    expect(canManageMappingsOnMobile('staff', noMappingClaim)).toBe(true);
    expect(canViewMappingsOnMobile('staff')).toBe(true);
    expect(canManageMappingsOnMobile('staff')).toBe(true);
  });
});
