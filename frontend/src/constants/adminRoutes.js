/**
 * 관리자 라우트 경로 상수
 * 
 * 표준화된 관리자 페이지 경로를 중앙에서 관리
 * 모든 관리자 관련 컴포넌트에서 이 상수를 사용해야 함
 * 
 * @author Core Solution
 * @version 1.0.0
 * @since 2025-01-20
 */

export const ADMIN_ROUTES = {
    /** 어드민 메인 대시보드 (B0KlA) */
    DASHBOARD: '/admin/dashboard',
    SCHEDULES: '/admin/schedules',
    SESSIONS: '/admin/sessions',
    USERS: '/admin/user-management',
    USER_MANAGEMENT: '/admin/user-management',
    CONSULTANTS: '/admin/consultants',
    /** @deprecated redirect to /admin/user-management?type=consultant */
    CONSULTANT_COMPREHENSIVE: '/admin/consultant-comprehensive',
    CLIENTS: '/admin/clients',
    /** @deprecated redirect to /admin/user-management?type=client */
    CLIENT_COMPREHENSIVE: '/admin/client-comprehensive',
    MAPPINGS: '/admin/mappings',
    MAPPING_MANAGEMENT: '/admin/mapping-management',
    INTEGRATED_SCHEDULE: '/admin/integrated-schedule',
    /** 상담일지 조회 */
    CONSULTATION_LOGS: '/admin/consultation-logs',
    COMMON_CODES: '/admin/common-codes',
    /** 패키지 요금(가격) 관리 */
    PACKAGE_PRICING: '/admin/package-pricing',
    /** 통합 알림·메시지 관리 (단일 페이지) */
    NOTIFICATIONS: '/admin/notifications',
    /** @deprecated redirect to NOTIFICATIONS */
    SYSTEM_NOTIFICATIONS: '/admin/system-notifications',
    SYSTEM_CONFIG: '/admin/system-config',
    /** PG 설정 승인(운영) — 백엔드 `OpsPermissionUtils.requireAdminOrOps()` 정합; STAFF 제외 */
    PG_OPS_APPROVAL: '/admin/ops/pg-approval',
    /** @deprecated redirect to NOTIFICATIONS */
    MESSAGES: '/admin/messages',
    STATISTICS: '/admin/statistics',
    COMPLIANCE: '/admin/compliance',
    COMPLIANCE_DASHBOARD: '/admin/compliance/dashboard',
    COMPLIANCE_DESTRUCTION: '/admin/compliance/destruction',
    ERP_FINANCIAL: '/admin/erp/financial',
    DASHBOARDS: '/admin/dashboards',
    CACHE_MONITORING: '/admin/cache-monitoring',
    SECURITY_MONITORING: '/admin/security-monitoring',
    API_PERFORMANCE: '/admin/api-performance',
    PSYCH_ASSESSMENTS: '/admin/psych-assessments'
};

