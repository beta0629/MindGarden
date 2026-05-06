import { USER_ROLES } from '../constants/roles';

/**
 * 세션 등에서 내려온 role 문자열 기준으로 스케줄 «신규 등록» 행위자 여부를 반환한다.
 * 백엔드 DynamicPermissionServiceImpl#canRegisterScheduler(UserRole)와 동일 전제:
 * 관리자(ADMIN)·사무원(STAFF)만 true, 상담사·내담자(CONSULTANT·CLIENT)는 false.
 * 레거시 세션 문자열 BRANCH_SUPER_ADMIN은 UnifiedScheduleComponent의 관리자형 역할과 동일하게 true.
 *
 * @param {string|null|undefined} role 사용자 역할 문자열
 * @returns {boolean} 스케줄러 신규 등록 역할로 간주할지 여부
 */
export function canRegisterSchedulerByRoleString(role) {
  if (!role) {
    return false;
  }
  if (role === USER_ROLES.CONSULTANT || role === USER_ROLES.CLIENT) {
    return false;
  }
  if (role === USER_ROLES.ADMIN || role === USER_ROLES.STAFF) {
    return true;
  }
  if (role === 'BRANCH_SUPER_ADMIN') {
    return true;
  }
  return false;
}
