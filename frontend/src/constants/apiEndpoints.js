/**
 * API 엔드포인트 표준화
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-28
 */

export const API_ENDPOINTS = {
  DASHBOARD: {
    GET_USER_DASHBOARD: '/api/v1/tenant/dashboards',
    GET_DASHBOARD_BY_ID: (id) => `/api/v1/tenant/dashboards/${id}`,
    
    BRANDING: '/api/v1/admin/branding',
    
    WIDGET_DATA: {
      CONSULTATIONS_OVERALL: '/api/v1/consultations/statistics/overall',
      CONSULTATIONS_TRENDS: '/api/v1/consultations/statistics/trends',
      CONSULTATIONS_SUMMARY: '/api/v1/consultations/summary',
      SYSTEM_NOTIFICATIONS: '/api/v1/system-notifications/active',
      SYSTEM_STATUS: '/api/v1/system/status',
      SYSTEM_PERFORMANCE: '/api/v1/system/performance'
    }
  },

  ADMIN: {
    CONSULTANTS: {
      WITH_STATS: '/api/v1/admin/consultants/with-stats',
      WITH_VACATION: '/api/v1/admin/consultants/with-vacation',
      RATING_STATS: '/api/v1/admin/consultant-rating-stats'
    },
    
    CLIENTS: {
      WITH_STATS: '/api/v1/admin/clients/with-stats',
      WITH_MAPPING_INFO: '/api/v1/admin/clients/with-mapping-info'
    },
    
    MAPPINGS: {
      LIST: '/api/v1/admin/mappings',
      STATS: '/api/v1/admin/mappings/stats',
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      ACTIVE: '/api/v1/admin/mappings/active',
      PENDING_PAYMENT: '/api/v1/admin/mappings/pending-payment',
      PAYMENT_CONFIRMED: '/api/v1/admin/mappings/payment-confirmed',
      PENDING_DEPOSIT: '/api/v1/admin/mappings/pending-deposit',
      SESSIONS_EXHAUSTED: '/api/v1/admin/mappings/sessions-exhausted'
    },
    
    STATISTICS: {
      OVERALL: '/api/v1/admin/statistics/overall',
      TRENDS: '/api/v1/admin/statistics/trends',
      CHART_DATA: '/api/v1/admin/statistics/chart-data',
      RECENT_ACTIVITY: '/api/v1/admin/statistics/recent-activity',
      CONSULTATION_COMPLETION: '/api/v1/admin/statistics/consultation-completion',
      VACATION: '/api/v1/admin/vacation-statistics',
      REFUND: '/api/v1/admin/refund-statistics'
    },
    
    WIDGETS: {
      TODAY_STATS: '/api/v1/admin/today-stats',
      PENDING_DEPOSIT_STATS: '/api/v1/admin/pending-deposit-stats',
      SYSTEM_STATUS: '/api/v1/admin/system-status'
    }
  },
  
  SYSTEM: {
    NOTIFICATIONS: {
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      ACTIVE: '/api/v1/system-notifications/active',
      LIST: '/api/v1/system-notifications'
    },
    
    MONITORING: {
      STATUS: '/api/v1/system/status',
      PERFORMANCE: '/api/v1/system/performance'
    }
  },
  
  AUTH: {
    CURRENT_USER: '/api/v1/auth/current-user',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout'
  },

  /** 내담자 맥락 프로필 SSOT (상담일지 모달 등) */
  CLIENT_CONTEXT: {
    CONTEXT_PROFILE: (clientId) => `/api/v1/clients/${clientId}/context-profile`
  },
  
  COMMON_CODE: {
    LIST: '/api/v1/common-codes',
    BY_GROUP: '/api/v1/common-codes/group'
  }
};

export const buildApiUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
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

export const buildDateParams = (date = new Date()) => {
  return {
    date: date.toISOString().split('T')[0]
  };
};

export const buildPeriodParams = (period = 'month') => {
  return {
    period
  };
};

export const COMMON_API_URLS = {
  CONSULTANTS_WITH_VACATION_TODAY: () => 
    buildApiUrl(API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_VACATION, buildDateParams()),
    
  VACATION_STATS_MONTHLY: () => 
    buildApiUrl(API_ENDPOINTS.ADMIN.STATISTICS.VACATION, buildPeriodParams('month')),
    
  ACTIVE_NOTIFICATIONS: () => 
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    API_ENDPOINTS.SYSTEM.NOTIFICATIONS.ACTIVE
};

export const ENDPOINT_MAPPING = {
  '/api/v1/admin/consultants/with-vacation': API_ENDPOINTS.ADMIN.CONSULTANTS.WITH_VACATION,
  '/api/v1/admin/clients/with-mapping-info': API_ENDPOINTS.ADMIN.CLIENTS.WITH_MAPPING_INFO,
  '/api/v1/admin/mappings': API_ENDPOINTS.ADMIN.MAPPINGS.LIST,
  '/api/v1/admin/consultant-rating-stats': API_ENDPOINTS.ADMIN.CONSULTANTS.RATING_STATS,
  '/api/v1/admin/vacation-statistics': API_ENDPOINTS.ADMIN.STATISTICS.VACATION,
  '/api/v1/admin/statistics/consultation-completion': API_ENDPOINTS.ADMIN.STATISTICS.CONSULTATION_COMPLETION
};

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

export const logEndpointUsage = (endpoint) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔗 API 호출: ${endpoint}`);
  }
};

export default API_ENDPOINTS;
