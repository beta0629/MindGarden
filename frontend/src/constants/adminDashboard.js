/**
 * AdminDashboard 컴포넌트 상수 정의
 * 개발 가이드 준수 - 상수화 필수 원칙
 */

// ===== API 엔드포인트 =====
export const API_ENDPOINTS = {
  // 통계 API (실제 존재하는 엔드포인트)
  OVERALL_STATISTICS: '/api/admin/statistics/overall',
  TREND_STATISTICS: '/api/admin/statistics/trends',
  SESSION_STATISTICS: '/api/admin/sessions/statistics',
  
  // 시스템 API (실제 존재하는 엔드포인트)
  SYSTEM_STATUS: '/api/admin/statistics-management/plsql/status',
  SYSTEM_TOOLS: '/api/admin/system-tools',
  
  // ERP API
  ERP_REPORT: '/api/erp/reports',
  
  // 성능 지표 API
  PERFORMANCE_METRICS: '/api/admin/statistics/performance',
  
  // 전문분야 관리 API
  SPECIALTY_MANAGEMENT: '/api/admin/consultants/specialties',
  
  // 재발 지출 API
  RECURRING_EXPENSES: '/api/admin/finance/recurring-expenses',
  
  // 권한 관리 API
  PERMISSIONS: '/api/admin/permissions',
  USER_PERMISSIONS: '/api/admin/users/{id}/permissions'
};

// ===== UI 텍스트 =====
export const UI_TEXT = {
  TITLE: '관리자 대시보드',
  SUBTITLE: '시스템 현황 및 관리 기능을 확인하세요',
  
  // 섹션 제목
  TODAY_STATISTICS: '오늘의 통계',
  SYSTEM_STATUS: '시스템 상태',
  SYSTEM_TOOLS: '시스템 도구',
  CONSULTATION_STATS: '상담 완료 통계',
  VACATION_STATS: '휴가 통계',
  CONSULTANT_RATING_STATS: '상담사 평점 통계',
  PERMISSION_MANAGEMENT: '권한 관리',
  
  // 버튼 텍스트
  REFRESH: '새로고침',
  EXPORT: '내보내기',
  VIEW_DETAILS: '상세보기',
  MANAGE: '관리',
  
  // 모달 제목
  ERP_REPORT_MODAL: 'ERP 보고서',
  PERFORMANCE_MODAL: '성능 지표',
  SPECIALTY_MODAL: '전문분야 관리',
  RECURRING_EXPENSE_MODAL: '재발 지출 관리',
  
  // 메시지
  LOADING: '데이터를 불러오는 중...',
  NO_DATA: '표시할 데이터가 없습니다.',
  REFRESH_SUCCESS: '데이터가 새로고침되었습니다.',
  EXPORT_SUCCESS: '데이터가 내보내기되었습니다.'
};

// ===== 상태 표시 =====
export const STATUS_DISPLAY = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  PENDING: '대기',
  COMPLETED: '완료',
  ERROR: '오류',
  WARNING: '경고',
  SUCCESS: '성공'
};

// ===== 상태 설명 =====
export const STATUS_DESCRIPTION = {
  ACTIVE: '정상 작동 중',
  INACTIVE: '작동 중지',
  PENDING: '처리 대기 중',
  COMPLETED: '처리 완료',
  ERROR: '오류 발생',
  WARNING: '주의 필요',
  SUCCESS: '성공적으로 완료'
};

// ===== 버튼 텍스트 =====
export const BUTTON_TEXT = {
  REFRESH: '새로고침',
  EXPORT: '내보내기',
  VIEW_DETAILS: '상세보기',
  MANAGE: '관리',
  CLOSE: '닫기',
  SAVE: '저장',
  CANCEL: '취소',
  CONFIRM: '확인',
  DELETE: '삭제',
  EDIT: '편집',
  ADD: '추가',
  SEARCH: '검색',
  FILTER: '필터',
  SORT: '정렬',
  RESET: '초기화'
};

