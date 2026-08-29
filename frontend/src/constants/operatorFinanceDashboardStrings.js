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
  UNIT: '원',
  BAND_ARIA: '이번 달 돈 요약',
  REMAINING_MORE_PREFIX: '지난달보다 ',
  REMAINING_MORE_SUFFIX: ' 많음',
  REMAINING_LESS_PREFIX: '지난달보다 ',
  REMAINING_LESS_SUFFIX: ' 적음',
  REMAINING_SAME: '지난달과 같음'
};

export const OFD_CHART = {
  SECTION_TITLE: '최근 12개월',
  SECTION_ARIA: '최근 12개월 들어옴·나감',
  SERIES_INCOME: '들어옴',
  SERIES_EXPENSE: '나감',
  EMPTY: '최근 12개월에 등록된 수입·지출이 없습니다.',
  LOADING: '차트를 불러오는 중...',
  AXIS_MAN_SUFFIX: '만 원',
  AXIS_EOK_SUFFIX: '억 원',
  /** 평균 점선·캡션 접두 — 예: `월 평균 6,000,000원` */
  AVG_PREFIX: '월 평균',
  AVG_CAPTION_ARIA: '운영 시작부터 이번 달 월 평균'
};

export const OFD_WORKBENCH = {
  INCOME_MIX_TITLE: '들어온 곳',
  INCOME_MIX_ARIA: '이번 달 수입 구성',
  EXPENSE_MIX_TITLE: '나간 곳',
  EXPENSE_MIX_ARIA: '이번 달 지출 구성',
  /** @deprecated EXPENSE_MIX_TITLE 사용 — 하위 호환 */
  MIX_TITLE: '나간 곳',
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
  OTHER: '기타',
  CONSULTATION: '상담료',
  CONSULTATION_FEE: '상담료',
  INCOME: '수입'
};

/** categoryBreakdown / tx.category 코드 → 클리닉 라벨 (존재하는 키만 매핑) */
export const OFD_CATEGORY_LABELS = {
  상담료: OFD_MIX_CATEGORY.CONSULTATION,
  CONSULTATION: OFD_MIX_CATEGORY.CONSULTATION,
  CONSULTATION_FEE: OFD_MIX_CATEGORY.CONSULTATION_FEE,
  INCOME: OFD_MIX_CATEGORY.INCOME,
  SALARY: OFD_MIX_CATEGORY.SALARY,
  RENT: '임대',
  UTILITY: '관리',
  MANAGEMENT_FEE: '관리',
  CONSULTATION_REFUND: OFD_MIX_CATEGORY.REFUND,
  OTHER: OFD_MIX_CATEGORY.OTHER
};

export const OFD_FACTS = {
  TRANSACTION_COUNT_PREFIX: '거래 ',
  TRANSACTION_COUNT_SUFFIX: '건',
  MAPPING_INCOME_PREFIX: '매핑으로 들어온 상담료 ',
  MAPPING_REFUND_PREFIX: '매핑 환불 '
};

/**
 * 1인 클리닉 급여·국세청 체크리스트 문구 (지금 손볼 일 dense facts)
 * 축하/완료 문구는 두지 않음.
 */
export const OFD_SALARY_CHECKLIST = {
  PAYDAY_BEFORE_PREFIX: '급여일 ',
  PAYDAY_BEFORE_DAY_SUFFIX: '일 · 아직 지급 전',
  PAYDAY_BEFORE_LAST_DAY: '급여일 말일 · 아직 지급 전',
  PAYDAY_TODAY: '오늘 급여일 · 상담사 지급',
  PAYDAY_AFTER: '급여일 지남 · 아직 안 줌',
  NTS_WITHHOLDING: '지급 후 원천세 신고',
  BUSINESS_REG: '상담사 사업자 등록 여부 확인'
};

/**
 * 급여일 전 + 미지급 코멘트
 * @param {number} dayOfMonth 1–28 등. 0이면 말일
 * @returns {string}
 */
export function formatPaydayBeforeComment(dayOfMonth) {
  if (dayOfMonth === 0) {
    return OFD_SALARY_CHECKLIST.PAYDAY_BEFORE_LAST_DAY;
  }
  return `${OFD_SALARY_CHECKLIST.PAYDAY_BEFORE_PREFIX}${dayOfMonth}${OFD_SALARY_CHECKLIST.PAYDAY_BEFORE_DAY_SUFFIX}`;
}

export const OFD_MAPPING_ENTITY = {
  INCOME: 'CONSULTANT_CLIENT_MAPPING',
  REFUND: 'CONSULTANT_CLIENT_MAPPING_REFUND'
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
  SALARY: { label: '상담사 지급', path: '/erp/salary' }
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

/** 축 눈금: 전체 표기 대신 만/억으로 줄이는 임계(원) */
export const OFD_AXIS_COMPACT_THRESHOLD = 10000000;
