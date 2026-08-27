/**
 * `/erp/dashboard` 운영자 머니 콕핏 — 사용자 노출 한글 UI 문자열
 *
 * @author CoreSolution
 * @since 2026-08-27
 */

export const OFD_PAGE_TITLE = '이번 달 돈';
export const OFD_PAGE_TITLE_ID = 'erp-dashboard-page-title';
export const OFD_MAIN_ARIA_LABEL = '이번 달 돈 본문';

export const OFD_PERIOD = {
  THIS_MONTH: 'THIS_MONTH',
  LAST_MONTH: 'LAST_MONTH',
  THIS_YEAR: 'THIS_YEAR'
};

export const OFD_PERIOD_OPTIONS = [
  { value: OFD_PERIOD.THIS_MONTH, label: '이번 달' },
  { value: OFD_PERIOD.LAST_MONTH, label: '지난달' },
  { value: OFD_PERIOD.THIS_YEAR, label: '올해' }
];

export const OFD_PERIOD_ARIA_LABEL = '조회 기간';

export const OFD_HERO = {
  INCOME_LABEL: '들어온 돈',
  EXPENSE_LABEL: '나간 돈',
  REMAINING_LABEL: '남은 돈',
  INCOME_CAPTION: '상담료 위주',
  EXPENSE_CAPTION: '급여·임대',
  REMAINING_CAPTION: '지난달 대비',
  UNIT: '원',
  BAND_ARIA: '이번 달 돈 요약'
};

export const OFD_CHART = {
  SECTION_TITLE: '최근 12개월',
  SECTION_ARIA: '최근 12개월 들어옴·나감',
  SERIES_INCOME: '들어옴',
  SERIES_EXPENSE: '나감',
  EMPTY: '최근 12개월에 등록된 수입·지출이 없습니다.',
  LOADING: '차트를 불러오는 중...'
};

export const OFD_WORKBENCH = {
  MIX_TITLE: '이번 달 돈이 나간 곳',
  MIX_ARIA: '이번 달 지출 구성',
  TODO_TITLE: '지금 손볼 일',
  TODO_ARIA: '지금 손볼 일',
  PENDING_CONSULTATION: '아직 안 들어온 상담료',
  PENDING_SALARY: '상담사 지급 예정',
  REFUND: '이번 달 환불'
};

export const OFD_MIX_CATEGORY = {
  SALARY: '급여',
  RENT_UTILITY: '임대·관리',
  REFUND: '환불',
  OTHER: '기타'
};

export const OFD_LEDGER = {
  TITLE: '최근 돈 움직임',
  ARIA: '최근 돈 움직임',
  COL_DATE: '일자',
  COL_DESC: '내용',
  COL_IN: '들어온 금액',
  COL_OUT: '나간 금액',
  EMPTY: '최근 돈 움직임이 없습니다.',
  DASH: '—',
  VIEW_MORE: '장부에서 더 보기',
  MAX_ROWS: 8
};

export const OFD_LINKS = {
  FINANCIAL: { label: '장부', path: '/erp/financial' },
  SALARY: { label: '상담사 지급', path: '/erp/salary' },
  PURCHASE: { label: '센터 경비', path: '/erp/purchase' }
};

export const OFD_LOADING = {
  SESSION_SUBTITLE: '세션 정보를 확인하는 중입니다.',
  SESSION: '세션 정보를 불러오는 중...',
  DATA_SUBTITLE: '이번 달 돈을 불러오는 중입니다.',
  DATA: '불러오는 중...',
  FINANCE: '데이터를 불러오는 중...'
};

export const OFD_ERRORS = {
  FINANCE_LOAD: '수입·지출 데이터를 불러올 수 없습니다.'
};

/** 환불로 집계할 subcategory 코드 */
export const OFD_REFUND_SUBCATEGORIES = [
  'CONSULTATION_REFUND',
  'CONSULTATION_PARTIAL_REFUND',
  'SESSION_REFUND'
];

/** 급여 계산에서 미지급으로 합산할 때 제외할 상태 */
export const OFD_SALARY_PAID_STATUS = 'PAID';
