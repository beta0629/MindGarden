/**
 * Admin Dashboard V2 — 관리 기능 카드·대시보드 메뉴 영역 표시 제어 (SSOT)
 *
 * @author CoreSolution
 * @since 2026-04-16
 */

/** 대시보드 메뉴(시스템 모니터링, 권한 관리, 환불 현황 등) 숨김 여부 */
export const HIDE_DASHBOARD_MENUS = true;

/** 관리 기능 카드 중 숨길 항목 (통합/중복으로 대체된 메뉴) */
export const HIDE_ADMIN_CARD_IDS = new Set([
  'sessions', // 회기 관리
  'schedule-auto-complete', // 스케줄 자동 완료
  'schedule-complete-reminder', // 스케줄 완료 + 알림
  'consultant-comprehensive', // 상담사 관리
  'client-comprehensive', // 내담자 관리
  'dashboards', // 대시보드 관리
  'cache-monitoring', // 캐시 모니터링
  'security-monitoring', // 보안 모니터링
  'merge-duplicate-mappings', // 중복 매칭 통합
  'user-management', // 사용자 관리 (관리 기능에서 숨김)
  'wellness' // 웰니스 알림 관리 (관리 기능에서 숨김)
]);
