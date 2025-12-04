/**
 * API 엔드포인트 표준화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-28
 */

// 🎯 표준화된 API 엔드포인트 정의
export const API_ENDPOINTS = {
  // === 다이나믹 대시보드 API ===
  DASHBOARD: {
    // 대시보드 조회
    GET_USER_DASHBOARD: '/api/v1/tenant/dashboards',
    GET_DASHBOARD_BY_ID: (id) => `/api/v1/tenant/dashboards/${id}`,
    
    // 브랜딩 정보
    BRANDING: '/api/v1/admin/branding',
    
    // 위젯 데이터 소스
    WIDGET_DATA: {
      CONSULTATIONS_OVERALL: '/api/v1/consultations/statistics/overall',
      CONSULTATIONS_TRENDS: '/api/v1/consultations/statistics/trends',
      CONSULTATIONS_SUMMARY: '/api/v1/consultations/summary',
      SYSTEM_NOTIFICATIONS: '/api/system-notifications/active',
      SYSTEM_STATUS: '/api/system/status',
      SYSTEM_PERFORMANCE: '/api/system/performance'
    }
  },

  // === 관리자 통계 API (표준 경로: /api/v1/admin) ===
  ADMIN: {
    // 상담사 관련
    CONSULTANTS: {
      WITH_STATS: '/api/v1/admin/consultants/with-stats',
      WITH_VACATION: '/api/v1/admin/consultants/with-vacation',
      RATING_STATS: '/api/v1/admin/consultant-rating-stats'
    },
    
    // 내담자 관련
    CLIENTS: {
      WITH_STATS: '/api/v1/admin/clients/with-stats',
      WITH_MAPPING_INFO: '/api/v1/admin/clients/with-mapping-info'
    },
    
    // 매칭 관련
    MAPPINGS: {
      LIST: '/api/v1/admin/mappings',
      STATS: '/api/v1/admin/mappings/stats',
      ACTIVE: '/api/v1/admin/mappings/active',
      PENDING_PAYMENT: '/api/v1/admin/mappings/pending-payment',
      PAYMENT_CONFIRMED: '/api/v1/admin/mappings/payment-confirmed',
      PENDING_DEPOSIT: '/api/v1/admin/mappings/pending-deposit',
      SESSIONS_EXHAUSTED: '/api/v1/admin/mappings/sessions-exhausted'
    },
    
    // 통계 관련
    STATISTICS: {
      OVERALL: '/api/v1/admin/statistics/overall',
      TRENDS: '/api/v1/admin/statistics/trends',
      CHART_DATA: '/api/v1/admin/statistics/chart-data',
      RECENT_ACTIVITY: '/api/v1/admin/statistics/recent-activity',
      CONSULTATION_COMPLETION: '/api/v1/admin/statistics/consultation-completion',
      VACATION: '/api/v1/admin/vacation-statistics',
      REFUND: '/api/v1/admin/refund-statistics'
    },
    
    // 위젯 전용 API (새로 추가)
    WIDGETS: {
      TODAY_STATS: '/api/v1/admin/today-stats',
      PENDING_DEPOSIT_STATS: '/api/v1/admin/pending-deposit-stats',
      SYSTEM_STATUS: '/api/v1/admin/system-status'
    }
  },
  
  // === 시스템 관련 API ===
  SYSTEM: {
    NOTIFICATIONS: {
      ACTIVE: '/api/system-notifications/active',
      LIST: '/api/system-notifications'
    },
    
    MONITORING: {
      STATUS: '/api/system/status',
      PERFORMANCE: '/api/system/performance'
    }
  },
  
  // === 인증 관련 API (표준 경로: /api/v1/auth) ===
  AUTH: {
    CURRENT_USER: '/api/v1/auth/current-user',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout'
  },
  
  // === 공통 코드 API (표준 경로: /api/v1/common-codes) ===
  COMMON_CODE: {
    LIST: '/api/v1/common-codes',
    BY_GROUP: '/api/v1/common-codes/group'
  }
};

// 🔧 API 엔드포인트 헬퍼 함수들
export const buildApiUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
  // 쿼리 파라미터 추가
  if (Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    });
    
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }
  
  return url;
};

// 날짜 관련 헬퍼
export const buildDateParams = (date = new Date()) => {
  return {
    date: date.toISOString().split('T')[0]
  };
};

// 기간 관련 헬퍼
export const buildPeriodParams = (period = 'month') => {
  return {
    period
  };
};

// 🎯 자주 사용되는 API URL 조합
export const COMMON_API_URLS = {
  // 오늘 날짜 기준 상담사 휴가 정보
  CONSULTANTS_WITH_VACATION_TODAY: () => 
    buildApiUrl(API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_VACATION, buildDateParams()),
    
  // 월간 휴가 통계
  VACATION_STATS_MONTHLY: () => 
    buildApiUrl(API_ENDPOINTS.ADMIN.STATISTICS.VACATION, buildPeriodParams('month')),
    
  // 활성 시스템 알림
  ACTIVE_NOTIFICATIONS: () => 
    API_ENDPOINTS.SYSTEM.NOTIFICATIONS.ACTIVE
};

// 🔍 디버깅용 엔드포인트 매핑
export const ENDPOINT_MAPPING = {
  // 기존 → 표준화
  '/api/admin/consultants/with-vacation': API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_VACATION,
  '/api/admin/clients/with-mapping-info': API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
  '/api/admin/mappings': API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
  '/api/admin/consultant-rating-stats': API_ENDPOINTS.ADMIN.CONSULTANTS.RATING_STATS,
  '/api/admin/vacation-statistics': API_ENDPOINTS.ADMIN.STATISTICS.VACATION,
  '/api/admin/statistics/consultation-completion': API_ENDPOINTS.ADMIN.STATISTICS.CONSULTATION_COMPLETION
};

// 📊 엔드포인트 검증 함수
export const validateEndpoint = (endpoint) => {
  const allEndpoints = Object.values(API_ENDPOINTS)
    .flatMap(category => 
      typeof category === 'object' 
        ? Object.values(category).flatMap(subCategory =>
            typeof subCategory === 'object' 
              ? Object.values(subCategory)
              : [subCategory]
          )
        : [category]
    );
    
  return allEndpoints.includes(endpoint);
};

// 🎯 엔드포인트 사용 통계 (개발용)
export const logEndpointUsage = (endpoint) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 API 호출: ${endpoint}`);
  }
};

export default API_ENDPOINTS;
