/**
 * 예상 방문·미예약 MVP 상수
 *
 * @author CoreSolution
 * @since 2026-08-13
 */

/** API 엔드포인트 */
export const VISIT_PREDICTION_API = {
  UNBOOKED_EXPECTED: '/api/v1/schedules/predictions/unbooked-expected',
  DISMISS: '/api/v1/schedules/predictions/dismiss',
  SETTINGS: (mappingId) => `/api/v1/schedules/predictions/settings/${mappingId}`,
  CREATE_SCHEDULE: '/api/v1/schedules/consultant'
};

/** 기간 필터 옵션 */
export const PERIOD_FILTER_OPTIONS = [
  { value: 'THIS_WEEK', label: '이번 주' },
  { value: 'NEXT_WEEK', label: '다음 주' },
  { value: 'TWO_WEEKS', label: '2주' }
];

export const PERIOD_FILTER_DEFAULT = 'NEXT_WEEK';

/** 신뢰도(confidence) → StatusBadge 매핑 */
export const CONFIDENCE_BADGE_MAP = {
  HIGH: { variant: 'success', label: '안정 패턴' },
  MEDIUM: { variant: 'warning', label: '추정' },
  LOW: { variant: 'neutral', label: '데이터 부족' },
  INSUFFICIENT: { variant: 'neutral', label: '데이터 부족' }
};

/** 위젯 문자열 상수 */
export const EXPECTED_VISITS_STRINGS = {
  WIDGET_TITLE: '미예약 예상 내담자',
  WIDGET_SUBTITLE: '방문 이력 기반 추정이며, 실제 상황과 다를 수 있습니다',
  EMPTY_NO_DATA: '해당 기간에 미예약 예상 내담자가 없습니다',
  EMPTY_FEATURE_OFF: '예측 기능이 비활성화되어 있습니다',
  EMPTY_INSUFFICIENT: '방문 데이터가 충분하지 않아 예측할 수 없습니다',
  CTA_BOOK: '예약 작성',
  CTA_DISMISS: '무시',
  CTA_DISABLE_PREDICTION: '이 내담자 예측 끄기',
  MODAL_TITLE: '예약 초안 작성',
  MODAL_SUBTITLE: '예상 방문일 기반으로 예약을 생성합니다',
  TOAST_BOOK_SUCCESS: '예약이 성공적으로 생성되었습니다',
  TOAST_DISMISS_SUCCESS: '해당 예상 방문을 무시했습니다',
  TOAST_DISABLE_SUCCESS: '해당 내담자의 예측이 비활성화되었습니다',
  TOAST_ERROR: '요청 처리에 실패했습니다',
  LABEL_CLIENT: '내담자',
  LABEL_CONSULTANT: '담당 상담사',
  LABEL_EXPECTED_DATE: '예상 방문일',
  LABEL_PATTERN: '패턴 요약',
  LABEL_LAST_VISIT: '마지막 방문',
  LABEL_CONFIDENCE: '신뢰도',
  LABEL_ACTIONS: '작업',
  ARIA_PERIOD_FILTER: '기간 필터 선택'
};

/** CSS 클래스 상수 */
export const EXPECTED_VISITS_CSS = {
  WIDGET: 'mg-v2-expected-visits',
  HEADER: 'mg-v2-expected-visits__header',
  FILTER: 'mg-v2-expected-visits__filter',
  TABLE: 'mg-v2-expected-visits__table',
  TABLE_HEAD: 'mg-v2-expected-visits__thead',
  TABLE_BODY: 'mg-v2-expected-visits__tbody',
  ROW: 'mg-v2-expected-visits__row',
  CELL: 'mg-v2-expected-visits__cell',
  CARD_LIST: 'mg-v2-expected-visits__card-list',
  CARD_ITEM: 'mg-v2-expected-visits__card-item',
  CARD_FIELD: 'mg-v2-expected-visits__card-field',
  CARD_LABEL: 'mg-v2-expected-visits__card-label',
  CARD_VALUE: 'mg-v2-expected-visits__card-value',
  ACTIONS: 'mg-v2-expected-visits__actions',
  SUBTITLE: 'mg-v2-expected-visits__disclaimer'
};

/** 페이지네이션 기본값 */
export const EXPECTED_VISITS_PAGE_SIZE = 10;
