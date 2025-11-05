/**
 * 네비게이션 라우트 및 화면 이름 상수
 * 모든 화면 이름을 한 곳에서 관리하여 하드코딩 방지 constants/navigation.js
 */

// Client 탭 네비게이터 화면 이름
export const CLIENT_SCREENS = {
  DASHBOARD: 'Dashboard',
  SCHEDULE: 'Schedule',
  MESSAGES: 'Messages',
  MESSAGE_DETAIL: 'MessageDetail',
  PAYMENT: 'Payment',
  SETTINGS: 'Settings',
};

// Consultant 탭 네비게이터 화면 이름 (Phase 4에서 추가 예정)
export const CONSULTANT_SCREENS = {
  DASHBOARD: 'Dashboard',
  SCHEDULE: 'Schedule',
  SCHEDULE_CREATE: 'ScheduleCreate',
  MESSAGES: 'Messages',
  MESSAGE_DETAIL: 'MessageDetailConsultant',
  RECORDS: 'Records',
  RECORD_DETAIL: 'RecordDetail',
  CLIENT_MANAGEMENT: 'ClientManagement',
  STATISTICS: 'Statistics',
  SETTINGS: 'Settings',
};

// Admin 탭 네비게이터 화면 이름 (Phase 5에서 추가 예정)
export const ADMIN_SCREENS = {
  DASHBOARD: 'Dashboard',
  USER_MANAGEMENT: 'UserManagement',
  CONSULTANT_MANAGEMENT: 'ConsultantManagement',
  CLIENT_MANAGEMENT: 'ClientManagement',
  MAPPING_MANAGEMENT: 'MappingManagement',
  SESSION_MANAGEMENT: 'SessionManagement',
  STATISTICS: 'Statistics',
  ERP: 'Erp',
  FINANCIAL: 'Financial',
  SALARY: 'Salary',
  MESSAGES: 'Messages',
};

// HQ 탭 네비게이터 화면 이름 (Phase 6에서 추가 예정)
export const HQ_SCREENS = {
  DASHBOARD: 'Dashboard',
  BRANCH_MANAGEMENT: 'BranchManagement',
};

// 설정 관련 화면 이름
export const SETTINGS_SCREENS = {
  NOTIFICATION_SETTINGS: 'NotificationSettings',
  NOTIFICATION_HISTORY: 'NotificationHistory',
  PROFILE_PHOTO: 'ProfilePhoto',
};

// Stack 네비게이터 화면 이름
export const STACK_SCREENS = {
  LOGIN: 'Login',
  CLIENT_TABS: 'ClientTabs',
  CONSULTANT_TABS: 'ConsultantTabs',
  ADMIN_TABS: 'AdminTabs',
  HQ_TABS: 'HqTabs',
  AUTH_STACK: 'AuthStack',
};

export const AUTH_SCREENS = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
};

// 전체 화면 이름 객체
export const SCREENS = {
  CLIENT: CLIENT_SCREENS,
  CONSULTANT: CONSULTANT_SCREENS,
  ADMIN: ADMIN_SCREENS,
  HQ: HQ_SCREENS,
  STACK: STACK_SCREENS,
};

export default SCREENS;
