/**
 * AdminDashboard 위젯 상수 (G1-02)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

/** Pending List 위젯당 최대 노출 행 수 (요약) */
export const DASHBOARD_PENDING_LIST_MAX_ROWS = 5;

/** Pending List 하단 단일 CTA 라벨 */
export const DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL = '전체 보기';

/** 환불 StatCard 섹션 단일 CTA 라벨 (PR-DASH-01) */
export const DASHBOARD_REFUND_SECTION_CTA_LABEL = '환불 관리 가기';

/** 스케줄 등록 대기(BOOKED) 목록 API (status=BOOKED 쿼리와 함께 사용) */
export const API_ADMIN_SCHEDULES = '/api/v1/admin/schedules';

/** KPI Zone 4블록 ID */
export const DASHBOARD_KPI_IDS = {
  TODAY_BOOKINGS: 'today-bookings',
  PENDING_PAYMENT: 'pending-payment',
  NO_SHOW: 'no-show',
  ACTIVE_SESSIONS: 'active-sessions'
};
