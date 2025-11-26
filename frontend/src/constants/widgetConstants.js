/**
 * 위젯 관련 상수 관리
 * 위젯 컴포넌트에서 사용되는 모든 상수를 중앙 집중식으로 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */

// ===== 위젯 공통 상수 =====
export const WIDGET_CONSTANTS = {
  // 새로고침 간격 옵션 (밀리초)
  REFRESH_INTERVALS: {
    FAST: 1000,      // 1초
    DEFAULT: 5000,   // 5초
    NORMAL: 10000,   // 10초
    SLOW: 30000,     // 30초
    VERY_SLOW: 60000 // 1분
  },
  
  // 위젯 크기
  SIZES: {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    FULL: 'full'
  },
  
  // 위젯 상태
  STATES: {
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    EMPTY: 'empty'
  },
  
  // 애니메이션 지속시간
  ANIMATION_DURATION: {
    FAST: 150,
    DEFAULT: 300,
    SLOW: 500
  }
};

// ===== 성능 위젯 상수 =====
export const PERFORMANCE_WIDGET = {
  // 기본 설정
  DEFAULT_TITLE: '시스템 성능',
  DEFAULT_REFRESH_INTERVAL: WIDGET_CONSTANTS.REFRESH_INTERVALS.SLOW,
  
  // 메트릭 타입
  METRIC_TYPES: {
    API_RESPONSE_TIME: 'apiResponseTime',
    CACHE_HIT_RATE: 'cacheHitRate',
    ACTIVE_USERS: 'activeUsers',
    SYSTEM_LOAD: 'systemLoad'
  },
  
  // 성능 임계값
  THRESHOLDS: {
    RESPONSE_TIME: {
      EXCELLENT: 100,  // 100ms 이하
      GOOD: 200,       // 200ms 이하
      POOR: 500        // 500ms 이상
    },
    CACHE_HIT_RATE: {
      EXCELLENT: 80,   // 80% 이상
      GOOD: 60,        // 60% 이상
      POOR: 40         // 40% 미만
    },
    SYSTEM_LOAD: {
      EXCELLENT: 50,   // 50% 이하
      GOOD: 70,        // 70% 이하
      POOR: 90         // 90% 이상
    }
  },
  
  // 트렌드 타입
  TREND_TYPES: {
    UP: 'up',
    DOWN: 'down',
    STABLE: 'stable'
  },
  
  // 메트릭 라벨
  METRIC_LABELS: {
    API_RESPONSE_TIME: 'API 응답시간',
    CACHE_HIT_RATE: '캐시 히트율',
    ACTIVE_USERS: '활성 사용자',
    SYSTEM_LOAD: '시스템 부하'
  },
  
  // 메트릭 단위
  METRIC_UNITS: {
    API_RESPONSE_TIME: 'ms',
    CACHE_HIT_RATE: '%',
    ACTIVE_USERS: '명',
    SYSTEM_LOAD: '%'
  },
  
  // 모의 데이터 범위
  MOCK_DATA_RANGES: {
    API_RESPONSE_TIME: { MIN: 50, MAX: 250 },
    ACTIVE_USERS: { MIN: 20, MAX: 120 },
    SYSTEM_LOAD: { MIN: 10, MAX: 90 }
  }
};

// ===== 캐시 모니터링 위젯 상수 =====
export const CACHE_MONITORING_WIDGET = {
  DEFAULT_TITLE: '캐시 모니터링',
  DEFAULT_REFRESH_INTERVAL: WIDGET_CONSTANTS.REFRESH_INTERVALS.DEFAULT,
  
  // API 엔드포인트
  API_ENDPOINTS: {
    STATS: '/api/admin/cache/stats',
    CLEAR_ALL: '/api/admin/cache/all'
  },
  
  // 캐시 효율성 임계값
  EFFICIENCY_THRESHOLDS: {
    EXCELLENT: 80,
    GOOD: 60,
    POOR: 40
  },
  
  // 상태 메시지
  MESSAGES: {
    NO_DATA: '캐시 데이터가 없습니다.',
    LOADING: '업데이트 중...',
    ERROR: '캐시 통계 조회에 실패했습니다.',
    CLEAR_CONFIRM: '모든 캐시를 삭제하시겠습니까?',
    CLEAR_SUCCESS: '모든 캐시가 삭제되었습니다.',
    CLEAR_ERROR: '캐시 삭제에 실패했습니다.'
  }
};

// ===== 대시보드 위젯 상수 =====
export const DASHBOARD_WIDGET = {
  // 그리드 레이아웃
  GRID: {
    COLUMNS: {
      MOBILE: 1,
      TABLET: 2,
      DESKTOP: 3,
      WIDE: 4
    },
    GAP: '24px',
    MIN_COLUMN_WIDTH: '300px'
  },
  
  // 위젯 높이
  HEIGHTS: {
    COMPACT: '200px',
    DEFAULT: '300px',
    TALL: '400px',
    AUTO: 'auto'
  },
  
  // 반응형 브레이크포인트
  BREAKPOINTS: {
    MOBILE: '768px',
    TABLET: '992px',
    DESKTOP: '1200px'
  }
};

