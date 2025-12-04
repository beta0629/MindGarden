/**
 * MindGarden 위젯 상수 정의
 * 
 * CSS와 비즈니스 로직 분리를 위한 상수 관리
 * 모든 하드코딩된 값들을 여기서 중앙 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-11-28
 */

// 🎨 CSS 클래스 상수 (MindGarden 디자인 시스템 기반)
export const WIDGET_CONSTANTS = {
  // CSS 클래스명 (mg- 접두사 사용)
  CSS_CLASSES: {
    // 위젯 컨테이너
    WIDGET_CONTAINER: (type) => `mg-widget mg-widget--${type} mg-card mg-card--elevated`,
    WIDGET_HEADER: 'mg-widget__header mg-card__header',
    WIDGET_BODY: 'mg-widget__body mg-card__body',
    WIDGET_FOOTER: 'mg-widget__footer mg-card__footer',
    
    // 위젯 내용
    WIDGET_TITLE: 'mg-widget__title mg-h4 mg-mb-0',
    WIDGET_SUBTITLE: 'mg-widget__subtitle mg-text-muted mg-text-sm',
    WIDGET_CONTENT: 'mg-widget__content',
    
    // MindGarden 카드 시스템
    MG_CARD: 'mg-card',
    MG_CARD_HEADER: 'mg-card__header mg-flex mg-align-center mg-gap-sm',
    MG_CARD_BODY: 'mg-card__body',
    MG_CARD_FOOTER: 'mg-card__footer',
    MG_CARD_CONTENT: 'mg-card__content',
    
    // 통계 그리드
    MG_STATS_GRID: 'mg-stats-grid',
    MG_STATS_CARD: 'mg-stats-card',
    
    // 로딩 상태
    LOADING_CONTAINER: 'mg-loading-container mg-flex mg-flex-col mg-align-center mg-justify-center mg-py-xl',
    MG_LOADING_SPINNER: 'mg-loading-spinner',
    
    // 에러 상태  
    ERROR_CONTAINER: 'mg-error-container mg-p-md',
    MG_ALERT_ERROR: 'mg-alert mg-alert--error mg-flex mg-align-center mg-gap-sm',
    MG_ALERT_ICON: 'mg-alert__icon',
    MG_ALERT_MESSAGE: 'mg-alert__message',
    
    // 텍스트 스타일
    MG_TEXT_BODY: 'mg-text-body',
    MG_TEXT_MUTED: 'mg-text-muted',
    MG_TEXT_SM: 'mg-text-sm',
    MG_TEXT_LG: 'mg-text-lg',
    
    // 레이아웃
    MG_FLEX: 'mg-flex',
    MG_FLEX_COL: 'mg-flex-col',
    MG_ALIGN_CENTER: 'mg-align-center',
    MG_JUSTIFY_CENTER: 'mg-justify-center',
    MG_GAP_SM: 'mg-gap-sm',
    MG_GAP_MD: 'mg-gap-md',
    
    // 여백
    MG_P_MD: 'mg-p-md',
    MG_PY_XL: 'mg-py-xl',
    MG_MB_0: 'mg-mb-0',
    
    // 반응형
    MG_RESPONSIVE_GRID: 'mg-grid mg-grid--responsive',
    MG_RESPONSIVE_COLS_2: 'mg-grid--cols-2',
    MG_RESPONSIVE_COLS_3: 'mg-grid--cols-3',
    MG_RESPONSIVE_COLS_4: 'mg-grid--cols-4'
  },
  
  // 기본 제목들
  DEFAULT_TITLES: {
    SYSTEM_OVERVIEW: '시스템 개요',
    TODAY_STATS: '오늘의 통계', 
    QUICK_ACTIONS: '빠른 작업',
    PENDING_DEPOSITS: '입금 확인 대기',
    VACATION_STATS: '휴가 통계',
    RATING_STATS: '상담사 평가 통계',
    REFUND_STATS: '환불 현황',
    CONSULTATION_STATS: '상담 완료 통계',
    SYSTEM_STATUS: '시스템 상태',
    SYSTEM_TOOLS: '시스템 도구',
    PERMISSIONS: '권한 관리',
    NOTIFICATIONS: '시스템 알림'
  },
  
  // 로딩 메시지
  LOADING_MESSAGES: {
    DEFAULT: '데이터를 불러오는 중...',
    STATS: '통계 데이터 로딩 중...',
    API_CALL: 'API 호출 중...',
    PROCESSING: '처리 중...'
  },
  
  // 에러 메시지
  ERROR_MESSAGES: {
    LOAD_FAILED: '데이터를 불러올 수 없습니다',
    API_ERROR: 'API 호출에 실패했습니다',
    NETWORK_ERROR: '네트워크 오류가 발생했습니다',
    PERMISSION_DENIED: '권한이 없습니다',
    DATA_NOT_FOUND: '데이터를 찾을 수 없습니다'
  },
  
  // 버튼 라벨
  BUTTON_LABELS: {
    ACTION: '실행',
    REFRESH: '새로고침',
    VIEW_MORE: '더 보기',
    SETTINGS: '설정',
    CLOSE: '닫기',
    SAVE: '저장',
    CANCEL: '취소',
    CONFIRM: '확인'
  },
  
  // 위젯 크기 상수
  WIDGET_SIZES: {
    SMALL: { colspan: 1, rowspan: 1 },
    MEDIUM: { colspan: 2, rowspan: 1 },
    LARGE: { colspan: 3, rowspan: 1 },
    TALL: { colspan: 2, rowspan: 2 },
    FULL_WIDTH: { colspan: 4, rowspan: 1 }
  },
  
  // 대시보드 데이터 표시 제한 (표준화 원칙)
  DASHBOARD_LIMITS: {
    MAX_ITEMS: 10, // 대시보드에 표시할 최대 데이터 개수
    MAX_STAT_CARDS: 10, // 통계 카드 최대 개수
    DEFAULT_ITEMS: 5 // 기본 표시 개수
  },
  
  // 애니메이션 지속시간 (CSS 변수와 연동)
  ANIMATION_DURATION: {
    FAST: 'var(--mg-duration-fast)',
    NORMAL: 'var(--mg-duration-normal)', 
    SLOW: 'var(--mg-duration-slow)'
  },
  
  // 아이콘 매핑
  ICONS: {
    LOADING: '⏳',
    ERROR: '⚠️',
    SUCCESS: '✅',
    INFO: 'ℹ️',
    WARNING: '⚠️',
    REFRESH: '🔄',
    SETTINGS: '⚙️',
    STATS: '📊',
    USERS: '👥',
    CALENDAR: '📅',
    CHART: '📈'
  },
  
  // 유틸리티 함수들
  UTILS: {
    // CSS 클래스 조합 함수
    combineClasses: (...classes) => classes.filter(Boolean).join(' ')
  }
};