// ===== CSS 클래스 (BEM 네이밍) =====
export const CSS_CLASSES = {
  // 컨테이너
  CONTAINER: 'admin-dashboard',
  HEADER: 'admin-dashboard__header',
  CONTENT: 'admin-dashboard__content',
  SIDEBAR: 'admin-dashboard__sidebar',
  MAIN_PANEL: 'admin-dashboard__main-panel',
  
  // 통계 카드
  STATS_GRID: 'admin-dashboard__stats-grid',
  STAT_CARD: 'admin-dashboard__stat-card',
  STAT_CARD_HEADER: 'admin-dashboard__stat-card-header',
  STAT_CARD_BODY: 'admin-dashboard__stat-card-body',
  STAT_CARD_FOOTER: 'admin-dashboard__stat-card-footer',
  
  // 섹션
  SECTION: 'admin-dashboard__section',
  SECTION_HEADER: 'admin-dashboard__section-header',
  SECTION_TITLE: 'admin-dashboard__section-title',
  SECTION_CONTENT: 'admin-dashboard__section-content',
  
  // 버튼
  BUTTON: 'admin-dashboard__button',
  BUTTON_PRIMARY: 'admin-dashboard__button--primary',
  BUTTON_SECONDARY: 'admin-dashboard__button--secondary',
  BUTTON_SUCCESS: 'admin-dashboard__button--success',
  BUTTON_WARNING: 'admin-dashboard__button--warning',
  BUTTON_DANGER: 'admin-dashboard__button--danger',
  BUTTON_INFO: 'admin-dashboard__button--info',
  BUTTON_GROUP: 'admin-dashboard__button-group',
  
  // 상태 표시
  STATUS: 'admin-dashboard__status',
  STATUS_ACTIVE: 'admin-dashboard__status--active',
  STATUS_INACTIVE: 'admin-dashboard__status--inactive',
  STATUS_PENDING: 'admin-dashboard__status--pending',
  STATUS_COMPLETED: 'admin-dashboard__status--completed',
  STATUS_ERROR: 'admin-dashboard__status--error',
  STATUS_WARNING: 'admin-dashboard__status--warning',
  STATUS_SUCCESS: 'admin-dashboard__status--success',
  
  // 모달
  MODAL_OVERLAY: 'admin-dashboard__modal-overlay',
  MODAL_CONTENT: 'admin-dashboard__modal-content',
  MODAL_HEADER: 'admin-dashboard__modal-header',
  MODAL_BODY: 'admin-dashboard__modal-body',
  MODAL_FOOTER: 'admin-dashboard__modal-footer',
  
  // 로딩
  LOADING_OVERLAY: 'admin-dashboard__loading-overlay',
  LOADING_SPINNER: 'admin-dashboard__loading-spinner',
  
  // 반응형
  RESPONSIVE_GRID: 'admin-dashboard__responsive-grid',
  MOBILE_LAYOUT: 'admin-dashboard__mobile-layout',
  TABLET_LAYOUT: 'admin-dashboard__tablet-layout',
  DESKTOP_LAYOUT: 'admin-dashboard__desktop-layout'
};

// ===== 색상 =====
export const COLORS = {
  PRIMARY: '#007aff',
  SECONDARY: '#5856d6',
  SUCCESS: '#34c759',
  WARNING: '#ff9500',
  DANGER: '#ff3b30',
  INFO: '#5ac8fa',
  LIGHT: '#f2f2f7',
  DARK: '#1c1c1e',
  
  // 텍스트 색상
  TEXT_PRIMARY: '#1d1d1f',
  TEXT_SECONDARY: '#86868b',
  TEXT_TERTIARY: '#c7c7cc',
  
  // 배경 색상
  BG_PRIMARY: '#ffffff',
  BG_SECONDARY: '#f2f2f7',
  BG_TERTIARY: '#e5e5ea'
};

// ===== 간격 =====
export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px'
};

// ===== 폰트 크기 =====
export const FONT_SIZES = {
  XS: '12px',
  SM: '14px',
  BASE: '16px',
  LG: '18px',
  XL: '20px',
  XXL: '24px',
  XXXL: '32px'
};

// ===== 아이콘 =====
export const ICONS = {
  USERS: 'FaUsers',
  USER_TIE: 'FaUserTie',
  LINK: 'FaLink',
  CALENDAR: 'FaCalendarAlt',
  CALENDAR_CHECK: 'FaCalendarCheck',
  COG: 'FaCog',
  DOLLAR_SIGN: 'FaDollarSign',
  CHART_LINE: 'FaChartLine',
  CREDIT_CARD: 'FaCreditCard',
  RECEIPT: 'FaReceipt',
  FILE_ALT: 'FaFileAlt',
  COGS: 'FaCogs',
  BOX: 'FaBox',
  SHOPPING_CART: 'FaShoppingCart',
  CHECK_CIRCLE: 'FaCheckCircle',
  WALLET: 'FaWallet',
  TRUCK: 'FaTruck',
  SYNC_ALT: 'FaSyncAlt',
  EXCLAMATION_TRIANGLE: 'FaExclamationTriangle',
  BUILDING: 'FaBuilding',
  MAP_MARKER_ALT: 'FaMapMarkerAlt',
  USER_COG: 'FaUserCog',
  TOGGLE_ON: 'FaToggleOn',
  TOGGLE_OFF: 'FaToggleOff',
  COMPRESS_ALT: 'FaCompressAlt',
  CLOCK: 'FaClock',
  CHART_BAR: 'FaChartBar',
  USER_GRADUATE: 'FaUserGraduate',
  REDO: 'FaRedo',
  FILE_EXPORT: 'FaFileExport'
};

// ===== Z-Index =====
export const Z_INDEX = {
  MODAL: 1050,
  DROPDOWN: 1040,
  TOOLTIP: 1030,
  POPOVER: 1020,
  HEADER: 1010,
  SIDEBAR: 1000
};

// ===== 기본값 =====
export const DEFAULTS = {
  REFRESH_INTERVAL: 30000, // 30초
  PAGE_SIZE: 20,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500
};

// ===== 에러 메시지 =====
export const ERROR_MESSAGES = {
  FETCH_FAILED: '데이터를 불러오는 중 오류가 발생했습니다.',
  SAVE_FAILED: '저장 중 오류가 발생했습니다.',
  DELETE_FAILED: '삭제 중 오류가 발생했습니다.',
  EXPORT_FAILED: '내보내기 중 오류가 발생했습니다.',
  PERMISSION_DENIED: '권한이 없습니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력값을 확인해주세요.'
};

// ===== 성공 메시지 =====
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: '성공적으로 저장되었습니다.',
  DELETE_SUCCESS: '성공적으로 삭제되었습니다.',
  EXPORT_SUCCESS: '성공적으로 내보내기되었습니다.',
  REFRESH_SUCCESS: '데이터가 새로고침되었습니다.',
  UPDATE_SUCCESS: '성공적으로 업데이트되었습니다.'
};
