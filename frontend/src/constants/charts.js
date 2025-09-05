/**
 * 차트 및 그래프 관련 상수
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

// ==================== 차트 타입 ====================
export const CHART_TYPES = {
  BAR: 'bar',
  LINE: 'line',
  PIE: 'pie',
  DOUGHNUT: 'doughnut',
  AREA: 'area',
  SCATTER: 'scatter',
  RADAR: 'radar',
  POLAR_AREA: 'polarArea'
};

// ==================== 차트 색상 팔레트 ====================
export const CHART_COLORS = {
  PRIMARY: '#007bff',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  DANGER: '#dc3545',
  INFO: '#17a2b8',
  SECONDARY: '#6c757d',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  WHITE: '#ffffff',
  BLACK: '#000000'
};

// ==================== 차트 색상 그라데이션 ====================
export const CHART_GRADIENTS = {
  PRIMARY: ['#007bff', '#0056b3'],
  SUCCESS: ['#28a745', '#1e7e34'],
  WARNING: ['#ffc107', '#e0a800'],
  DANGER: ['#dc3545', '#c82333'],
  INFO: ['#17a2b8', '#138496'],
  SECONDARY: ['#6c757d', '#545b62']
};

// ==================== 차트 높이 ====================
export const CHART_HEIGHTS = {
  SMALL: '200px',
  MEDIUM: '300px',
  LARGE: '400px',
  XL: '500px'
};

// ==================== 차트 옵션 ====================
export const CHART_OPTIONS = {
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: false,
  PLUGINS: {
    LEGEND: {
      POSITION: 'top',
      LABELS: {
        USE_POINT_STYLE: true,
        PADDING: 20,
        FONT: {
          SIZE: 12,
          WEIGHT: '500'
        }
      }
    },
    TOOLTIP: {
      ENABLED: true,
      MODE: 'index',
      INTERSECT: false,
      BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
      TITLE_COLOR: '#ffffff',
      BODY_COLOR: '#ffffff',
      BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
      BORDER_WIDTH: 1
    }
  },
  SCALES: {
    X: {
      GRID: {
        DISPLAY: true,
        COLOR: 'rgba(0, 0, 0, 0.1)'
      },
      TICKS: {
        COLOR: '#6c757d',
        FONT: {
          SIZE: 11
        }
      }
    },
    Y: {
      GRID: {
        DISPLAY: true,
        COLOR: 'rgba(0, 0, 0, 0.1)'
      },
      TICKS: {
        COLOR: '#6c757d',
        FONT: {
          SIZE: 11
        }
      }
    }
  }
};

// ==================== 원형/도넛 차트 옵션 ====================
export const PIE_CHART_OPTIONS = {
  RESPONSIVE: true,
  MAINTAIN_ASPECT_RATIO: true,
  PLUGINS: {
    LEGEND: {
      POSITION: 'right',
      ALIGN: 'center',
      LABELS: {
        USE_POINT_STYLE: true,
        PADDING: 20,
        FONT: {
          SIZE: 12,
          WEIGHT: '500'
        },
        BOX_WIDTH: 12,
        BOX_HEIGHT: 12
      }
    },
    TOOLTIP: {
      ENABLED: true,
      BACKGROUND_COLOR: 'rgba(0, 0, 0, 0.8)',
      TITLE_COLOR: '#ffffff',
      BODY_COLOR: '#ffffff',
      BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
      BORDER_WIDTH: 1,
      CALLBACKS: {
        LABEL: function(context) {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  },
  LAYOUT: {
    PADDING: {
      TOP: 20,
      BOTTOM: 20,
      LEFT: 20,
      RIGHT: 20
    }
  },
  ELEMENTS: {
    ARC: {
      BORDER_WIDTH: 2,
      BORDER_COLOR: '#ffffff'
    }
  }
};

// ==================== 차트 데이터 타입 ====================
export const CHART_DATA_TYPES = {
  SCHEDULE_STATUS: 'schedule_status',
  MONTHLY_TREND: 'monthly_trend',
  CONSULTANT_PERFORMANCE: 'consultant_performance',
  CLIENT_DISTRIBUTION: 'client_distribution',
  TIME_ANALYSIS: 'time_analysis',
  REVENUE_ANALYSIS: 'revenue_analysis'
};

// ==================== 차트 라벨 ====================
export const CHART_LABELS = {
  SCHEDULE_STATUS: {
    BOOKED: '예약됨',
    CONFIRMED: '확정됨',
    COMPLETED: '완료됨',
    CANCELLED: '취소됨',
    IN_PROGRESS: '진행중'
  },
  MONTHS: [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ],
  DAYS: [
    '일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'
  ],
  HOURS: Array.from({ length: 24 }, (_, i) => `${i}시`)
};

// ==================== 필터 옵션 ====================
export const FILTER_OPTIONS = {
  DATE_RANGE: {
    TODAY: 'today',
    THIS_WEEK: 'this_week',
    THIS_MONTH: 'this_month',
    THIS_YEAR: 'this_year',
    CUSTOM: 'custom'
  },
  CHART_TYPE: {
    BAR: 'bar',
    LINE: 'line',
    PIE: 'pie',
    DOUGHNUT: 'doughnut'
  },
  TIME_PERIOD: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
  }
};

// ==================== 필터 라벨 ====================
export const FILTER_LABELS = {
  DATE_RANGE: {
    [FILTER_OPTIONS.DATE_RANGE.TODAY]: '오늘',
    [FILTER_OPTIONS.DATE_RANGE.THIS_WEEK]: '이번 주',
    [FILTER_OPTIONS.DATE_RANGE.THIS_MONTH]: '이번 달',
    [FILTER_OPTIONS.DATE_RANGE.THIS_YEAR]: '올해',
    [FILTER_OPTIONS.DATE_RANGE.CUSTOM]: '사용자 정의'
  },
  CHART_TYPE: {
    [FILTER_OPTIONS.CHART_TYPE.BAR]: '막대 차트',
    [FILTER_OPTIONS.CHART_TYPE.LINE]: '선 차트',
    [FILTER_OPTIONS.CHART_TYPE.PIE]: '원형 차트',
    [FILTER_OPTIONS.CHART_TYPE.DOUGHNUT]: '도넛 차트'
  },
  TIME_PERIOD: {
    [FILTER_OPTIONS.TIME_PERIOD.DAILY]: '일별',
    [FILTER_OPTIONS.TIME_PERIOD.WEEKLY]: '주별',
    [FILTER_OPTIONS.TIME_PERIOD.MONTHLY]: '월별',
    [FILTER_OPTIONS.TIME_PERIOD.YEARLY]: '년별'
  }
};

// ==================== 테이블 컬럼 ====================
export const TABLE_COLUMNS = {
  SCHEDULE: [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'date', label: '날짜', width: '120px' },
    { key: 'time', label: '시간', width: '100px' },
    { key: 'title', label: '제목', width: '200px' },
    { key: 'consultant', label: '상담사', width: '120px' },
    { key: 'client', label: '내담자', width: '120px' },
    { key: 'status', label: '상태', width: '100px' },
    { key: 'duration', label: '소요시간', width: '100px' }
  ],
  CONSULTANT: [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: '이름', width: '120px' },
    { key: 'specialty', label: '전문분야', width: '150px' },
    { key: 'totalSessions', label: '총 상담수', width: '100px' },
    { key: 'completedSessions', label: '완료 상담수', width: '120px' },
    { key: 'cancelledSessions', label: '취소 상담수', width: '120px' },
    { key: 'completionRate', label: '완료율', width: '100px' }
  ],
  CLIENT: [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: '이름', width: '120px' },
    { key: 'email', label: '이메일', width: '200px' },
    { key: 'totalSessions', label: '총 상담수', width: '100px' },
    { key: 'lastSession', label: '마지막 상담', width: '120px' },
    { key: 'status', label: '상태', width: '100px' }
  ]
};

// ==================== 정렬 옵션 ====================
export const SORT_OPTIONS = {
  DATE_ASC: 'date_asc',
  DATE_DESC: 'date_desc',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  STATUS_ASC: 'status_asc',
  STATUS_DESC: 'status_desc',
  CREATED_ASC: 'created_asc',
  CREATED_DESC: 'created_desc'
};

// ==================== 정렬 라벨 ====================
export const SORT_LABELS = {
  [SORT_OPTIONS.DATE_ASC]: '날짜 오름차순',
  [SORT_OPTIONS.DATE_DESC]: '날짜 내림차순',
  [SORT_OPTIONS.NAME_ASC]: '이름 오름차순',
  [SORT_OPTIONS.NAME_DESC]: '이름 내림차순',
  [SORT_OPTIONS.STATUS_ASC]: '상태 오름차순',
  [SORT_OPTIONS.STATUS_DESC]: '상태 내림차순',
  [SORT_OPTIONS.CREATED_ASC]: '생성일 오름차순',
  [SORT_OPTIONS.CREATED_DESC]: '생성일 내림차순'
};

// ==================== 페이지네이션 ====================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100],
  MAX_VISIBLE_PAGES: 5
};

// ==================== API 엔드포인트 ====================
export const CHART_API = {
  STATISTICS: '/api/schedules/admin/statistics',
  TRENDS: '/api/schedules/trends',
  CONSULTANT_STATS: '/api/consultants/statistics',
  CLIENT_STATS: '/api/clients/statistics',
  REVENUE_STATS: '/api/revenue/statistics'
};

// ==================== 차트 애니메이션 ====================
export const CHART_ANIMATION = {
  DURATION: 1000,
  EASING: 'easeInOutQuart',
  DELAY: 0
};

// ==================== 차트 이벤트 ====================
export const CHART_EVENTS = {
  CLICK: 'click',
  HOVER: 'hover',
  LEGEND_CLICK: 'legendClick',
  DATA_POINT_CLICK: 'dataPointClick'
};

// ==================== 차트 반응형 브레이크포인트 ====================
export const CHART_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
};

// ==================== 차트 기본 설정 ====================
export const CHART_DEFAULTS = {
  TYPE: CHART_TYPES.BAR,
  HEIGHT: CHART_HEIGHTS.MEDIUM,
  COLORS: [
    CHART_COLORS.PRIMARY,
    CHART_COLORS.SUCCESS,
    CHART_COLORS.WARNING,
    CHART_COLORS.DANGER,
    CHART_COLORS.INFO,
    CHART_COLORS.SECONDARY
  ],
  BORDER_WIDTH: 2,
  BORDER_RADIUS: 4,
  POINT_RADIUS: 4,
  POINT_HOVER_RADIUS: 6
};

// ==================== 상세 통계 카드 상수 ====================
export const DETAILED_STATS = {
  // 카드 타입
  CARD_TYPES: {
    CLIENT_STATUS: 'client_status',
    CONSULTANT_STATUS: 'consultant_status',
    COMPLETION_RATE: 'completion_rate',
    CANCELLATION_RATE: 'cancellation_rate',
    WEEKLY_STATUS: 'weekly_status',
    TODAY_STATUS: 'today_status'
  },
  
  // 아이콘
  ICONS: {
    CLIENT_STATUS: 'fas fa-users',
    CONSULTANT_STATUS: 'fas fa-id-card',
    COMPLETION_RATE: 'fas fa-chart-line',
    CANCELLATION_RATE: 'fas fa-chart-line',
    WEEKLY_STATUS: 'fas fa-calendar-week',
    TODAY_STATUS: 'fas fa-calendar-day'
  },
  
  // 제목
  TITLES: {
    CLIENT_STATUS: '내담자 현황',
    CONSULTANT_STATUS: '상담사 현황',
    COMPLETION_RATE: '완료율',
    CANCELLATION_RATE: '취소율',
    WEEKLY_STATUS: '주간 현황',
    TODAY_STATUS: '오늘 현황'
  },
  
  // 라벨
  LABELS: {
    THIS_MONTH_CLIENTS: '이번 달 내담자',
    THIS_MONTH_CONSULTANTS: '이번 달 상담사',
    COMPLETION_RATE: '이번 달 완료율',
    CANCELLATION_RATE: '이번 달 취소율',
    WEEKLY_CONSULTATIONS: '최근 7일 상담',
    TODAY_CONSULTATIONS: '오늘 상담',
    LAST_MONTH: '지난 달',
    TOTAL_CONSULTATIONS: '총 상담',
    COMPLETED: '완료',
    CANCELLED: '취소',
    BOOKED: '예약',
    GROWTH_RATE: '증감률',
    CHANGE: '명',
    PERCENTAGE: '%'
  },
  
  // 설명
  DESCRIPTIONS: {
    CLIENT_CHANGE: '지난 달 대비 내담자 변화',
    CONSULTANT_CHANGE: '지난 달 대비 상담사 변화',
    COMPLETION_RATE_DESC: '이번 달 기준 상담 완료율',
    CANCELLATION_RATE_DESC: '이번 달 기준 상담 취소율',
    WEEKLY_DESC: '최근 7일간 상담 현황',
    TODAY_DESC: '오늘 기준 상담 현황'
  },
  
  // 증감 타입
  CHANGE_TYPES: {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
    NEUTRAL: 'neutral'
  },
  
  // 증감 아이콘
  CHANGE_ICONS: {
    POSITIVE: '↗',
    NEGATIVE: '↘',
    NEUTRAL: ''
  }
};

// ==================== 상세 통계 그리드 설정 ====================
export const DETAILED_STATS_GRID = {
  GRID_COLUMNS: {
    MOBILE: 1,
    TABLET: 2,
    DESKTOP: 3
  },
  CARD_MIN_WIDTH: '300px',
  GAP: '1.5rem',
  MARGIN: '2rem 0'
};

// ==================== 상세 통계 애니메이션 ====================
export const DETAILED_STATS_ANIMATION = {
  FADE_IN_DURATION: 300,
  STAGGER_DELAY: 100,
  HOVER_TRANSFORM: 'translateY(-2px)',
  HOVER_DURATION: '0.3s',
  HOVER_EASING: 'ease'
};

// ==================== 기본 통계 카드 상수 ====================
export const STATS_CARD = {
  // 카드 타입
  CARD_TYPES: {
    TOTAL_SCHEDULES: 'total_schedules',
    BOOKED_SCHEDULES: 'booked_schedules',
    COMPLETED_SCHEDULES: 'completed_schedules',
    CANCELLED_SCHEDULES: 'cancelled_schedules',
    CONFIRMED_SCHEDULES: 'confirmed_schedules',
    IN_PROGRESS_SCHEDULES: 'in_progress_schedules'
  },
  
  // 아이콘
  ICONS: {
    TOTAL_SCHEDULES: 'fas fa-calendar-check',
    BOOKED_SCHEDULES: 'fas fa-calendar-plus',
    COMPLETED_SCHEDULES: 'fas fa-check-circle',
    CANCELLED_SCHEDULES: 'fas fa-times-circle',
    CONFIRMED_SCHEDULES: 'fas fa-calendar-check',
    IN_PROGRESS_SCHEDULES: 'fas fa-clock'
  },
  
  // 제목
  TITLES: {
    TOTAL_SCHEDULES: '총 상담 수',
    BOOKED_SCHEDULES: '예약된 상담',
    COMPLETED_SCHEDULES: '완료된 상담',
    CANCELLED_SCHEDULES: '취소된 상담',
    CONFIRMED_SCHEDULES: '확정된 상담',
    IN_PROGRESS_SCHEDULES: '진행중인 상담'
  },
  
  // 라벨
  LABELS: {
    TOTAL_SCHEDULES: '전체 상담',
    BOOKED_SCHEDULES: '예약 대기',
    COMPLETED_SCHEDULES: '상담 완료',
    CANCELLED_SCHEDULES: '상담 취소',
    CONFIRMED_SCHEDULES: '상담 확정',
    IN_PROGRESS_SCHEDULES: '상담 진행',
    CHANGE: '건'
  },
  
  // 색상
  COLORS: {
    PRIMARY: 'primary',
    SUCCESS: 'success',
    WARNING: 'warning',
    DANGER: 'danger',
    INFO: 'info',
    DEFAULT: 'default'
  },
  
  // 증감 타입
  CHANGE_TYPES: {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
    NEUTRAL: 'neutral'
  },
  
  // 증감 아이콘
  CHANGE_ICONS: {
    POSITIVE: '↗',
    NEGATIVE: '↘',
    NEUTRAL: ''
  }
};

// ==================== 통계 카드 그리드 설정 ====================
export const STATS_CARD_GRID = {
  GRID_COLUMNS: {
    MOBILE: 1,
    TABLET: 2,
    DESKTOP: 4
  },
  CARD_MIN_WIDTH: '250px',
  GAP: '1.5rem',
  MARGIN: '2rem 0'
};

// ==================== 통계 카드 애니메이션 ====================
export const STATS_CARD_ANIMATION = {
  FADE_IN_DURATION: 300,
  STAGGER_DELAY: 100,
  HOVER_TRANSFORM: 'translateY(-2px)',
  HOVER_DURATION: '0.3s',
  HOVER_EASING: 'ease'
};
