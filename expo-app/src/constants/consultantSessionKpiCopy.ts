/**
 * 상담사 완료 회기 KPI 화면 문구
 *
 * @author MindGarden
 * @since 2026-05-16
 */
export const CONSULTANT_SESSION_KPI_COPY = {
  INTRO: '선택한 기간의 완료 회기 합계와 추이를 확인할 수 있습니다.',
  EMPTY_ALL_HINT: '기간을 바꾸거나 다음에 다시 확인해 주세요.',
  SCREEN_TITLE: '완료 회기 KPI',
  MENU_TITLE: '완료 회기 KPI',
  MENU_SUBTITLE: '일·주·월 완료 회기 추이',
  GRANULARITY_DAY: '일',
  GRANULARITY_WEEK: '주',
  GRANULARITY_MONTH: '월',
  HEADER_TOTAL: '총 완료 회기',
  HEADER_DELTA: '전 기간 대비',
  HEADER_PREVIOUS: '이전 동일 기간',
  SECTION_TREND: '기간별 추이',
  CHART_EMPTY: '이 기간에 표시할 추이 데이터가 없습니다.',
  /** 합계는 받았으나 buckets가 비어 API/데이터 불일치 가능 */
  NO_BUCKET_DETAIL: '합계는 있으나 구간별 상세가 없습니다. 잠시 후 다시 시도해 주세요.',
  LIST_TITLE: '버킷별 완료',
  FETCH_FAILED: '완료 회기 통계를 불러오지 못했습니다.',
  LOAD_ERROR: '통계를 불러오는 중 오류가 발생했습니다.',
  /** 빈 구간(S.EMPTY_ALL)과 구분 */
  LOAD_ERROR_HINT: '연결과 로그인(상담사) 상태를 확인한 뒤 다시 시도해 주세요.',
  RETRY: '다시 시도',
  NO_USER_TITLE: '로그인이 필요합니다',
  NO_USER_HINT: '상담사 계정으로 로그인한 뒤 다시 열어주세요.',
  PREV_PERIOD: '이전 기간',
  NEXT_PERIOD: '다음 기간',
  EMPTY_ALL: '이 기간에 완료된 회기가 없습니다.',
  DELTA_UNAVAILABLE: '비교 데이터 없음',
} as const;