// ===== 알림 위젯 상수 =====
export const NOTIFICATION_WIDGET = {
  // 알림 타입
  TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  },
  
  // 우선순위
  PRIORITIES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  
  // 자동 숨김 시간 (밀리초)
  AUTO_HIDE_DURATION: {
    SHORT: 3000,
    DEFAULT: 5000,
    LONG: 8000,
    NEVER: 0
  }
};

// ===== 차트 위젯 상수 =====
export const CHART_WIDGET = {
  // 차트 타입
  TYPES: {
    LINE: 'line',
    BAR: 'bar',
    PIE: 'pie',
    DOUGHNUT: 'doughnut',
    AREA: 'area'
  },
  
  // 기본 색상 팔레트
  COLOR_PALETTE: [
    '#2196F3', '#4CAF50', '#FF9800', '#F44336',
    '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'
  ],
  
  // 애니메이션 설정
  ANIMATION: {
    DURATION: 750,
    EASING: 'easeInOutQuart'
  },
  
  // 데이터 포인트 제한
  MAX_DATA_POINTS: 50
};

// ===== 통계 위젯 상수 =====
export const STATS_WIDGET = {
  // 통계 타입
  TYPES: {
    COUNT: 'count',
    PERCENTAGE: 'percentage',
    CURRENCY: 'currency',
    TIME: 'time',
    BYTES: 'bytes'
  },
  
  // 변화 표시 타입
  CHANGE_TYPES: {
    INCREASE: 'increase',
    DECREASE: 'decrease',
    NEUTRAL: 'neutral'
  },
  
  // 포맷팅 옵션
  FORMATTING: {
    DECIMAL_PLACES: {
      COUNT: 0,
      PERCENTAGE: 1,
      CURRENCY: 2,
      TIME: 0,
      BYTES: 1
    }
  }
};

// ===== 테이블 위젯 상수 =====
export const TABLE_WIDGET = {
  // 페이지네이션
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
    MAX_VISIBLE_PAGES: 5
  },
  
  // 정렬
  SORT_DIRECTIONS: {
    ASC: 'asc',
    DESC: 'desc'
  },
  
  // 필터
  FILTER_TYPES: {
    TEXT: 'text',
    SELECT: 'select',
    DATE: 'date',
    NUMBER: 'number',
    BOOLEAN: 'boolean'
  }
};

// ===== 위젯 아이콘 매핑 =====
export const WIDGET_ICONS = {
  PERFORMANCE: 'FaChartLine',
  CACHE: 'FaDatabase',
  USERS: 'FaUsers',
  NOTIFICATIONS: 'FaBell',
  SETTINGS: 'FaCog',
  CHART: 'FaChartBar',
  TABLE: 'FaTable',
  CALENDAR: 'FaCalendar',
  DASHBOARD: 'FaTachometerAlt'
};

// ===== 위젯 테마 =====
export const WIDGET_THEMES = {
  DEFAULT: 'default',
  DARK: 'dark',
  LIGHT: 'light',
  COLORFUL: 'colorful',
  MINIMAL: 'minimal'
};

// WIDGET_CONSTANTS에 모든 위젯 상수 통합
WIDGET_CONSTANTS.PERFORMANCE_WIDGET = PERFORMANCE_WIDGET;
WIDGET_CONSTANTS.CACHE_MONITORING_WIDGET = CACHE_MONITORING_WIDGET;
WIDGET_CONSTANTS.DASHBOARD_WIDGET = DASHBOARD_WIDGET;
WIDGET_CONSTANTS.NOTIFICATION_WIDGET = NOTIFICATION_WIDGET;
WIDGET_CONSTANTS.CHART_WIDGET = CHART_WIDGET;
WIDGET_CONSTANTS.STATS_WIDGET = STATS_WIDGET;
WIDGET_CONSTANTS.TABLE_WIDGET = TABLE_WIDGET;
WIDGET_CONSTANTS.WIDGET_ICONS = WIDGET_ICONS;
WIDGET_CONSTANTS.WIDGET_THEMES = WIDGET_THEMES;

export default {
  WIDGET_CONSTANTS,
  PERFORMANCE_WIDGET,
  CACHE_MONITORING_WIDGET,
  DASHBOARD_WIDGET,
  NOTIFICATION_WIDGET,
  CHART_WIDGET,
  STATS_WIDGET,
  TABLE_WIDGET,
  WIDGET_ICONS,
  WIDGET_THEMES
};
