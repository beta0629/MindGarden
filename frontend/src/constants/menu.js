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
      { id: 'admin-statistics', label: '통계 보기', path: '/admin/statistics', icon: 'bi-graph-up' },
      { id: 'admin-statistics-dashboard', label: '통계 대시보드', path: '/admin/statistics-dashboard', icon: 'bi-bar-chart' },
      { id: 'admin-schedules', label: '전체 스케줄', path: '/admin/schedules', icon: 'bi-calendar-check' },
      { id: 'admin-settings', label: '관리자 설정', path: '/admin/settings', icon: 'bi-gear-fill' }
    ],
    users: [
      { id: 'admin-consultants', label: '상담사 관리', path: '/admin/consultant-comprehensive', icon: 'bi-person-badge' },
      { id: 'admin-clients', label: '내담자 관리', path: '/admin/client-comprehensive', icon: 'bi-person-check' },
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

// 수퍼어드민 메뉴
export const BRANCH_SUPER_ADMIN_MENU_ITEMS = {
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
    },
    // FINANCE는 ERP로 통합되어 제거됨
    ERP: {
      id: 'erp',
      label: 'ERP 관리',
      icon: 'bi-box-seam'
    }
  },
  SUB: {
    admin: [
      { id: 'admin-dashboard', label: '관리자 대시보드', path: '/admin/dashboard', icon: 'bi-speedometer2' },
      { id: 'admin-statistics', label: '통계 보기', path: '/admin/statistics', icon: 'bi-graph-up' },
      { id: 'admin-statistics-dashboard', label: '통계 대시보드', path: '/admin/statistics-dashboard', icon: 'bi-bar-chart' },
      { id: 'admin-schedules', label: '전체 스케줄', path: '/admin/schedules', icon: 'bi-calendar-check' },
      { id: 'admin-settings', label: '관리자 설정', path: '/admin/settings', icon: 'bi-gear-fill' }
    ],
    users: [
      { id: 'admin-consultants', label: '상담사 관리', path: '/admin/consultant-comprehensive', icon: 'bi-person-badge' },
      { id: 'admin-clients', label: '내담자 관리', path: '/admin/client-comprehensive', icon: 'bi-person-check' },
      { id: 'admin-user-management', label: '사용자 관리', path: '/admin/user-management', icon: 'bi-people' },
      { id: 'admin-accounts', label: '계좌 관리', path: '/admin/accounts', icon: 'bi-bank' },
      { id: 'admin-mapping', label: '매핑 관리', path: '/admin/mapping-management', icon: 'bi-link' }
    ],
    system: [
      { id: 'admin-codes', label: '공통코드 관리', path: '/admin/common-codes', icon: 'bi-code' },
      { id: 'admin-system', label: '시스템 도구', path: '/admin/system', icon: 'bi-tools' },
      { id: 'admin-logs', label: '시스템 로그', path: '/admin/logs', icon: 'bi-file-text' },
      { id: 'admin-integration-test', label: '통합 테스트', path: '/test/integration', icon: 'bi-check-circle' }
    ],
    // finance 메뉴는 ERP로 통합되어 제거됨
    erp: [
      { id: 'erp-dashboard', label: 'ERP 대시보드', path: '/erp/dashboard', icon: 'bi-speedometer2' },
      { id: 'erp-purchase-requests', label: '구매 요청', path: '/erp/purchase-requests', icon: 'bi-cart-plus' },
      { id: 'erp-approvals', label: '관리자 승인', path: '/erp/approvals', icon: 'bi-check-circle' },
      { id: 'erp-super-approvals', label: '수퍼 관리자 승인', path: '/erp/super-approvals', icon: 'bi-shield-check' },
      { id: 'erp-items', label: '아이템 관리', path: '/erp/items', icon: 'bi-box' },
      { id: 'erp-budgets', label: '예산 관리', path: '/erp/budgets', icon: 'bi-wallet2' },
      { id: 'erp-orders', label: '주문 관리', path: '/erp/orders', icon: 'bi-truck' }
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
      { id: 'consultant-records', label: '상담 기록', path: '/consultant/consultation-records', icon: 'bi-journal-text' },
      { id: 'consultant-clients', label: '내담자 목록', path: '/consultant/clients', icon: 'bi-people' },
      { id: 'consultant-messages', label: '메시지 관리', path: '/consultant/messages', icon: 'bi-chat-dots' }
    ]
  }
};

