/**
 * 상담사 급여 정산(관리자 산출) 화면·더보기 메뉴 문구
 * 매출·수입·지출 일반 리포트는 비노출 정책과 구분된 카피만 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-15
 */

export const CONSULTANT_SALARY_SETTLEMENT_STRINGS = {
  MORE_SECTION_TITLE: '메뉴',
  COMMUNITY_TITLE: '커뮤니티',
  COMMUNITY_SUBTITLE: '게시글 · 댓글',
  SALARY_MENU_TITLE: '급여 정산',
  SALARY_MENU_SUBTITLE: '관리자 확정 정산 내역',
  PAGE_TITLE: '급여 정산',
  PAGE_INTRO: '관리자가 확정한 급여 정산 결과만 표시됩니다. 매출·수입·지출 일반 리포트는 제공하지 않습니다.',
  LIST_SECTION: '정산 목록',
  EMPTY_TITLE: '확정된 급여 정산이 없습니다',
  EMPTY_BODY:
    '관리자 급여 산정이 반영되면 이 화면에서 확인할 수 있습니다. 잠시 후 다시 열어보시거나 센터 운영 담당자에게 문의해 주세요.',
  LOAD_ERROR: '급여 정산 정보를 불러오지 못했습니다.',
  RETRY: '다시 시도',
  LABEL_PERIOD: '정산 기간',
  LABEL_STATUS: '상태',
  LABEL_NET: '실수령액',
  LABEL_GROSS: '총 지급액',
  LABEL_DEDUCTIONS: '공제 합계',
  LABEL_MEMO: '비고',
  /** ERP 급여 계산 카드와 동일 흐름의 상담사 노출 라벨 */
  LABEL_CONSULTATION_PSYCH: '상담/심리검사 급여',
  LABEL_MEAL_TRANSPORT: '식대·교통비',
  LABEL_GROSS_PRETAX: '총 급여 (세전)',
  LABEL_TAX_DEDUCTION: '세금 공제',
  LABEL_NET_AFTER_TAX: '실수령액 (세후)',
  LABEL_SETTLEMENT_METHOD: '정산 수단',
  FALLBACK_STATUS: '—'
};
