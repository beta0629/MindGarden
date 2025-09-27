/**
 * 스케줄 관련 상수 정의 (간소화된 버전)
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-09-16
 */

// ==================== 간소화된 스케줄 상태 ====================
export const STATUS = {
  AVAILABLE: 'AVAILABLE',     // 가능
  BOOKED: 'BOOKED',           // 예약됨
  CONFIRMED: 'CONFIRMED',     // 확정됨
  VACATION: 'VACATION',       // 휴가
  COMPLETED: 'COMPLETED',     // 완료
  CANCELLED: 'CANCELLED'      // 취소됨
};

// ==================== 스케줄 상태 라벨 ====================
export const STATUS_LABELS = {
  [STATUS.AVAILABLE]: '가능',
  [STATUS.BOOKED]: '예약됨',
  [STATUS.CONFIRMED]: '확정됨',
  [STATUS.VACATION]: '휴가',
  [STATUS.COMPLETED]: '완료',
  [STATUS.CANCELLED]: '취소됨'
};

// ==================== 스케줄 상태 색상 ====================
export const STATUS_COLORS = {
  [STATUS.AVAILABLE]: '#28a745',    // 초록색
  [STATUS.BOOKED]: '#007bff',       // 파란색
  [STATUS.CONFIRMED]: '#17a2b8',    // 청록색
  [STATUS.VACATION]: '#ffc107',     // 노란색
  [STATUS.COMPLETED]: '#b8b8b8',    // 연한 회색 (완료된 상태)
  [STATUS.CANCELLED]: '#dc3545'     // 빨간색
};

// ==================== 스케줄 상태 아이콘 ====================
export const STATUS_ICONS = {
  [STATUS.AVAILABLE]: '✅',
  [STATUS.BOOKED]: '📅',
  [STATUS.CONFIRMED]: '✅',
  [STATUS.VACATION]: '🏖️',
  [STATUS.COMPLETED]: '✅',
  [STATUS.CANCELLED]: '❌'
};

// ==================== 스케줄 상태 텍스트 색상 ====================
export const STATUS_TEXT_COLORS = {
  [STATUS.AVAILABLE]: '#ffffff',
  [STATUS.BOOKED]: '#ffffff',
  [STATUS.CONFIRMED]: '#ffffff',
  [STATUS.VACATION]: '#ffffff',
  [STATUS.COMPLETED]: '#ffffff',
  [STATUS.CANCELLED]: '#ffffff'
};

// ==================== 스케줄 타입 ====================
export const SCHEDULE_TYPES = {
  CONSULTATION: 'CONSULTATION',
  MEETING: 'MEETING',
  TRAINING: 'TRAINING',
  OTHER: 'OTHER'
};

// ==================== 스케줄 타입 라벨 ====================
export const SCHEDULE_TYPE_LABELS = {
  [SCHEDULE_TYPES.CONSULTATION]: '상담',
  [SCHEDULE_TYPES.MEETING]: '회의',
  [SCHEDULE_TYPES.TRAINING]: '교육',
  [SCHEDULE_TYPES.OTHER]: '기타'
};

// ==================== 상담 유형 ====================
export const CONSULTATION_TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILY: 'FAMILY',
  COUPLE: 'COUPLE',
  GROUP: 'GROUP',
  OTHER: 'OTHER'
};

// ==================== 상담 유형 라벨 ====================
export const CONSULTATION_TYPE_LABELS = {
  [CONSULTATION_TYPES.INDIVIDUAL]: '개인상담',
  [CONSULTATION_TYPES.FAMILY]: '가족상담',
  [CONSULTATION_TYPES.COUPLE]: '부부상담',
  [CONSULTATION_TYPES.GROUP]: '그룹상담',
  [CONSULTATION_TYPES.OTHER]: '기타'
};

