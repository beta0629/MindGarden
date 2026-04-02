/**
 * 스케줄 관련 상수 정의 (간소화된 버전)
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-09-16
 */

export const STATUS = {
  AVAILABLE: 'AVAILABLE',     // 가능
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  BOOKED: 'BOOKED',           // 예약됨
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CONFIRMED: 'CONFIRMED',     // 확정됨
  VACATION: 'VACATION',       // 휴가
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  COMPLETED: 'COMPLETED',     // 완료
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CANCELLED: 'CANCELLED'      // 취소됨
};

export const STATUS_LABELS = {
  [STATUS.AVAILABLE]: '가능',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.BOOKED]: '예약됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CONFIRMED]: '확정됨',
  [STATUS.VACATION]: '휴가',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.COMPLETED]: '완료',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CANCELLED]: '취소됨'
};

export const STATUS_COLORS = {
  [STATUS.AVAILABLE]: 'var(--mg-success-500)',    // 초록색
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.BOOKED]: 'var(--mg-primary-500)',       // 파란색
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CONFIRMED]: 'var(--mg-info-500)',    // 청록색
  [STATUS.VACATION]: 'var(--mg-warning-500)',     // 노란색
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.COMPLETED]: '#b8b8b8',    // 연한 회색 (완료된 상태)
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CANCELLED]: 'var(--mg-error-500)'     // 빨간색
};

export const STATUS_ICONS = {
  [STATUS.AVAILABLE]: '✅',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.BOOKED]: '📅',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CONFIRMED]: '✅',
  [STATUS.VACATION]: '🏖️',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.COMPLETED]: '✅',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CANCELLED]: '❌'
};

export const STATUS_TEXT_COLORS = {
  [STATUS.AVAILABLE]: 'var(--mg-white)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.BOOKED]: 'var(--mg-white)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CONFIRMED]: 'var(--mg-white)',
  [STATUS.VACATION]: 'var(--mg-white)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.COMPLETED]: 'var(--mg-white)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [STATUS.CANCELLED]: 'var(--mg-white)'
};

/** 시간 슬롯 충돌 검사에 포함할 스케줄 상태(백엔드 ScheduleStatus·JPQL 점유 집합과 정합, 레거시 IN_PROGRESS 포함) */
export const SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT = new Set([
  STATUS.BOOKED,
  STATUS.CONFIRMED,
  'IN_PROGRESS'
]);

export function isScheduleStatusOccupyingTimeSlotForConflict(status) {
  if (status == null || status === '') {
    return false;
  }
  return SCHEDULE_STATUSES_OCCUPYING_TIME_SLOT_FOR_CONFLICT.has(String(status).toUpperCase());
}

/**
 * API Schedule / DTO에서 충돌·표시용 상태 코드를 맞춤 (statusCode 우선, 한글 라벨·레거시 호환).
 * @param {object} schedule
 * @returns {string|null} 대문자 코드 또는 null
 */
export function resolveScheduleStatusCodeForConflict(schedule) {
  if (!schedule) {
    return null;
  }
  if (schedule.isDeleted === true || schedule.deletedAt) {
    return null;
  }
  const codeRaw =
    schedule.statusCode != null && String(schedule.statusCode).trim() !== ''
      ? String(schedule.statusCode).trim()
      : null;
  if (codeRaw) {
    return codeRaw.toUpperCase();
  }
  const st = schedule.status;
  if (st == null || st === '') {
    return null;
  }
  if (typeof st === 'string') {
    const s = st.trim();
    const upper = s.toUpperCase();
    const known = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'VACATION', 'AVAILABLE', 'IN_PROGRESS'];
    if (known.includes(upper)) {
      return upper;
    }
    if (/취소|취소됨/.test(s)) {
      return STATUS.CANCELLED;
    }
    if (/예약됨|예약/.test(s)) {
      return STATUS.BOOKED;
    }
    if (/완료|완료됨/.test(s)) {
      return STATUS.COMPLETED;
    }
    if (/확정|확정됨/.test(s)) {
      return STATUS.CONFIRMED;
    }
    if (/휴가/.test(s)) {
      return STATUS.VACATION;
    }
    if (/가능/.test(s)) {
      return STATUS.AVAILABLE;
    }
    return upper;
  }
  return String(st).toUpperCase();
}

/** 기존 스케줄 안내 영역에 표시할지 (취소·완료는 예약 슬롯 점유 안내에서 제외) */
export function isScheduleShownInExistingBookingsList(schedule) {
  const code = resolveScheduleStatusCodeForConflict(schedule);
  if (!code) {
    return false;
  }
  if (code === STATUS.CANCELLED || code === STATUS.COMPLETED || code === STATUS.AVAILABLE) {
    return false;
  }
  return true;
}

export const SCHEDULE_TYPES = {
  CONSULTATION: 'CONSULTATION',
  MEETING: 'MEETING',
  TRAINING: 'TRAINING',
  OTHER: 'OTHER'
};

export const SCHEDULE_TYPE_LABELS = {
  [SCHEDULE_TYPES.CONSULTATION]: '상담',
  [SCHEDULE_TYPES.MEETING]: '회의',
  [SCHEDULE_TYPES.TRAINING]: '교육',
  [SCHEDULE_TYPES.OTHER]: '기타'
};

