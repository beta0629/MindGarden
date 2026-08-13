/**
 * 주간 예약 현황 위젯 상수
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

/** API */
export const WEEKLY_RESERVATIONS_API = {
  STATS: '/api/v1/admin/statistics/weekly-reservations'
};

/** weekOffset 값 */
export const WEEK_OFFSET = {
  THIS_WEEK: 0,
  LAST_WEEK: -1
};

/** 기간 토글 옵션 */
export const WEEK_OFFSET_OPTIONS = [
  { value: WEEK_OFFSET.THIS_WEEK, label: '이번 주' },
  { value: WEEK_OFFSET.LAST_WEEK, label: '지난주' }
];

/** ISO dayOfWeek(1–7) → 짧은 라벨 */
export const DAY_OF_WEEK_SHORT_LABELS = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
  7: '일'
};

/** 상태 표시 순서 */
export const WEEKLY_STATUS_ORDER = ['BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

/** 위젯 문자열 */
export const WEEKLY_RESERVATIONS_STRINGS = {
  WIDGET_TITLE: '주간 예약 현황',
  KPI_TOTAL_LABEL: '총 예약',
  KPI_PREV_LABEL: '전주 대비',
  KPI_UNIT: '건',
  SECTION_BY_DAY: '요일별',
  SECTION_BY_STATUS: '상태별',
  EMPTY: '해당 주간의 예약 내역이 없습니다.',
  ERROR: '데이터를 불러오지 못했습니다.',
  RETRY: '다시 시도',
  ARIA_WEEK_TOGGLE: '주간 기간 선택',
  ARIA_REFRESH: '새로고침',
  CHANGE_UP_PREFIX: '+',
  CHANGE_SAME: '변동 없음'
};

/** CSS 클래스 */
export const WEEKLY_RESERVATIONS_CSS = {
  WIDGET: 'mg-v2-weekly-reservations',
  BODY: 'mg-v2-weekly-reservations__body',
  BODY_LOADING: 'mg-v2-weekly-reservations__body--loading',
  GRID: 'mg-v2-weekly-reservations__grid',
  KPI: 'mg-v2-weekly-reservations__kpi',
  KPI_VALUE: 'mg-v2-weekly-reservations__kpi-value',
  KPI_LABEL: 'mg-v2-weekly-reservations__kpi-label',
  KPI_CHANGE: 'mg-v2-weekly-reservations__kpi-change',
  KPI_CHANGE_UP: 'mg-v2-weekly-reservations__kpi-change--up',
  KPI_CHANGE_DOWN: 'mg-v2-weekly-reservations__kpi-change--down',
  DAYS: 'mg-v2-weekly-reservations__days',
  DAYS_TITLE: 'mg-v2-weekly-reservations__days-title',
  BARS: 'mg-v2-weekly-reservations__bars',
  BAR_COL: 'mg-v2-weekly-reservations__bar-col',
  BAR_TRACK: 'mg-v2-weekly-reservations__bar-track',
  BAR_FILL: 'mg-v2-weekly-reservations__bar-fill',
  BAR_FILL_PEAK: 'mg-v2-weekly-reservations__bar-fill--peak',
  BAR_COUNT: 'mg-v2-weekly-reservations__bar-count',
  BAR_LABEL: 'mg-v2-weekly-reservations__bar-label',
  STATUS: 'mg-v2-weekly-reservations__status',
  STATUS_TITLE: 'mg-v2-weekly-reservations__status-title',
  STATUS_LIST: 'mg-v2-weekly-reservations__status-list',
  STATUS_ROW: 'mg-v2-weekly-reservations__status-row',
  STATUS_COUNT: 'mg-v2-weekly-reservations__status-count'
};
