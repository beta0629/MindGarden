/**
 * 메뉴 구조 상수
/**
 * 메인메뉴와 서브메뉴를 명확하게 분리하여 관리
 */

// 공통 메뉴 아이템
export const COMMON_MENU_ITEMS = {
  DASHBOARD: {
    id: 'dashboard',
    label: '대시보드',
    path: '/dashboard',
    icon: 'bi-house'
  },
  MYPAGE: {
    id: 'mypage',
    label: '마이페이지',
    path: '/mypage', // 동적으로 설정됨
    icon: 'bi-person'
  },
  CONSULTATION_HISTORY: {
    id: 'consultation-history',
    label: '상담 내역',
    path: '/consultation-history',
    icon: 'bi-clock-history'
  },
  CONSULTATION_REPORT: {
    id: 'consultation-report',
    label: '상담 리포트',
    path: '/consultation-report',
    icon: 'bi-file-text'
  }
};

// 관리자 메뉴
export const ADMIN_MENU_ITEMS = {
  MAIN: {
    ADMIN: {
      id: 'admin',
      label: '관리자 기능',
      icon: 'bi-gear'
    },
    USERS: {
      id: 'users',
      label: '사용자 관리',
      icon: 'bi-people'
    },
    SYSTEM: {
      id: 'system',
      label: '시스템 관리',
      icon: 'bi-tools'
    }
  },
  SUB: {
    admin: [
      { id: 'admin-dashboard', label: '관리자 대시보드', path: '/admin/dashboard', icon: 'bi-speedometer2' },
      { id: 'admin-schedules', label: '전체 스케줄', path: '/admin/schedules', icon: 'bi-calendar-check' },
      { id: 'admin-settings', label: '관리자 설정', path: '/admin/settings', icon: 'bi-gear-fill' }
    ],
    users: [
      { id: 'admin-user-management', label: '사용자 관리', path: '/admin/user-management', icon: 'bi-people' },
      { id: 'admin-accounts', label: '계좌 관리', path: '/admin/accounts', icon: 'bi-bank' },
      { id: 'admin-mapping', label: '매핑 관리', path: '/admin/mapping-management', icon: 'bi-link' }
    ],
    system: [
      { id: 'admin-codes', label: '공통코드 관리', path: '/admin/common-codes', icon: 'bi-code' },
      { id: 'admin-system', label: '시스템 도구', path: '/admin/system', icon: 'bi-tools' },
      { id: 'admin-logs', label: '시스템 로그', path: '/admin/logs', icon: 'bi-file-text' },
      { id: 'admin-integration-test', label: '통합 테스트', path: '/test/integration', icon: 'bi-check-circle' }
    ]
  }
};

// 사무원(STAFF) 메뉴 - ADMIN과 동일 구조, 권한 그룹으로 세부 제어
export const STAFF_MENU_ITEMS = {
  MAIN: ADMIN_MENU_ITEMS.MAIN,
  SUB: ADMIN_MENU_ITEMS.SUB
};

// 상담사 메뉴
export const CONSULTANT_MENU_ITEMS = {
  MAIN: {
    SCHEDULE: {
      id: 'schedule',
      label: '일정 관리',
      icon: 'bi-calendar'
    },
    CLIENT_VIEW: {
      id: 'client_view',
      label: '내담자 조회',
      icon: 'bi-people'
    },
    RECORD_MGMT: {
      id: 'record_mgmt',
      label: '상담 기록',
      icon: 'bi-journal-text'
    }
  },
  SUB: {
    schedule: [
      { id: 'consultant-schedule', label: '전체 스케줄', path: '/consultant/schedule', icon: 'bi-calendar-check' },
      { id: 'consultant-availability', label: '가능 시간 설정', path: '/consultant/availability', icon: 'bi-clock' }
    ],
    client_view: [
      { id: 'consultant-clients', label: '내 내담자 목록', path: '/consultant/clients', icon: 'bi-person-lines-fill' },
      { id: 'consultant-messages', label: '상담사 메시지', path: '/consultant/messages', icon: 'bi-chat-dots' }
    ],
    record_mgmt: [
      { id: 'consultant-records', label: '상담 일지 관리', path: '/consultant/consultation-records', icon: 'bi-journal-check' },
      { id: 'consultant-logs', label: '상담 리포트/로그', path: '/consultant/consultation-logs', icon: 'bi-file-earmark-text' }
    ]
  }
};

// 내담자 메뉴
export const CLIENT_MENU_ITEMS = {
  MAIN: {
    MESSAGES: {
      id: 'messages',
      label: '상담사 메시지',
      icon: 'bi-chat-dots'
    }
  },
  SUB: {
    messages: [
      { id: 'client-messages', label: '상담사 메시지', path: '/client/messages', icon: 'bi-chat-dots' }
    ]
  }
};

/** 표준 역할 4개만 (ADMIN, STAFF, CONSULTANT, CLIENT) */
export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CONSULTANT: 'CONSULTANT',
  CLIENT: 'CLIENT'
};

// 메뉴 타입 상수
export const MENU_TYPES = {
  MAIN: 'main',
  SUB: 'sub'
};