// 본사 관리자 메뉴 (헤드쿼터)
export const HQ_ADMIN_MENU_ITEMS = {
  MAIN: {
    ADMIN: {
      id: 'admin',
      label: '본사 관리',
      icon: 'bi-building'
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
      { id: 'hq-dashboard', label: '본사 대시보드', path: '/super_admin/dashboard', icon: 'bi-speedometer2' },
      { id: 'hq-statistics', label: '통계 보기', path: '/admin/statistics', icon: 'bi-graph-up' },
      { id: 'hq-schedules', label: '전체 스케줄', path: '/admin/schedules', icon: 'bi-calendar-check' }
    ],
    users: [
      { id: 'hq-consultants', label: '상담사 관리', path: '/admin/consultant-comprehensive', icon: 'bi-person-badge' },
      { id: 'hq-clients', label: '내담자 관리', path: '/admin/client-comprehensive', icon: 'bi-person-check' },
      { id: 'hq-accounts', label: '계좌 관리', path: '/admin/accounts', icon: 'bi-bank' }
    ],
    system: [
      { id: 'hq-codes', label: '공통코드 관리', path: '/admin/common-codes', icon: 'bi-code' },
      { id: 'hq-system', label: '시스템 도구', path: '/admin/system', icon: 'bi-tools' },
      { id: 'hq-logs', label: '시스템 로그', path: '/admin/logs', icon: 'bi-file-text' }
    ],
    branches: [
      { id: 'hq-branch-list', label: '지점 목록', path: '/admin/branches', icon: 'bi-list' },
      { id: 'hq-branch-create', label: '지점 등록', path: '/admin/branches/create', icon: 'bi-plus-circle' },
      { id: 'hq-branch-managers', label: '지점장 관리', path: '/admin/branch-managers', icon: 'bi-person-badge' }
    ]
  }
};

// 수퍼 본사 관리자 메뉴
export const SUPER_HQ_ADMIN_MENU_ITEMS = {
  MAIN: {
    ADMIN: {
      id: 'admin',
      label: '본사 관리',
      icon: 'bi-building'
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
    },
    BRANCHES: {
      id: 'branches',
      label: '지점 관리',
      icon: 'bi-shop'
    },
    // FINANCE는 ERP로 통합되어 제거됨
    ERP: {
      id: 'erp',
      label: 'ERP 관리',
      icon: 'bi-box-seam'
    }
  },
  SUB: {
    admin: [
      { id: 'super-hq-dashboard', label: '본사 대시보드', path: '/super_admin/dashboard', icon: 'bi-speedometer2' },
      { id: 'super-hq-statistics', label: '통계 보기', path: '/admin/statistics', icon: 'bi-graph-up' },
      { id: 'super-hq-schedules', label: '전체 스케줄', path: '/admin/schedules', icon: 'bi-calendar-check' }
    ],
    users: [
      { id: 'super-hq-consultants', label: '상담사 관리', path: '/admin/consultant-comprehensive', icon: 'bi-person-badge' },
      { id: 'super-hq-clients', label: '내담자 관리', path: '/admin/client-comprehensive', icon: 'bi-person-check' },
      { id: 'super-hq-accounts', label: '계좌 관리', path: '/admin/accounts', icon: 'bi-bank' },
      { id: 'super-hq-admins', label: '관리자 관리', path: '/super_admin/admin-management', icon: 'bi-shield-check' }
    ],
    system: [
      { id: 'super-hq-codes', label: '공통코드 관리', path: '/admin/common-codes', icon: 'bi-code' },
      { id: 'super-hq-system', label: '시스템 도구', path: '/admin/system', icon: 'bi-tools' },
      { id: 'super-hq-logs', label: '시스템 로그', path: '/admin/logs', icon: 'bi-file-text' },
      { id: 'super-hq-integration-test', label: '통합 테스트', path: '/test/integration', icon: 'bi-check-circle' }
    ],
    branches: [
      { id: 'super-hq-branch-list', label: '지점 목록', path: '/admin/branches', icon: 'bi-list' },
      { id: 'super-hq-branch-create', label: '지점 등록', path: '/admin/branches/create', icon: 'bi-plus-circle' },
      { id: 'super-hq-branch-managers', label: '지점장 관리', path: '/admin/branch-managers', icon: 'bi-person-badge' },
      { id: 'super-hq-branch-hierarchy', label: '지점 계층 관리', path: '/admin/branch-hierarchy', icon: 'bi-diagram-3' }
    ],
    // finance 메뉴는 ERP로 통합되어 제거됨
    erp: [
      { id: 'super-hq-erp-dashboard', label: 'ERP 대시보드', path: '/erp/dashboard', icon: 'bi-speedometer2' },
      { id: 'super-hq-purchase-requests', label: '구매 요청', path: '/erp/purchase-requests', icon: 'bi-cart-plus' },
      { id: 'super-hq-approvals', label: '관리자 승인', path: '/erp/approvals', icon: 'bi-check-circle' },
      { id: 'super-hq-super-approvals', label: '수퍼 관리자 승인', path: '/erp/super-approvals', icon: 'bi-shield-check' },
      { id: 'super-hq-items', label: '아이템 관리', path: '/erp/items', icon: 'bi-box' },
      { id: 'super-hq-budgets', label: '예산 관리', path: '/erp/budgets', icon: 'bi-wallet2' }
    ]
  }
};

