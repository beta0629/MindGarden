/**
 * mypageDualRoleUi — TO-BE v2 route SSOT locks
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import {
  MYPAGE_DUAL_ROLE_MAP,
  MYPAGE_DUAL_ROLE_MAP_LINKS
} from '../mypageDualRoleUi';

describe('mypageDualRoleUi', () => {
  test('role map links reuse existing consultant salary + erp salary routes', () => {
    expect(MYPAGE_DUAL_ROLE_MAP_LINKS.OWN_SALARY_VIEW).toBe('/consultant/salary-settlement');
    expect(MYPAGE_DUAL_ROLE_MAP_LINKS.OPS_FINANCE_APPROVE).toBe('/erp/salary');
  });

  test('copy avoids 손볼 and uses standard Korean labels', () => {
    const blob = [
      MYPAGE_DUAL_ROLE_MAP.LANDING,
      MYPAGE_DUAL_ROLE_MAP.OWN_SALARY_VIEW_LABEL,
      MYPAGE_DUAL_ROLE_MAP.OPS_FINANCE_APPROVE_LABEL,
      MYPAGE_DUAL_ROLE_MAP.CONSULTANT_SCHEDULE_NOTE
    ].join(' ');
    expect(blob).not.toMatch(/손볼/);
    expect(MYPAGE_DUAL_ROLE_MAP.TITLE).toBe('역할 지도');
  });
});
