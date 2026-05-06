import { USER_ROLES } from '../../constants/roles';
import { canRegisterSchedulerByRoleString } from '../scheduleRoleGuards';

describe('scheduleRoleGuards', () => {
  describe('canRegisterSchedulerByRoleString', () => {
    test('ADMIN은 true', () => {
      expect(canRegisterSchedulerByRoleString(USER_ROLES.ADMIN)).toBe(true);
    });

    test('STAFF는 true', () => {
      expect(canRegisterSchedulerByRoleString(USER_ROLES.STAFF)).toBe(true);
    });

    test('CONSULTANT는 false', () => {
      expect(canRegisterSchedulerByRoleString(USER_ROLES.CONSULTANT)).toBe(false);
    });

    test('CLIENT는 false', () => {
      expect(canRegisterSchedulerByRoleString(USER_ROLES.CLIENT)).toBe(false);
    });

    test('BRANCH_SUPER_ADMIN은 true (레거시 세션 문자열)', () => {
      expect(canRegisterSchedulerByRoleString('BRANCH_SUPER_ADMIN')).toBe(true);
    });

    test('null은 false', () => {
      expect(canRegisterSchedulerByRoleString(null)).toBe(false);
    });

    test('빈 문자열은 false', () => {
      expect(canRegisterSchedulerByRoleString('')).toBe(false);
    });

    test('알 수 없는 역할 문자열은 false', () => {
      expect(canRegisterSchedulerByRoleString('UNKNOWN_ROLE')).toBe(false);
    });
  });
});
