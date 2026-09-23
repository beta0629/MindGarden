/**
 * AdminDashboard 위젯 상수 (G1-02)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

import { DEFAULTS } from './adminDashboard';
import { STATUS } from './schedule';

/** Admin 대시보드 초기 목록 page (0-based, PaginationUtils 정합) */
export const ADMIN_DASHBOARD_LIST_PAGE = 0;

/** Admin 대시보드 초기 목록 size — {@link DEFAULTS.PAGE_SIZE} */
export const ADMIN_DASHBOARD_LIST_PAGE_SIZE = DEFAULTS.PAGE_SIZE;

/** with-mapping-info summary 초기 로드 쿼리 (P0: page+size 필수) */
export const ADMIN_DASHBOARD_CLIENTS_WITH_MAPPING_QUERY = Object.freeze({
  view: 'summary',
  page: ADMIN_DASHBOARD_LIST_PAGE,
  size: ADMIN_DASHBOARD_LIST_PAGE_SIZE
});

/**
 * mappings LIST — 대시보드 마운트 금지. 목록 화면(통합스케줄·매칭관리 등)만 page+size 강제.
 */
export const ADMIN_MAPPINGS_PAGED_LIST_QUERY = Object.freeze({
  page: ADMIN_DASHBOARD_LIST_PAGE,
  size: ADMIN_DASHBOARD_LIST_PAGE_SIZE
});

/** @deprecated 대시보드에서 사용 금지 — {@link ADMIN_MAPPINGS_PAGED_LIST_QUERY} */
export const ADMIN_DASHBOARD_MAPPINGS_LIST_QUERY = ADMIN_MAPPINGS_PAGED_LIST_QUERY;

/** Pending List 위젯당 최대 노출 행 수 (요약) */
export const DASHBOARD_PENDING_LIST_MAX_ROWS = 5;

/** Pending List 하단 단일 CTA 라벨 */
export const DASHBOARD_PENDING_LIST_VIEW_ALL_LABEL = '전체 보기';

/** 환불 StatCard 섹션 단일 CTA 라벨 (PR-DASH-01) */
export const DASHBOARD_REFUND_SECTION_CTA_LABEL = '환불 관리 가기';

/** Admin schedules 목록 API — 가예약 필터와 함께 사용 */
export const API_ADMIN_SCHEDULES = '/api/v1/admin/schedules';

/**
 * 가예약(soft unpaid) 스케줄 목록 쿼리 SSOT.
 * status 는 반드시 {@link STATUS.TENTATIVE_PENDING_PAYMENT} 만 사용.
 * bare PENDING / TENTATIVE / BOOKED 단독 필터 금지.
 */
export const ADMIN_SCHEDULES_TENTATIVE_PENDING_QUERY = Object.freeze({
  status: STATUS.TENTATIVE_PENDING_PAYMENT,
  page: ADMIN_DASHBOARD_LIST_PAGE,
  size: ADMIN_DASHBOARD_LIST_PAGE_SIZE
});

/** KPI Zone 4블록 ID */
export const DASHBOARD_KPI_IDS = {
  TODAY_BOOKINGS: 'today-bookings',
  PENDING_PAYMENT: 'pending-payment',
  NO_SHOW: 'no-show',
  ACTIVE_SESSIONS: 'active-sessions'
};

/** KPI/통계 구역 개별 새로고침 (layout blank 금지) */
export const DASHBOARD_KPI_ZONE_REFRESH_TEST_ID = 'admin-dashboard-kpi-zone-refresh';

/** 매칭 status — §D 회기 소진율 모집단 */
export const MAPPING_STATUS_ACTIVE = 'ACTIVE';

/**
 * §D 회기 소진율 랭킹 최대 행 수.
 * 상단「상담사 별 통합데이터」top N과 동일.
 */
export const SESSION_BURN_TOP_LIMIT = 10;