export const CONSULTATION_TYPES = {
  INDIVIDUAL: 'INDIVIDUAL',
  FAMILY: 'FAMILY',
  COUPLE: 'COUPLE',
  GROUP: 'GROUP',
  OTHER: 'OTHER'
};

export const CONSULTATION_TYPE_LABELS = {
  [CONSULTATION_TYPES.INDIVIDUAL]: '개인상담',
  [CONSULTATION_TYPES.FAMILY]: '가족상담',
  [CONSULTATION_TYPES.COUPLE]: '부부상담',
  [CONSULTATION_TYPES.GROUP]: '그룹상담',
  [CONSULTATION_TYPES.OTHER]: '기타'
};

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

export const FILTER_OPTIONS = {
  ALL: 'all',
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  AVAILABLE: 'available',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  BOOKED: 'booked',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CONFIRMED: 'confirmed',
  VACATION: 'vacation',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  COMPLETED: 'completed',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  CANCELLED: 'cancelled'
};

export const FILTER_OPTION_LABELS = {
  [FILTER_OPTIONS.ALL]: '전체',
  [FILTER_OPTIONS.TODAY]: '오늘',
  [FILTER_OPTIONS.THIS_WEEK]: '이번 주',
  [FILTER_OPTIONS.THIS_MONTH]: '이번 달',
  [FILTER_OPTIONS.AVAILABLE]: '가능',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [FILTER_OPTIONS.BOOKED]: '예약됨',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [FILTER_OPTIONS.CONFIRMED]: '확정됨',
  [FILTER_OPTIONS.VACATION]: '휴가',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [FILTER_OPTIONS.COMPLETED]: '완료',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  [FILTER_OPTIONS.CANCELLED]: '취소됨'
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
  MAX_VISIBLE_PAGES: 5
};

export const PAGINATION_LABELS = {
  FIRST: '처음',
  PREVIOUS: '이전',
  NEXT: '다음',
  LAST: '마지막',
  PAGE_SIZE: '페이지당 항목 수',
  OF: '중',
  TOTAL: '총'
};

export const SCHEDULE_ACTIONS = {
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  BOOK: 'book',
  CANCEL: 'cancel',
  COMPLETE: 'complete'
};

export const SCHEDULE_ACTION_LABELS = {
  [SCHEDULE_ACTIONS.VIEW]: '보기',
  [SCHEDULE_ACTIONS.EDIT]: '수정',
  [SCHEDULE_ACTIONS.DELETE]: '삭제',
  [SCHEDULE_ACTIONS.BOOK]: '예약',
  [SCHEDULE_ACTIONS.CANCEL]: '취소',
  [SCHEDULE_ACTIONS.COMPLETE]: '완료'
};

export const SCHEDULE_ACTION_ICONS = {
  [SCHEDULE_ACTIONS.VIEW]: 'bi-eye',
  [SCHEDULE_ACTIONS.EDIT]: 'bi-pencil',
  [SCHEDULE_ACTIONS.DELETE]: 'bi-trash',
  [SCHEDULE_ACTIONS.BOOK]: 'bi-calendar-plus',
  [SCHEDULE_ACTIONS.CANCEL]: 'bi-x-circle',
  [SCHEDULE_ACTIONS.COMPLETE]: 'bi-check2-circle'
};

export const SCHEDULE_LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

export const SCHEDULE_ERROR_MESSAGES = {
  LOAD_FAILED: '스케줄을 불러오는데 실패했습니다.',
  SAVE_FAILED: '스케줄 저장에 실패했습니다.',
  DELETE_FAILED: '스케줄 삭제에 실패했습니다.',
  UPDATE_FAILED: '스케줄 수정에 실패했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNAUTHORIZED: '권한이 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.'
};

export const SCHEDULE_SUCCESS_MESSAGES = {
  LOAD_SUCCESS: '스케줄이 성공적으로 로드되었습니다.',
  SAVE_SUCCESS: '스케줄이 성공적으로 저장되었습니다.',
  DELETE_SUCCESS: '스케줄이 성공적으로 삭제되었습니다.',
  UPDATE_SUCCESS: '스케줄이 성공적으로 수정되었습니다.',
  BOOK_SUCCESS: '스케줄이 예약되었습니다.',
  CANCEL_SUCCESS: '스케줄이 취소되었습니다.',
  COMPLETE_SUCCESS: '스케줄이 완료되었습니다.'
};

export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  DATETIME: 'YYYY-MM-DD HH:mm',
  FULL: 'YYYY년 MM월 DD일 HH:mm'
};

export const TIME_FORMATS = {
  DISPLAY: 'HH:mm',
  API: 'HH:mm:ss',
  FULL: 'HH시 mm분'
};

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

export const TIME_SLOT_INTERVAL = 30; // 30분 간격
export const TIME_SLOT_DURATION = 30; // 30분 슬롯

export const MIN_CONSULTATION_DURATION = 30; // 최소 30분
export const MAX_CONSULTATION_DURATION = 180; // 최대 3시간
export const MAX_ADVANCE_BOOKING_DAYS = 30; // 최대 30일 후까지 예약 가능