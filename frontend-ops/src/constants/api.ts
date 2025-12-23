/**
 * API 엔드포인트 상수
 * 하드코딩 금지 원칙에 따라 모든 API 경로를 여기에 정의
 * 
 * @author CoreSolution
 * @version 1.0.0
 */

/**
 * Ops Portal API 경로 상수
 * 백엔드 API는 /api/v1/ops/auth/login 형식이므로 /api/v1 접두사는 API_BASE_URL에 포함됨
 */
export const OPS_API_PATHS = {
  // 인증
  AUTH: {
    LOGIN: "/ops/auth/login",  // API_BASE_URL과 결합하면 /api/v1/ops/auth/login
    LOGOUT: "/ops/auth/logout"  // API_BASE_URL과 결합하면 /api/v1/ops/auth/logout
  },
  
  // 온보딩
  ONBOARDING: {
    PENDING: "/ops/onboarding/requests/pending",
    ALL: "/ops/onboarding/requests",
    DETAIL: (id: string) => `/ops/onboarding/requests/${id}`,
    DECISION: (id: string) => `/ops/onboarding/requests/${id}/decision`,
    RETRY: (id: string) => `/ops/onboarding/requests/${id}/retry`,
    PROCESSING_STATUS: (id: string) => `/ops/onboarding/requests/${id}/processing-status`
  },
  
  // 요금제
  PRICING: {
    PLANS: "/ops/plans",
    PLAN_DETAIL: (id: string) => `/ops/plans/${id}`,
    PLAN_DEACTIVATE: (id: string) => `/ops/plans/${id}`,
    ADDONS: "/ops/plans/addons",
    ADDON_DETAIL: (id: string) => `/ops/plans/addons/${id}`,
    ADDON_DEACTIVATE: (id: string) => `/ops/plans/addons/${id}`,
    ATTACH_ADDON: (planId: string) => `/ops/plans/${planId}/addons`
  },
  
  // Feature Flag
  FEATURE_FLAGS: {
    ALL: "/ops/feature-flags",
    CREATE: "/ops/feature-flags",
    TOGGLE: (id: string) => `/ops/feature-flags/${id}/toggle`
  },
  
  // 대시보드
  DASHBOARD: {
    METRICS: "/ops/dashboard/metrics"
  },
  
  // 테넌트
  TENANTS: {
    ALL: "/ops/tenants",
    ADMINS: (tenantId: string) => `/ops/tenants/${tenantId}/admins`
  }
} as const;

/**
 * API Base URL 상수
 * @deprecated 환경 변수 NEXT_PUBLIC_OPS_API_BASE_URL 사용 권장
 * 하드코딩 금지 원칙에 따라 환경 변수만 사용
 */
export const API_BASE_URL = {
  LOCAL: "http://localhost:8081/api/v1", // @deprecated - 환경 변수 사용
  PRODUCTION: "" // @deprecated - 환경 변수 사용
} as const;

