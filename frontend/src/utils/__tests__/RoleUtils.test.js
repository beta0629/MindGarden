/**
 * RoleUtils 단위 테스트.
 *
 * 4종 SSOT 헬퍼(isAdmin/isStaff/isConsultant/isClient) + 레거시 mapLegacyRole +
 * isProfessionalProvider 동작을 검증한다.
 *
 * @author Core Solution
 * @since 2026-06-12
 */

import RoleUtils, {
  ROLE_ADMIN,
  ROLE_STAFF,
  ROLE_CONSULTANT,
  ROLE_CLIENT,
  SSOT_ROLES,
  mapLegacyRole,
  getNormalizedRole,
  isAdmin,
  isStaff,
  isConsultant,
  isClient,
  isProfessionalProvider,
  hasRole,
  hasAnyRole
} from '../RoleUtils';

describe('RoleUtils SSOT 상수', () => {
  test('4종 SSOT 상수 값이 정의되어 있다', () => {
    expect(ROLE_ADMIN).toBe('ADMIN');
    expect(ROLE_STAFF).toBe('STAFF');
    expect(ROLE_CONSULTANT).toBe('CONSULTANT');
    expect(ROLE_CLIENT).toBe('CLIENT');
    expect(SSOT_ROLES).toEqual(['ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT']);
  });
});

describe('mapLegacyRole', () => {
  test('4종 SSOT 값은 그대로 반환된다', () => {
    expect(mapLegacyRole('ADMIN')).toBe('ADMIN');
    expect(mapLegacyRole('STAFF')).toBe('STAFF');
    expect(mapLegacyRole('CONSULTANT')).toBe('CONSULTANT');
    expect(mapLegacyRole('CLIENT')).toBe('CLIENT');
  });

  test('레거시 관리자 문자열은 ADMIN 으로 매핑된다', () => {
    expect(mapLegacyRole('BRANCH_SUPER_ADMIN')).toBe('ADMIN');
    expect(mapLegacyRole('BRANCH_ADMIN')).toBe('ADMIN');
    expect(mapLegacyRole('HQ_ADMIN')).toBe('ADMIN');
    expect(mapLegacyRole('HQ_MASTER')).toBe('ADMIN');
    expect(mapLegacyRole('SUPER_HQ_ADMIN')).toBe('ADMIN');
    expect(mapLegacyRole('SUPER_ADMIN')).toBe('ADMIN');
    expect(mapLegacyRole('TENANT_ADMIN')).toBe('ADMIN');
    expect(mapLegacyRole('PRINCIPAL')).toBe('ADMIN');
    expect(mapLegacyRole('OWNER')).toBe('ADMIN');
  });

  test('전문가 세부 유형(PLAY_THERAPIST/SPEECH_THERAPIST/ROLE_CONSULTANT)은 CONSULTANT 로 매핑된다', () => {
    expect(mapLegacyRole('PLAY_THERAPIST')).toBe('CONSULTANT');
    expect(mapLegacyRole('SPEECH_THERAPIST')).toBe('CONSULTANT');
    expect(mapLegacyRole('ROLE_CONSULTANT')).toBe('CONSULTANT');
  });

  test('ROLE_CLIENT 는 CLIENT 로 매핑된다', () => {
    expect(mapLegacyRole('ROLE_CLIENT')).toBe('CLIENT');
  });

  test('알 수 없는 값이나 빈 값은 null 을 반환한다', () => {
    expect(mapLegacyRole(null)).toBeNull();
    expect(mapLegacyRole(undefined)).toBeNull();
    expect(mapLegacyRole('')).toBeNull();
    expect(mapLegacyRole('   ')).toBeNull();
    expect(mapLegacyRole('UNKNOWN_ROLE')).toBeNull();
  });

  test('앞뒤 공백은 trim 후 매핑된다', () => {
    expect(mapLegacyRole('  ADMIN  ')).toBe('ADMIN');
    expect(mapLegacyRole(' HQ_MASTER ')).toBe('ADMIN');
  });
});

describe('getNormalizedRole', () => {
  test('user.role 을 4종 SSOT 로 정규화하여 반환한다', () => {
    expect(getNormalizedRole({ role: 'ADMIN' })).toBe('ADMIN');
    expect(getNormalizedRole({ role: 'HQ_MASTER' })).toBe('ADMIN');
    expect(getNormalizedRole({ role: 'PLAY_THERAPIST' })).toBe('CONSULTANT');
    expect(getNormalizedRole(null)).toBeNull();
    expect(getNormalizedRole({})).toBeNull();
    expect(getNormalizedRole({ role: 'UNKNOWN' })).toBeNull();
  });
});

describe('isAdmin', () => {
  test('4종 SSOT ADMIN 사용자는 true', () => {
    expect(isAdmin({ role: 'ADMIN' })).toBe(true);
  });

  test('레거시 관리자 문자열(BRANCH_SUPER_ADMIN/HQ_MASTER 등)도 true', () => {
    expect(isAdmin({ role: 'BRANCH_SUPER_ADMIN' })).toBe(true);
    expect(isAdmin({ role: 'HQ_MASTER' })).toBe(true);
    expect(isAdmin({ role: 'HQ_ADMIN' })).toBe(true);
    expect(isAdmin({ role: 'TENANT_ADMIN' })).toBe(true);
  });

  test('상담사/내담자/사무원/null 은 false', () => {
    expect(isAdmin({ role: 'CONSULTANT' })).toBe(false);
    expect(isAdmin({ role: 'CLIENT' })).toBe(false);
    expect(isAdmin({ role: 'STAFF' })).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin({})).toBe(false);
  });
});

