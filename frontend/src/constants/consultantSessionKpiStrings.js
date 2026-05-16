/**
 * 상담사 완료 회기 KPI 화면 — 라우트·카피·목업 플래그
 *
 * @author MindGarden
 * @since 2026-05-16
 */

/** 더보기 하위 단일 진입 경로 (App·허브·AppShell 제목에서 공통 사용) */
export const CONSULTANT_SESSION_KPI_ROUTE = '/consultant/more/session-kpi';

/**
 * 백엔드 미연동 시 true로 두면 API 대신 목 데이터로 UI를 검증한다.
 * 운영 반영 전 반드시 false.
 */
export const CONSULTANT_SESSION_KPI_USE_MOCK = false;

export const CONSULTANT_SESSION_KPI_STRINGS = {
  PAGE_TITLE: '완료 회기 KPI',
  PAGE_SUBTITLE: '일·주·월 단위로 완료된 상담 회기를 확인합니다.',
  ARIA_MAIN: '완료 회기 통계 본문',
  MENU_TITLE: '완료 회기 KPI',
  MENU_SUBTITLE: '일·주·월 완료 회기 추이와 요약',
  GRANULARITY_DAY: '일',
  GRANULARITY_WEEK: '주',
  GRANULARITY_MONTH: '월',
  GRANULARITY_ARIA: '집계 단위',
  PERIOD_PREV: '이전 기간',
  PERIOD_NEXT: '다음 기간',
  KPI_TOTAL_LABEL: '기간 합계',
  KPI_PREV_LABEL: '직전 동일 기간',
  KPI_PREV_SUB: '비교 참고',
  SECTION_TREND: '기간별 추이',
  SECTION_LIST: '버킷별 상세',
  LIST_COL_PERIOD: '구간',
  LIST_COL_COUNT: '완료 회기',
  LOADING: '통계를 불러오는 중입니다…',
  EMPTY: '이 기간에 표시할 완료 회기가 없습니다.',
  NO_BUCKET_DETAIL: '합계는 있으나 구간별 상세가 없습니다. 잠시 후 다시 시도해 주세요.',
  ERROR_FALLBACK: '통계를 불러오지 못했습니다.',
  /** 빈 데이터(S.EMPTY)와 구분 — 요청 실패·권한·네트워크 안내 */
  ERROR_HINT: '연결 상태와 로그인(상담사 계정)을 확인한 뒤 다시 시도해 주세요.',
  RETRY: '다시 시도',
  CHART_LABEL: '완료 회기 수'
};
