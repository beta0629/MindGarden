/**
 * menuPermissionLockPolicy unit tests
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import {
  getMenuPermissionLock,
  isCenterCustomPermission,
  isOpsFinanceMenu,
  isScheduleCreateMenu,
  normalizeRoleCode
} from '../../utils/menuPermissionLockPolicy';
import { MENU_PERM_LOCK } from '../../constants/menuPermissionManagementStrings';

describe('menuPermissionLockPolicy', () => {
  test('normalizeRoleCode maps aliases', () => {
    expect(normalizeRoleCode('Director')).toBe('ADMIN');
    expect(normalizeRoleCode('Counselor')).toBe('CONSULTANT');
    expect(normalizeRoleCode('STAFF')).toBe('STAFF');
  });

  test('STAFF cannot get ops finance menus', () => {
    const lock = getMenuPermissionLock('STAFF', {
      menuCode: 'ERP_FINANCIAL',
      menuPath: '/erp/financial',
      minRequiredRole: 'ADMIN'
    });
    expect(lock.locked).toBe(true);
    expect(lock.reason).toBe(MENU_PERM_LOCK.STAFF_OPS_FINANCE);
    expect(isOpsFinanceMenu({ menuCode: 'ERP_TAX' })).toBe(true);
  });

  test('CONSULTANT schedule-create hard lock; STAFF can toggle', () => {
    const menu = {
      menuCode: 'CST_SCHEDULE',
      menuPath: '/consultant/schedule',
      minRequiredRole: 'CONSULTANT'
    };
    const consultantLock = getMenuPermissionLock('CONSULTANT', menu);
    expect(consultantLock.locked).toBe(true);
    expect(consultantLock.reason).toBe(MENU_PERM_LOCK.SCHEDULE_CREATE);

    const staffLock = getMenuPermissionLock('STAFF', menu);
    expect(staffLock.locked).toBe(false);
    expect(isScheduleCreateMenu(menu)).toBe(true);
  });

  test('P0 core launch schedule/notification are locked ON', () => {
    const scheduleLock = getMenuPermissionLock('CLIENT', {
      menuCode: 'CLT_SCHEDULE',
      menuPath: '/client/schedule',
      minRequiredRole: 'CLIENT'
    });
    expect(scheduleLock.locked).toBe(true);
    expect(scheduleLock.reason).toBe(MENU_PERM_LOCK.CORE_LAUNCH);

    const notifLock = getMenuPermissionLock('CLIENT', {
      menuCode: 'CLT_NOTIFICATIONS',
      menuPath: '/client/more/notifications',
      menuName: '알림 센터',
      minRequiredRole: 'CLIENT'
    });
    expect(notifLock.locked).toBe(true);
    expect(notifLock.reason).toBe(MENU_PERM_LOCK.CORE_LAUNCH);
  });

  test('center custom uses hasPermission', () => {
    expect(isCenterCustomPermission({ hasPermission: true })).toBe(true);
    expect(isCenterCustomPermission({ hasPermission: false })).toBe(false);
  });
});