// ==================== 정렬 옵션 ====================
export const SORT_OPTIONS = {
  DATE_ASC: 'date_asc',
  DATE_DESC: 'date_desc',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc',
  STATUS_ASC: 'status_asc',
  STATUS_DESC: 'status_desc',
  CONSULTANT_ASC: 'consultant_asc',
  CONSULTANT_DESC: 'consultant_desc'
};

// ==================== 정렬 옵션 라벨 ====================
export const SORT_OPTION_LABELS = {
  [SORT_OPTIONS.DATE_ASC]: '날짜 (오름차순)',
  [SORT_OPTIONS.DATE_DESC]: '날짜 (내림차순)',
  [SORT_OPTIONS.TITLE_ASC]: '제목 (오름차순)',
  [SORT_OPTIONS.TITLE_DESC]: '제목 (내림차순)',
  [SORT_OPTIONS.STATUS_ASC]: '상태 (오름차순)',
  [SORT_OPTIONS.STATUS_DESC]: '상태 (내림차순)',
  [SORT_OPTIONS.CONSULTANT_ASC]: '상담사 (오름차순)',
  [SORT_OPTIONS.CONSULTANT_DESC]: '상담사 (내림차순)'
};

// ==================== 필터 옵션 ====================
export const FILTER_OPTIONS = {
  ALL: 'all',
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  AVAILABLE: 'available',
  BOOKED: 'booked',
  CONFIRMED: 'confirmed',
  VACATION: 'vacation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// ==================== 필터 옵션 라벨 ====================
export const FILTER_OPTION_LABELS = {
  [FILTER_OPTIONS.ALL]: '전체',
  [FILTER_OPTIONS.TODAY]: '오늘',
  [FILTER_OPTIONS.THIS_WEEK]: '이번 주',
  [FILTER_OPTIONS.THIS_MONTH]: '이번 달',
  [FILTER_OPTIONS.AVAILABLE]: '가능',
  [FILTER_OPTIONS.BOOKED]: '예약됨',
  [FILTER_OPTIONS.CONFIRMED]: '확정됨',
  [FILTER_OPTIONS.VACATION]: '휴가',
  [FILTER_OPTIONS.COMPLETED]: '완료',
  [FILTER_OPTIONS.CANCELLED]: '취소됨'
};

// ==================== 페이지네이션 ====================
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_VISIBLE_PAGES: 5
};

// ==================== 페이지네이션 라벨 ====================
export const PAGINATION_LABELS = {
  FIRST: '처음',
  PREVIOUS: '이전',
  NEXT: '다음',
  LAST: '마지막',
  PAGE_SIZE: '페이지당 항목 수',
  OF: '중',
  TOTAL: '총'
};

// ==================== 스케줄 액션 ====================
export const SCHEDULE_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  BOOK: 'book',
  CANCEL: 'cancel',
  COMPLETE: 'complete'
};

// ==================== 스케줄 액션 라벨 ====================
export const SCHEDULE_ACTION_LABELS = {
  [SCHEDULE_ACTIONS.VIEW]: '보기',
  [SCHEDULE_ACTIONS.EDIT]: '수정',
  [SCHEDULE_ACTIONS.DELETE]: '삭제',
  [SCHEDULE_ACTIONS.BOOK]: '예약',
  [SCHEDULE_ACTIONS.CANCEL]: '취소',
  [SCHEDULE_ACTIONS.COMPLETE]: '완료'
};

// ==================== 스케줄 액션 아이콘 ====================
export const SCHEDULE_ACTION_ICONS = {
  [SCHEDULE_ACTIONS.VIEW]: 'bi-eye',
  [SCHEDULE_ACTIONS.EDIT]: 'bi-pencil',
  [SCHEDULE_ACTIONS.DELETE]: 'bi-trash',
  [SCHEDULE_ACTIONS.BOOK]: 'bi-calendar-plus',
  [SCHEDULE_ACTIONS.CANCEL]: 'bi-x-circle',
  [SCHEDULE_ACTIONS.COMPLETE]: 'bi-check2-circle'
};

