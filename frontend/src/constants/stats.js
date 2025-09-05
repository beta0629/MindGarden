/**
 * 통계 관련 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-05
 */

// ==================== 통계 타입 ====================
export const STATS_TYPES = {
  TOTAL_SCHEDULES: 'totalSchedules',
  BOOKED_SCHEDULES: 'bookedSchedules',
  CONFIRMED_SCHEDULES: 'confirmedSchedules',
  COMPLETED_SCHEDULES: 'completedSchedules',
  CANCELLED_SCHEDULES: 'cancelledSchedules',
  IN_PROGRESS_SCHEDULES: 'inProgressSchedules',
  TODAY_TOTAL: 'totalToday',
  TODAY_COMPLETED: 'completedToday',
  TODAY_IN_PROGRESS: 'inProgressToday',
  TODAY_CANCELLED: 'cancelledToday',
  TODAY_BOOKED: 'bookedToday',
  TODAY_CONFIRMED: 'confirmedToday'
};

// ==================== 통계 라벨 ====================
export const STATS_LABELS = {
  [STATS_TYPES.TOTAL_SCHEDULES]: '전체 스케줄',
  [STATS_TYPES.BOOKED_SCHEDULES]: '예약된 스케줄',
  [STATS_TYPES.CONFIRMED_SCHEDULES]: '확정된 스케줄',
  [STATS_TYPES.COMPLETED_SCHEDULES]: '완료된 스케줄',
  [STATS_TYPES.CANCELLED_SCHEDULES]: '취소된 스케줄',
  [STATS_TYPES.IN_PROGRESS_SCHEDULES]: '진행중인 스케줄',
  [STATS_TYPES.TODAY_TOTAL]: '오늘 전체',
  [STATS_TYPES.TODAY_COMPLETED]: '오늘 완료',
  [STATS_TYPES.TODAY_IN_PROGRESS]: '오늘 진행중',
  [STATS_TYPES.TODAY_CANCELLED]: '오늘 취소',
  [STATS_TYPES.TODAY_BOOKED]: '오늘 예약',
  [STATS_TYPES.TODAY_CONFIRMED]: '오늘 확정'
};

// ==================== 통계 아이콘 ====================
export const STATS_ICONS = {
  [STATS_TYPES.TOTAL_SCHEDULES]: 'bi-calendar-check',
  [STATS_TYPES.BOOKED_SCHEDULES]: 'bi-calendar-plus',
  [STATS_TYPES.CONFIRMED_SCHEDULES]: 'bi-calendar-check-fill',
  [STATS_TYPES.COMPLETED_SCHEDULES]: 'bi-check-circle-fill',
  [STATS_TYPES.CANCELLED_SCHEDULES]: 'bi-x-circle-fill',
  [STATS_TYPES.IN_PROGRESS_SCHEDULES]: 'bi-clock-fill',
  [STATS_TYPES.TODAY_TOTAL]: 'bi-calendar-day',
  [STATS_TYPES.TODAY_COMPLETED]: 'bi-check2-circle',
  [STATS_TYPES.TODAY_IN_PROGRESS]: 'bi-clock-history',
  [STATS_TYPES.TODAY_CANCELLED]: 'bi-x-octagon',
  [STATS_TYPES.TODAY_BOOKED]: 'bi-calendar-plus-fill',
  [STATS_TYPES.TODAY_CONFIRMED]: 'bi-calendar-check-fill'
};

// ==================== 통계 색상 ====================
export const STATS_COLORS = {
  [STATS_TYPES.TOTAL_SCHEDULES]: 'var(--color-primary)',
  [STATS_TYPES.BOOKED_SCHEDULES]: 'var(--color-warning)',
  [STATS_TYPES.CONFIRMED_SCHEDULES]: 'var(--color-info)',
  [STATS_TYPES.COMPLETED_SCHEDULES]: 'var(--color-success)',
  [STATS_TYPES.CANCELLED_SCHEDULES]: 'var(--color-error)',
  [STATS_TYPES.IN_PROGRESS_SCHEDULES]: 'var(--color-primary)',
  [STATS_TYPES.TODAY_TOTAL]: 'var(--color-primary)',
  [STATS_TYPES.TODAY_COMPLETED]: 'var(--color-success)',
  [STATS_TYPES.TODAY_IN_PROGRESS]: 'var(--color-info)',
  [STATS_TYPES.TODAY_CANCELLED]: 'var(--color-error)',
  [STATS_TYPES.TODAY_BOOKED]: 'var(--color-warning)',
  [STATS_TYPES.TODAY_CONFIRMED]: 'var(--color-info)'
};

// ==================== 통계 그룹 ====================
export const STATS_GROUPS = {
  OVERALL: 'overall',
  TODAY: 'today'
};

// ==================== 통계 그룹별 설정 ====================
export const STATS_GROUP_CONFIG = {
  [STATS_GROUPS.OVERALL]: {
    title: '전체 통계',
    stats: [
      STATS_TYPES.TOTAL_SCHEDULES,
      STATS_TYPES.BOOKED_SCHEDULES,
      STATS_TYPES.CONFIRMED_SCHEDULES,
      STATS_TYPES.COMPLETED_SCHEDULES,
      STATS_TYPES.CANCELLED_SCHEDULES,
      STATS_TYPES.IN_PROGRESS_SCHEDULES
    ]
  },
  [STATS_GROUPS.TODAY]: {
    title: '오늘 통계',
    stats: [
      STATS_TYPES.TODAY_TOTAL,
      STATS_TYPES.TODAY_BOOKED,
      STATS_TYPES.TODAY_CONFIRMED,
      STATS_TYPES.TODAY_IN_PROGRESS,
      STATS_TYPES.TODAY_COMPLETED,
      STATS_TYPES.TODAY_CANCELLED
    ]
  }
};

// ==================== 통계 새로고침 간격 ====================
export const STATS_REFRESH_INTERVAL = {
  FAST: 30000,    // 30초
  NORMAL: 60000,  // 1분
  SLOW: 300000    // 5분
};

// ==================== 통계 로딩 상태 ====================
export const STATS_LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// ==================== 통계 에러 메시지 ====================
export const STATS_ERROR_MESSAGES = {
  LOAD_FAILED: '통계를 불러오는데 실패했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  UNAUTHORIZED: '권한이 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.'
};

// ==================== 통계 성공 메시지 ====================
export const STATS_SUCCESS_MESSAGES = {
  LOAD_SUCCESS: '통계가 성공적으로 로드되었습니다.',
  REFRESH_SUCCESS: '통계가 새로고침되었습니다.'
};