// 지점 수퍼 관리자 메뉴
export const BRANCH_BRANCH_SUPER_ADMIN_MENU_ITEMS = {
  MAIN: {
    ADMIN: {
      id: 'admin',
      label: '지점 관리',
      icon: 'bi-gear'
    },
    USERS: {
      id: 'users',
      label: '사용자 관리',
      icon: 'bi-people'
    },
    // FINANCE는 ERP로 통합되어 제거됨
    ERP: {
      id: 'erp',
      label: 'ERP 관리',
      icon: 'bi-box-seam'
    }
  },
  SUB: {
    admin: [
      { id: 'branch-dashboard', label: '지점 대시보드', path: '/super_admin/dashboard', icon: 'bi-speedometer2' },
      { id: 'branch-statistics', label: '통계 보기', path: '/admin/statistics', icon: 'bi-graph-up' },
      { id: 'branch-schedules', label: '전체 스케줄', path: '/admin/schedules', icon: 'bi-calendar-check' }
    ],
    users: [
      { id: 'branch-consultants', label: '상담사 관리', path: '/admin/consultant-comprehensive', icon: 'bi-person-badge' },
      { id: 'branch-clients', label: '내담자 관리', path: '/admin/client-comprehensive', icon: 'bi-person-check' },
      { id: 'branch-accounts', label: '계좌 관리', path: '/admin/accounts', icon: 'bi-bank' }
    ],
    // finance 메뉴는 ERP로 통합되어 제거됨
    erp: [
      { id: 'branch-erp-dashboard', label: 'ERP 대시보드', path: '/erp/dashboard', icon: 'bi-speedometer2' },
      { id: 'branch-purchase-requests', label: '구매 요청', path: '/erp/purchase-requests', icon: 'bi-cart-plus' },
      { id: 'branch-approvals', label: '관리자 승인', path: '/erp/approvals', icon: 'bi-check-circle' },
      { id: 'branch-items', label: '아이템 관리', path: '/erp/items', icon: 'bi-box' }
    ]
  }
};

// 지점장 메뉴
export const BRANCH_MANAGER_MENU_ITEMS = {
  MAIN: {
    ADMIN: {
      id: 'admin',
      label: '지점 관리',
      icon: 'bi-gear'
    },
    USERS: {
      id: 'users',
      label: '사용자 관리',
      icon: 'bi-people'
    }
  },
  SUB: {
    admin: [
      { id: 'manager-dashboard', label: '지점 대시보드', path: '/admin/dashboard', icon: 'bi-speedometer2' },
      { id: 'manager-statistics', label: '통계 보기', path: '/admin/statistics', icon: 'bi-graph-up' },
      { id: 'manager-schedules', label: '전체 스케줄', path: '/admin/schedules', icon: 'bi-calendar-check' }
    ],
    users: [
      { id: 'manager-consultants', label: '상담사 관리', path: '/admin/consultant-comprehensive', icon: 'bi-person-badge' },
      { id: 'manager-clients', label: '내담자 관리', path: '/admin/client-comprehensive', icon: 'bi-person-check' }
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

// 사용자 역할 상수
export const ROLES = {
  HQ_ADMIN: 'HQ_ADMIN',
  SUPER_HQ_ADMIN: 'SUPER_HQ_ADMIN',
  BRANCH_SUPER_ADMIN: 'BRANCH_SUPER_ADMIN',
  ADMIN: 'ADMIN',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  CONSULTANT: 'CONSULTANT',
  CLIENT: 'CLIENT',
  HQ_MASTER: 'HQ_MASTER',
  HQ_SUPER_ADMIN: 'HQ_SUPER_ADMIN'
};

// 메뉴 타입 상수
export const MENU_TYPES = {
  MAIN: 'main',
  SUB: 'sub'
};