// 🔧 API 성능 위젯 상수 (기존 호환성)
export const API_PERFORMANCE_WIDGET = {
  DEFAULT_TITLE: 'API 성능 모니터링',
  DEFAULT_REFRESH_INTERVAL: 30000, // 30초
  
  VIEW_TYPES: {
    SUMMARY: 'summary',
    SLOW: 'slow',
    ERRORS: 'errors'
  },
  
  API_ENDPOINTS: {
    STATS: '/api/admin/performance/stats',
    SLOW_APIS: '/api/admin/performance/slow-apis',
    ERROR_PRONE_APIS: '/api/admin/performance/error-prone-apis'
  },
  
  THRESHOLDS: {
    SLOW_API_MS: 1000,
    ERROR_RATE_PERCENT: 5
  },
  
  METRIC_LABELS: {
    AVERAGE_RESPONSE_TIME: '평균 응답 시간',
    TOTAL_REQUESTS: '총 요청 수',
    OVERALL_ERROR_RATE: '전체 에러율',
    SLOWEST_REQUEST: '가장 느린 요청'
  },
  
  MESSAGES: {
    LOADING: '성능 데이터 로딩 중...',
    NO_SLOW_APIS: '느린 API가 없습니다',
    NO_ERROR_APIS: '에러가 많은 API가 없습니다'
  }
};

