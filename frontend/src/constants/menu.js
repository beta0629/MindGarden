/**
 * 메뉴 구조 상수
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
      { id: 'admin-settings', label: '관리자 설정', path: '/admin/settings', icon: 'bi-gear-fill' }
    ],
    users: [
      { id: 'admin-consultants', label: '상담사 관리', path: '/admin/consultants', icon: 'bi-person-badge' },
      { id: 'admin-clients', label: '내담자 관리', path: '/admin/clients', icon: 'bi-person-check' },
      { id: 'admin-mapping', label: '매핑 관리', path: '/admin/mapping', icon: 'bi-link' }
    ],
    system: [
      { id: 'admin-codes', label: '공통코드 관리', path: '/admin/common-codes', icon: 'bi-code' },
      { id: 'admin-system', label: '시스템 도구', path: '/admin/system', icon: 'bi-tools' },
      { id: 'admin-logs', label: '시스템 로그', path: '/admin/logs', icon: 'bi-file-text' }
    ]
  }
};

// 상담사 메뉴
export const CONSULTANT_MENU_ITEMS = {
  MAIN: {
    SCHEDULE: {
      id: 'schedule',
      label: '일정 관리',
      icon: 'bi-calendar'
    },
    CONSULTATION: {
      id: 'consultation',
      label: '상담 관리',
      icon: 'bi-chat-dots'
    }
  },
  SUB: {
    schedule: [
      { id: 'consultant-schedule', label: '일정 관리', path: '/consultant/schedule', icon: 'bi-calendar' },
      { id: 'consultant-availability', label: '상담 가능 시간', path: '/consultant/availability', icon: 'bi-clock' }
    ],
    consultation: [
      { id: 'consultant-records', label: '상담 기록', path: '/consultant/records', icon: 'bi-journal-text' },
      { id: 'consultant-clients', label: '내담자 목록', path: '/consultant/clients', icon: 'bi-people' }
    ]
  }
};

// 내담자 메뉴
export const CLIENT_MENU_ITEMS = {
  MAIN: {
    APPOINTMENT: {
      id: 'appointment',
      label: '상담 예약',
      icon: 'bi-calendar-plus'
    },
    HISTORY: {
      id: 'history',
      label: '상담 내역',
      icon: 'bi-clock-history'
    }
  },
  SUB: {
    appointment: [
      { id: 'client-appointment', label: '상담 예약', path: '/client/appointment', icon: 'bi-calendar-plus' },
      { id: 'client-consultants', label: '상담사 선택', path: '/client/consultants', icon: 'bi-person-badge' }
    ],
    history: [
      { id: 'client-history', label: '상담 내역', path: '/client/history', icon: 'bi-clock-history' },
      { id: 'client-reports', label: '상담 리포트', path: '/client/reports', icon: 'bi-file-earmark-text' }
    ]
  }
};

// 사용자 역할 상수
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  CONSULTANT: 'CONSULTANT',
  CLIENT: 'CLIENT'
};

// 메뉴 타입 상수
export const MENU_TYPES = {
  MAIN: 'main',
  SUB: 'sub'
};