describe('isStaff', () => {
  test('STAFF 만 true', () => {
    expect(isStaff({ role: 'STAFF' })).toBe(true);
    expect(isStaff({ role: 'ADMIN' })).toBe(false);
    expect(isStaff({ role: 'CONSULTANT' })).toBe(false);
    expect(isStaff({ role: 'CLIENT' })).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
});

describe('isConsultant', () => {
  test('CONSULTANT 와 전문가 세부 유형은 모두 true', () => {
    expect(isConsultant({ role: 'CONSULTANT' })).toBe(true);
    expect(isConsultant({ role: 'PLAY_THERAPIST' })).toBe(true);
    expect(isConsultant({ role: 'SPEECH_THERAPIST' })).toBe(true);
    expect(isConsultant({ role: 'ROLE_CONSULTANT' })).toBe(true);
  });

  test('다른 역할은 false', () => {
    expect(isConsultant({ role: 'ADMIN' })).toBe(false);
    expect(isConsultant({ role: 'STAFF' })).toBe(false);
    expect(isConsultant({ role: 'CLIENT' })).toBe(false);
    expect(isConsultant(null)).toBe(false);
  });
});

describe('isClient', () => {
  test('CLIENT 및 ROLE_CLIENT 는 true, 다른 역할은 false', () => {
    expect(isClient({ role: 'CLIENT' })).toBe(true);
    expect(isClient({ role: 'ROLE_CLIENT' })).toBe(true);
    expect(isClient({ role: 'ADMIN' })).toBe(false);
    expect(isClient({ role: 'CONSULTANT' })).toBe(false);
    expect(isClient(null)).toBe(false);
  });
});

describe('isProfessionalProvider', () => {
  test('CONSULTANT 본인(전문가 세부 유형 포함)만 true', () => {
    expect(isProfessionalProvider({ role: 'CONSULTANT' })).toBe(true);
    expect(isProfessionalProvider({ role: 'PLAY_THERAPIST' })).toBe(true);
    expect(isProfessionalProvider({ role: 'SPEECH_THERAPIST' })).toBe(true);
  });

  test('ADMIN/STAFF/CLIENT 는 false', () => {
    expect(isProfessionalProvider({ role: 'ADMIN' })).toBe(false);
    expect(isProfessionalProvider({ role: 'HQ_MASTER' })).toBe(false);
    expect(isProfessionalProvider({ role: 'STAFF' })).toBe(false);
    expect(isProfessionalProvider({ role: 'CLIENT' })).toBe(false);
    expect(isProfessionalProvider(null)).toBe(false);
  });
});

describe('hasRole / hasAnyRole', () => {
  test('hasRole 은 대상 역할이 레거시여도 정규화 후 비교한다', () => {
    expect(hasRole({ role: 'ADMIN' }, 'HQ_MASTER')).toBe(true);
    expect(hasRole({ role: 'HQ_MASTER' }, 'ADMIN')).toBe(true);
    expect(hasRole({ role: 'CONSULTANT' }, 'PLAY_THERAPIST')).toBe(true);
    expect(hasRole({ role: 'ADMIN' }, 'CONSULTANT')).toBe(false);
    expect(hasRole(null, 'ADMIN')).toBe(false);
    expect(hasRole({ role: 'ADMIN' }, null)).toBe(false);
  });

  test('hasAnyRole 은 목록의 모든 항목을 정규화하여 매칭한다', () => {
    expect(hasAnyRole({ role: 'STAFF' }, ['ADMIN', 'STAFF'])).toBe(true);
    expect(hasAnyRole({ role: 'HQ_MASTER' }, ['ADMIN'])).toBe(true);
    expect(hasAnyRole({ role: 'CLIENT' }, ['ADMIN', 'STAFF'])).toBe(false);
    expect(hasAnyRole({ role: 'ADMIN' }, [])).toBe(false);
    expect(hasAnyRole({ role: 'ADMIN' }, null)).toBe(false);
    expect(hasAnyRole(null, ['ADMIN'])).toBe(false);
  });
});

/* eslint-disable import/no-named-as-default-member */
describe('RoleUtils 디폴트 export', () => {
  test('주요 헬퍼와 상수를 모두 노출한다', () => {
    // 디폴트 export 가 named export 와 동일한 멤버를 노출하는지 확인하는 게이트.
    // 의도적으로 디폴트 객체에서 멤버를 꺼내 비교하므로 import/no-named-as-default-member 룰을 비활성화한다.
    expect(RoleUtils.ROLE_ADMIN).toBe('ADMIN');
    expect(RoleUtils.ROLE_STAFF).toBe('STAFF');
    expect(RoleUtils.ROLE_CONSULTANT).toBe('CONSULTANT');
    expect(RoleUtils.ROLE_CLIENT).toBe('CLIENT');
    expect(typeof RoleUtils.isAdmin).toBe('function');
    expect(typeof RoleUtils.isStaff).toBe('function');
    expect(typeof RoleUtils.isConsultant).toBe('function');
    expect(typeof RoleUtils.isClient).toBe('function');
    expect(typeof RoleUtils.isProfessionalProvider).toBe('function');
    expect(typeof RoleUtils.mapLegacyRole).toBe('function');
    expect(typeof RoleUtils.hasRole).toBe('function');
    expect(typeof RoleUtils.hasAnyRole).toBe('function');
  });
});
/* eslint-enable import/no-named-as-default-member */