// ==================== 스케줄 로딩 상태 ====================
export const SCHEDULE_LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// ==================== 스케줄 에러 메시지 ====================
export const SCHEDULE_ERROR_MESSAGES = {
  LOAD_FAILED: '스케줄을 불러오는데 실패했습니다.',
  SAVE_FAILED: '스케줄 저장에 실패했습니다.',
  DELETE_FAILED: '스케줄 삭제에 실패했습니다.',
  UPDATE_FAILED: '스케줄 수정에 실패했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNAUTHORIZED: '권한이 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.'
};

// ==================== 스케줄 성공 메시지 ====================
export const SCHEDULE_SUCCESS_MESSAGES = {
  LOAD_SUCCESS: '스케줄이 성공적으로 로드되었습니다.',
  SAVE_SUCCESS: '스케줄이 성공적으로 저장되었습니다.',
  DELETE_SUCCESS: '스케줄이 성공적으로 삭제되었습니다.',
  UPDATE_SUCCESS: '스케줄이 성공적으로 수정되었습니다.',
  BOOK_SUCCESS: '스케줄이 예약되었습니다.',
  CANCEL_SUCCESS: '스케줄이 취소되었습니다.',
  COMPLETE_SUCCESS: '스케줄이 완료되었습니다.'
};

// ==================== 날짜 형식 ====================
export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm',
  FULL: 'YYYY년 MM월 DD일 HH:mm'
};

// ==================== 시간 형식 ====================
export const TIME_FORMATS = {
  DISPLAY: 'HH:mm',
  API: 'HH:mm:ss',
  FULL: 'HH시 mm분'
};

// ==================== 상담 시간 관련 상수 ====================
export const CONSULTATION_DURATIONS = {
  THIRTY_MINUTES: 30,
  FORTY_FIVE_MINUTES: 45,
  SIXTY_MINUTES: 60,
  NINETY_MINUTES: 90,
  ONE_HUNDRED_TWENTY_MINUTES: 120
};

export const CONSULTATION_DURATION_LABELS = {
  [CONSULTATION_DURATIONS.THIRTY_MINUTES]: '30분',
  [CONSULTATION_DURATIONS.FORTY_FIVE_MINUTES]: '45분',
  [CONSULTATION_DURATIONS.SIXTY_MINUTES]: '60분',
  [CONSULTATION_DURATIONS.NINETY_MINUTES]: '90분',
  [CONSULTATION_DURATIONS.ONE_HUNDRED_TWENTY_MINUTES]: '120분'
};

export const DEFAULT_CONSULTATION_DURATION = CONSULTATION_DURATIONS.SIXTY_MINUTES;

export const BREAK_TIME_MINUTES = 10;

// ==================== 영업 시간 (동적 로딩) ====================
// 실제 값은 businessTimeUtils.js에서 동적으로 로딩됩니다
export const BUSINESS_HOURS = {
  START: '10:00',  // 기본값, 실제로는 서버에서 로딩
  END: '20:00',    // 기본값, 실제로는 서버에서 로딩
  LUNCH_START: '12:00',  // 기본값, 실제로는 서버에서 로딩
  LUNCH_END: '13:00'     // 기본값, 실제로는 서버에서 로딩
};

export const BUSINESS_HOURS_DISPLAY = {
  START: '10:00',  // 기본값, 실제로는 서버에서 로딩
  END: '20:00',    // 기본값, 실제로는 서버에서 로딩
  LUNCH: '12:00 - 13:00'  // 기본값, 실제로는 서버에서 로딩
};

// ==================== 시간 슬롯 관련 ====================
export const TIME_SLOT_INTERVAL = 30; // 30분 간격
export const TIME_SLOT_DURATION = 30; // 30분 슬롯

// ==================== 상담 시간 유효성 검사 ====================
export const MIN_CONSULTATION_DURATION = 30; // 최소 30분
export const MAX_CONSULTATION_DURATION = 180; // 최대 3시간
export const MAX_ADVANCE_BOOKING_DAYS = 30; // 최대 30일 후까지 예약 가능