/**
 * 대시보드 관련 상수
 * 내담자, 상담사, 관리자 대시보드에서 사용하는 상수들
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

// 대시보드 카드 타입
export const DASHBOARD_CARD_TYPES = {
  TODAY_SCHEDULE: 'today-schedule',
  HEALTHY_MIND: 'healthy-mind',
  TODAY_TIP: 'today-tip',
  CONSULTATION_SCHEDULE: 'consultation-schedule',
  CONSULTANT_INFO: 'consultant-info',
  CONSULTATION_STATS: 'consultation-stats',
  SYSTEM_STATUS: 'system-status',
  MAPPING_MANAGEMENT: 'mapping-management'
};

// 대시보드 아이콘
export const DASHBOARD_ICONS = {
  CALENDAR: 'bi bi-calendar-event',
  HEART: 'bi bi-heart',
  LIGHTBULB: 'bi bi-lightbulb',
  CLOCK: 'bi bi-clock-history',
  CALENDAR_CHECK: 'bi bi-calendar-check',
  PERSON_BADGE: 'bi bi-person-badge',
  GRAPH_UP: 'bi bi-graph-up',
  GEAR: 'bi bi-gear',
  LINK: 'bi bi-link-45deg',
  PEOPLE: 'bi bi-people',
  STAR: 'bi bi-star',
  PERSON_CIRCLE: 'bi bi-person-circle'
};

// 대시보드 메시지
export const DASHBOARD_MESSAGES = {
  WELCOME: {
    CLIENT: '안녕하세요, 내담자님!',
    CONSULTANT: '안녕하세요, 상담사님!',
    ADMIN: '안녕하세요, 관리자님!',
    DEFAULT: '안녕하세요!'
  },
  NO_SCHEDULE: '오늘 예정된 상담이 없습니다',
  NO_UPCOMING: '없음',
  HEALTHY_MIND: '상담을 통해 더 나은 내일을 만들어가세요',
  TODAY_TIP: '작은 변화가 큰 변화를 만듭니다',
  NO_CONSULTANT: '담당 상담사가 없습니다',
  LOADING: '데이터를 불러오는 중...',
  ERROR: '데이터를 불러오는데 실패했습니다'
};

// 대시보드 라벨
export const DASHBOARD_LABELS = {
  TODAY_SCHEDULE: '오늘의 일정',
  HEALTHY_MIND: '건강한 마음',
  TODAY_TIP: '오늘의 팁',
  CONSULTATION_SCHEDULE: '상담 일정',
  UPCOMING_CONSULTATIONS: '다가오는 상담',
  THIS_WEEK_CONSULTATIONS: '이번 주 상담',
  RESPONSIBLE_CONSULTANT: '담당 상담사',
  CONSULTATION_STATS: '상담 통계',
  THIS_MONTH_CONSULTATIONS: '이번 달 상담',
  RATING: '평점',
  SYSTEM_STATUS: '시스템 현황',
  TOTAL_USERS: '전체 사용자',
  TODAY_CONSULTATIONS: '오늘 상담',
  MAPPING_MANAGEMENT: '매핑 관리',
  PENDING_APPROVALS: '승인 대기',
  ACTIVE_MAPPINGS: '활성 매핑'
};

// 대시보드 색상
export const DASHBOARD_COLORS = {
  PRIMARY: 'primary',
  SUCCESS: 'success',
  WARNING: 'warning',
  DANGER: 'danger',
  INFO: 'info',
  SECONDARY: 'secondary',
  LIGHT: 'light',
  DARK: 'dark'
};

// 대시보드 액션 버튼
export const DASHBOARD_ACTIONS = {
  PROFILE: {
    LABEL: '프로필',
    ICON: 'bi bi-person',
    ROUTE: '/mypage'
  },
  SCHEDULE: {
    LABEL: '일정',
    ICON: 'bi bi-calendar',
    ROUTE: '/schedule'
  },
  HELP: {
    LABEL: '도움말',
    ICON: 'bi bi-question-circle',
    ROUTE: '/help'
  },
  SETTINGS: {
    LABEL: '설정',
    ICON: 'bi bi-gear',
    ROUTE: '/settings'
  },
  MAPPING_MANAGEMENT: {
    LABEL: '매핑 관리',
    ICON: 'bi bi-link-45deg',
    ROUTE: '/admin/mapping-management'
  },
  COMMON_CODES: {
    LABEL: '공통코드',
    ICON: 'bi bi-list-ul',
    ROUTE: '/admin/common-codes'
  },
  STATISTICS: {
    LABEL: '통계',
    ICON: 'bi bi-graph-up',
    ROUTE: '/admin/statistics'
  },
  CONSULTATION_HISTORY: {
    LABEL: '상담 내역',
    ICON: 'bi bi-clock-history',
    ROUTE: '/consultation-history'
  },
  CONSULTATION_REPORT: {
    LABEL: '상담 리포트',
    ICON: 'bi bi-file-text',
    ROUTE: '/consultation-report'
  }
};

// 대시보드 데이터 기본값
export const DASHBOARD_DEFAULT_DATA = {
  consultationData: {
    upcomingConsultations: [],
    weeklyConsultations: 0,
    monthlyConsultations: 0,
    rating: 0,
    totalUsers: 0,
    todayConsultations: 0,
    consultantInfo: {
      name: '',
      specialty: '',
      intro: '',
      profileImage: null
    },
    recentActivities: [],
    pendingMappings: 0,
    activeMappings: 0
  }
};

// 대시보드 로딩 상태
export const DASHBOARD_LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// 대시보드 에러 메시지
export const DASHBOARD_ERROR_MESSAGES = {
  LOAD_SCHEDULES_FAILED: '일정을 불러오는데 실패했습니다',
  LOAD_CONSULTANT_INFO_FAILED: '상담사 정보를 불러오는데 실패했습니다',
  LOAD_STATISTICS_FAILED: '통계를 불러오는데 실패했습니다',
  LOAD_SYSTEM_INFO_FAILED: '시스템 정보를 불러오는데 실패했습니다',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요',
  UNAUTHORIZED: '로그인이 필요합니다',
  FORBIDDEN: '접근 권한이 없습니다'
};

export default {
  DASHBOARD_CARD_TYPES,
  DASHBOARD_ICONS,
  DASHBOARD_MESSAGES,
  DASHBOARD_LABELS,
  DASHBOARD_COLORS,
  DASHBOARD_ACTIONS,
  DASHBOARD_DEFAULT_DATA,
  DASHBOARD_LOADING_STATES,
  DASHBOARD_ERROR_MESSAGES
};
