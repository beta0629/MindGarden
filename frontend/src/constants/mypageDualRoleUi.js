/**
 * Clinic-OS MyPage dual-role (운영 · 상담) TO-BE v2 UI strings + deep links.
 * Spec cite: clinic-os-mypage-dual.md / CLINIC_OS_MYPAGE_DUAL_TOBE_V2_HANDOFF.md
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import { CONSULTANT_DASHBOARD_ROUTES } from './consultantDashboardRoutes';
import { OFD_LINKS } from './operatorFinanceDashboardStrings';

/** Identity band + role map — dual-role only */
export const MYPAGE_DUAL_IDENTITY = {
  SECTION_ARIA: '계정 신원',
  ROLE_ARIA: '역할'
};

export const MYPAGE_DUAL_ROLE_MAP = {
  TITLE: '역할 지도',
  SECTION_ARIA: '역할 지도',
  /** Landing line — not a mode toggle */
  LANDING:
    '이 계정은 Clinic-OS로 들어옵니다. 역할 전환이나 다시 로그인할 필요는 없습니다.',
  OWN_SALARY_VIEW_LABEL: '본인 급여(조회)',
  OPS_FINANCE_APPROVE_LABEL: '운영·재무(승인)',
  /** Consultant schedule-create remains banned */
  CONSULTANT_SCHEDULE_NOTE: '일정 등록 없음'
};

/**
 * Role-map deep links — reuse existing route SSOT (no hardcoding of rates).
 */
export const MYPAGE_DUAL_ROLE_MAP_LINKS = {
  OWN_SALARY_VIEW: CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT,
  OPS_FINANCE_APPROVE: OFD_LINKS.SALARY.path
};
