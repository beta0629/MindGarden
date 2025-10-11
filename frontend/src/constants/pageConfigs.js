/**
 * 페이지 설정 상수 파일
 * 모든 페이지의 하드코딩된 텍스트와 설정을 중앙 관리
 */

// 공통 페이지 설정
export const COMMON_PAGE_CONFIG = {
  NOTIFICATION: {
    TYPE: 'toast',
    POSITION: 'top-right'
  }
};

// 마이페이지 설정
export const MYPAGE_CONFIG = {
  TITLE: '마이페이지',
  DESCRIPTION: '개인 정보 및 설정 관리',
  BODY_CLASS: 'mypage',
  PAGE_HEADER: {
    TITLE: '내 정보를 안전하게 관리하세요',
    DESCRIPTION: '프로필, 보안 설정, 개인정보 등을 체계적으로 관리하고 업데이트할 수 있습니다.',
    ICON: '👤',
    ACTION_BUTTON: {
      TEXT: '보안 설정',
      ICON: '🔒',
      VARIANT: 'secondary',
      SIZE: 'md'
    }
  },
  LOADING: {
    TEXT: '사용자 정보를 불러오는 중...'
  }
};

// 스케줄 페이지 설정
export const SCHEDULE_PAGE_CONFIG = {
  TITLE: '스케줄 관리',
  DESCRIPTION: '상담 일정 및 스케줄 관리',
  BODY_CLASS: 'schedule-page',
  PAGE_HEADER: {
    TITLE: '일정을 효율적으로 관리하세요',
    DESCRIPTION: '상담 일정, 휴가 신청, 상담사 현황을 한눈에 확인하고 관리할 수 있습니다.',
    ICON: '📅',
    ACTION_BUTTON: {
      TEXT: '일정 추가',
      ICON: '➕',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 세션 관리 페이지 설정
export const SESSION_MANAGEMENT_CONFIG = {
  TITLE: '세션 관리',
  DESCRIPTION: '내담자 회기 관리 시스템',
  BODY_CLASS: 'session-management-page',
  PAGE_HEADER: {
    TITLE: '시스템 현황을 한눈에 확인하고 관리하세요',
    DESCRIPTION: '상담사와 내담자의 세션 매핑을 효율적으로 관리하고, 회기 현황을 실시간으로 모니터링할 수 있습니다.',
    ICON: '📊',
    ACTION_BUTTON: {
      TEXT: '통계 보기',
      ICON: '📊',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 관리자 대시보드 설정
export const ADMIN_DASHBOARD_CONFIG = {
  TITLE: '관리자 대시보드',
  DESCRIPTION: '시스템 관리 및 모니터링',
  BODY_CLASS: 'admin-dashboard',
  PAGE_HEADER: {
    TITLE: '시스템을 체계적으로 관리하세요',
    DESCRIPTION: '사용자, 권한, 시스템 상태를 한눈에 확인하고 효율적으로 관리할 수 있습니다.',
    ICON: '⚙️',
    ACTION_BUTTON: {
      TEXT: '시스템 설정',
      ICON: '⚙️',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// ERP 대시보드 설정
export const ERP_DASHBOARD_CONFIG = {
  TITLE: 'ERP 관리 시스템',
  DESCRIPTION: '통합 ERP 대시보드 및 관리',
  BODY_CLASS: 'erp-dashboard',
  PAGE_HEADER: {
    TITLE: 'ERP 시스템을 통합 관리하세요',
    DESCRIPTION: '재무, 구매, 예산, 인사 등 모든 ERP 기능을 한 곳에서 효율적으로 관리할 수 있습니다.',
    ICON: '💼',
    ACTION_BUTTON: {
      TEXT: '새로고침',
      ICON: '🔄',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 사용자 관리 페이지 설정
export const USER_MANAGEMENT_CONFIG = {
  TITLE: '사용자 관리',
  DESCRIPTION: '계정 및 권한 관리 시스템',
  BODY_CLASS: 'user-management',
  PAGE_HEADER: {
    TITLE: '사용자를 체계적으로 관리하세요',
    DESCRIPTION: '계정 생성, 권한 설정, 역할 관리를 통해 안전하고 효율적인 사용자 관리를 할 수 있습니다.',
    ICON: '👥',
    ACTION_BUTTON: {
      TEXT: '사용자 추가',
      ICON: '➕',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 상담 기록 페이지 설정
export const CONSULTATION_RECORD_CONFIG = {
  TITLE: '상담 기록',
  DESCRIPTION: '상담 내역 및 기록 관리',
  BODY_CLASS: 'consultation-record',
  PAGE_HEADER: {
    TITLE: '상담을 체계적으로 기록하세요',
    DESCRIPTION: '상담 내용, 진단, 치료 계획을 상세하게 기록하고 관리할 수 있습니다.',
    ICON: '📝',
    ACTION_BUTTON: {
      TEXT: '기록 추가',
      ICON: '➕',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 클라이언트 설정 페이지 설정
export const CLIENT_SETTINGS_CONFIG = {
  TITLE: '클라이언트 설정',
  DESCRIPTION: '클라이언트 전용 설정 관리',
  BODY_CLASS: 'client-settings',
  PAGE_HEADER: {
    TITLE: '개인화된 설정을 관리하세요',
    DESCRIPTION: '알림, 개인정보, 상담 환경을 원하는 대로 설정할 수 있습니다.',
    ICON: '⚙️',
    ACTION_BUTTON: {
      TEXT: '설정 저장',
      ICON: '💾',
      VARIANT: 'secondary',
      SIZE: 'md'
    }
  }
};

// 지점 관리 페이지 설정
export const BRANCH_MANAGEMENT_CONFIG = {
  TITLE: '지점 관리',
  DESCRIPTION: '지점별 관리 및 설정',
  BODY_CLASS: 'branch-management',
  PAGE_HEADER: {
    TITLE: '지점을 체계적으로 관리하세요',
    DESCRIPTION: '지점별 직원, 매출, 설정을 통합적으로 관리하고 모니터링할 수 있습니다.',
    ICON: '🏢',
    ACTION_BUTTON: {
      TEXT: '지점 추가',
      ICON: '➕',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 컴플라이언스 대시보드 설정
export const COMPLIANCE_DASHBOARD_CONFIG = {
  TITLE: '컴플라이언스 대시보드',
  DESCRIPTION: '규정 준수 및 감사 관리',
  BODY_CLASS: 'compliance-dashboard',
  PAGE_HEADER: {
    TITLE: '규정 준수를 체계적으로 관리하세요',
    DESCRIPTION: '법적 요구사항, 감사 내역, 규정 준수 상태를 실시간으로 모니터링할 수 있습니다.',
    ICON: '📋',
    ACTION_BUTTON: {
      TEXT: '감사 보고서',
      ICON: '📊',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 통계 대시보드 설정
export const STATISTICS_DASHBOARD_CONFIG = {
  TITLE: '통계 대시보드',
  DESCRIPTION: '시스템 통계 및 분석',
  BODY_CLASS: 'statistics-dashboard',
  PAGE_HEADER: {
    TITLE: '데이터를 한눈에 분석하세요',
    DESCRIPTION: '사용자, 매출, 성과 등 다양한 통계 데이터를 시각적으로 확인하고 분석할 수 있습니다.',
    ICON: '📈',
    ACTION_BUTTON: {
      TEXT: '상세 분석',
      ICON: '🔍',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// HQ 대시보드 설정
export const HQ_DASHBOARD_CONFIG = {
  TITLE: '본부 대시보드',
  DESCRIPTION: '본부 관리 및 통합 현황',
  BODY_CLASS: 'hq-dashboard',
  PAGE_HEADER: {
    TITLE: '전체 시스템을 통합 관리하세요',
    DESCRIPTION: '모든 지점의 현황, 성과, 이슈를 실시간으로 모니터링하고 관리할 수 있습니다.',
    ICON: '🏢',
    ACTION_BUTTON: {
      TEXT: '전체 현황',
      ICON: '📊',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 지점 통계 대시보드 설정
export const BRANCH_STATISTICS_DASHBOARD_CONFIG = {
  TITLE: '지점 통계 대시보드',
  DESCRIPTION: '지점별 성과 및 통계 분석',
  BODY_CLASS: 'branch-statistics-dashboard',
  PAGE_HEADER: {
    TITLE: '지점 성과를 체계적으로 분석하세요',
    DESCRIPTION: '지점별 매출, 고객, 직원 성과를 상세하게 분석하고 비교할 수 있습니다.',
    ICON: '📊',
    ACTION_BUTTON: {
      TEXT: '성과 비교',
      ICON: '📈',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 통합 재무 대시보드 설정
export const INTEGRATED_FINANCE_DASHBOARD_CONFIG = {
  TITLE: '통합 재무 대시보드',
  DESCRIPTION: '재무 현황 통합 관리',
  BODY_CLASS: 'integrated-finance-dashboard',
  PAGE_HEADER: {
    TITLE: '재무를 통합적으로 관리하세요',
    DESCRIPTION: '수입, 지출, 예산, 현금흐름을 한눈에 확인하고 실시간으로 모니터링할 수 있습니다.',
    ICON: '💰',
    ACTION_BUTTON: {
      TEXT: '재무 분석',
      ICON: '📊',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 공통 대시보드 설정
export const COMMON_DASHBOARD_CONFIG = {
  TITLE: '대시보드',
  DESCRIPTION: '통합 현황 및 관리',
  BODY_CLASS: 'common-dashboard',
  PAGE_HEADER: {
    TITLE: '현황을 한눈에 확인하세요',
    DESCRIPTION: '시스템 전반의 현황과 주요 지표를 실시간으로 모니터링할 수 있습니다.',
    ICON: '📊',
    ACTION_BUTTON: {
      TEXT: '상세 보기',
      ICON: '🔍',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  }
};

// 시스템 도구 설정
export const SYSTEM_TOOLS_CONFIG = {
  TITLE: '시스템 도구',
  DESCRIPTION: '시스템 관리 및 유지보수 도구',
  BODY_CLASS: 'system-tools',
  PAGE_HEADER: {
    TITLE: '시스템을 체계적으로 관리하세요',
    DESCRIPTION: '시스템 상태 확인, 로그 조회, 캐시 관리, 백업 생성 등 시스템 유지보수 도구를 제공합니다.',
    ICON: '🔧',
    ACTION_BUTTON: {
      TEXT: '시스템 상태',
      ICON: '📊',
      VARIANT: 'primary',
      SIZE: 'md'
    }
  },
  TOOLS: {
    REFRESH: {
      LABEL: '새로고침',
      DESCRIPTION: '통계 데이터를 새로고침합니다'
    },
    LOGS: {
      LABEL: '로그 보기',
      DESCRIPTION: '시스템 로그를 확인합니다'
    },
    CACHE: {
      LABEL: '캐시 초기화',
      DESCRIPTION: '시스템 캐시를 초기화합니다'
    },
    BACKUP: {
      LABEL: '백업 생성',
      DESCRIPTION: '데이터베이스 백업을 생성합니다'
    }
  }
};