// 🎨 위젯별 특화 상수
export const WIDGET_SPECIFIC_CONSTANTS = {
  SYSTEM_OVERVIEW: {
    STAT_CARDS: {
      CONSULTANTS: {
        ICON: WIDGET_CONSTANTS.ICONS.USERS,
        LABEL: '상담사',
        COLOR: 'primary'
      },
      CLIENTS: {
        ICON: WIDGET_CONSTANTS.ICONS.USERS,
        LABEL: '내담자', 
        COLOR: 'success'
      },
      MAPPINGS: {
        ICON: '🔗',
        LABEL: '매칭',
        COLOR: 'info'
      },
      ACTIVE_MAPPINGS: {
        ICON: '✅',
        LABEL: '활성 매칭',
        COLOR: 'warning'
      }
    }
  },
  
  TODAY_STATS: {
    STAT_CARDS: {
      TOTAL_TODAY: {
        ICON: WIDGET_CONSTANTS.ICONS.CALENDAR,
        LABEL: '예약된 상담',
        COLOR: 'primary'
      },
      COMPLETED_TODAY: {
        ICON: WIDGET_CONSTANTS.ICONS.SUCCESS,
        LABEL: '완료된 상담',
        COLOR: 'success'
      },
      PENDING_TODAY: {
        ICON: '⏰',
        LABEL: '대기 중인 상담',
        COLOR: 'warning'
      }
    }
  },
  
  QUICK_ACTIONS: {
    ACTIONS: {
      MANAGE_CONSULTANTS: {
        ICON: '👨‍⚕️',
        LABEL: '상담사 관리',
        URL: '/admin/consultant-comprehensive'
      },
      MANAGE_CLIENTS: {
        ICON: '👥',
        LABEL: '내담자 관리', 
        URL: '/admin/client-comprehensive'
      },
      VIEW_MAPPINGS: {
        ICON: '🔗',
        LABEL: '매칭 관리',
        URL: '/admin/mapping-management'
      },
      VIEW_SCHEDULES: {
        ICON: WIDGET_CONSTANTS.ICONS.CALENDAR,
        LABEL: '스케줄 관리',
        URL: '/admin/schedule'
      },
      SYSTEM_SETTINGS: {
        ICON: WIDGET_CONSTANTS.ICONS.SETTINGS,
        LABEL: '시스템 설정',
        URL: '/admin/system-config'
      },
      REPORTS: {
        ICON: WIDGET_CONSTANTS.ICONS.CHART,
        LABEL: '통계 보고서',
        URL: '/admin/statistics'
      }
    }
  }
};

// 🎯 위젯 유틸리티 함수
export const WIDGET_UTILS = {
  // CSS 클래스 조합 함수
  combineClasses: (...classes) => classes.filter(Boolean).join(' '),
  
  // 위젯 타입별 기본 설정 반환
  getDefaultConfig: (widgetType) => {
    const configs = {
      'system-overview': {
        title: WIDGET_CONSTANTS.DEFAULT_TITLES.SYSTEM_OVERVIEW,
        subtitle: '전체 시스템 현황 요약',
        size: WIDGET_CONSTANTS.WIDGET_SIZES.LARGE
      },
      'today-stats': {
        title: WIDGET_CONSTANTS.DEFAULT_TITLES.TODAY_STATS,
        subtitle: '오늘의 상담 현황 요약',
        size: WIDGET_CONSTANTS.WIDGET_SIZES.LARGE
      },
      'quick-actions': {
        title: WIDGET_CONSTANTS.DEFAULT_TITLES.QUICK_ACTIONS,
        subtitle: '자주 사용하는 관리 기능',
        size: WIDGET_CONSTANTS.WIDGET_SIZES.FULL_WIDTH
      }
    };
    
    return configs[widgetType] || {};
  },
  
  // 에러 메시지 포맷팅
  formatErrorMessage: (error, context = '') => {
    const baseMessage = WIDGET_CONSTANTS.ERROR_MESSAGES.LOAD_FAILED;
    return context ? `${baseMessage} (${context}): ${error}` : `${baseMessage}: ${error}`;
  }
};

export default WIDGET_CONSTANTS;