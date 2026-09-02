import {
  isCounselingDualRole,
  isOperatorCounselingDualRole,
  shouldShowNotificationChannelPreference,
  getMypageRoleDisplayLabel,
  resolveMypageCenterName,
  isConsultantUserProfileRole,
  usesSessionClientProfileApi
} from '../../constants/mypageProfileRoles';
import { USER_ROLES } from '../../constants/roles';

describe('mypageProfileRoles dual-role helpers', () => {
  test('isConsultantUserProfileRole is true only for CONSULTANT', () => {
    expect(isConsultantUserProfileRole(USER_ROLES.CONSULTANT)).toBe(true);
    expect(isConsultantUserProfileRole(USER_ROLES.ADMIN)).toBe(false);
  });

  test('usesSessionClientProfileApi is false for CONSULTANT', () => {
    expect(usesSessionClientProfileApi(USER_ROLES.CONSULTANT)).toBe(false);
    expect(usesSessionClientProfileApi(USER_ROLES.ADMIN)).toBe(true);
  });

  test('isCounselingDualRole for consultant or counselingEnabled admin', () => {
    expect(isCounselingDualRole({ role: USER_ROLES.CONSULTANT })).toBe(true);
    expect(isCounselingDualRole({ role: USER_ROLES.ADMIN, counselingEnabled: true })).toBe(true);
    expect(isCounselingDualRole({ role: USER_ROLES.ADMIN, counselingEnabled: false })).toBe(false);
  });

  test('isOperatorCounselingDualRole excludes pure consultant', () => {
    expect(isOperatorCounselingDualRole({ role: USER_ROLES.CONSULTANT })).toBe(false);
    expect(isOperatorCounselingDualRole({ role: USER_ROLES.ADMIN, counselingEnabled: true })).toBe(true);
    expect(isOperatorCounselingDualRole({ role: USER_ROLES.STAFF, counselingEnabled: true })).toBe(true);
  });

  test('shouldShowNotificationChannelPreference for client and counseling roles', () => {
    expect(shouldShowNotificationChannelPreference({ role: USER_ROLES.CLIENT })).toBe(true);
    expect(shouldShowNotificationChannelPreference({ role: USER_ROLES.CONSULTANT })).toBe(true);
    expect(
      shouldShowNotificationChannelPreference({ role: USER_ROLES.ADMIN, counselingEnabled: true })
    ).toBe(true);
    expect(
      shouldShowNotificationChannelPreference({ role: USER_ROLES.ADMIN, counselingEnabled: false })
    ).toBe(false);
  });

  test('getMypageRoleDisplayLabel shows 운영 · 상담 for dual-role operator', () => {
    expect(
      getMypageRoleDisplayLabel({ role: USER_ROLES.ADMIN, counselingEnabled: true })
    ).toBe('운영 · 상담');
    expect(getMypageRoleDisplayLabel({ role: USER_ROLES.CONSULTANT })).toBe('상담사');
  });

  test('resolveMypageCenterName prefers tenant.name', () => {
    expect(resolveMypageCenterName({ tenant: { name: '테스트 센터' } })).toBe('테스트 센터');
    expect(resolveMypageCenterName({ tenantName: '레거시 센터' })).toBe('레거시 센터');
  });
});
