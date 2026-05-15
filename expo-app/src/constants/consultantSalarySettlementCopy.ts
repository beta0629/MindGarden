/**
 * 상담사 급여 정산(Expo) 사용자 노출 문구 SSOT
 *
 * @author MindGarden
 * @since 2026-05-15
 */
export const CONSULTANT_SALARY_SETTLEMENT_COPY = {
  MENU_TITLE: '급여 정산 내역',
  MENU_SUBTITLE: '매월 확정된 급여 내역을 확인하세요',
  SCREEN_TITLE: '급여 정산 내역',
  INTRO: '관리자가 확정한 급여 정산만 표시됩니다. 일반 매출·수입 리포트와는 별도입니다.',
  EMPTY_PRIMARY: '아직 정산된 급여 내역이 없습니다.',
  EMPTY_HINT:
    '관리자가 급여를 산정·확정하면 이 목록에 표시됩니다. 센터 정책에 따라 별도 등록이 필요할 수 있습니다.',
  LOAD_ERROR: '급여 정산 정보를 불러오지 못했습니다.',
  RETRY: '다시 시도',
  NO_USER_TITLE: '계정 정보를 확인할 수 없습니다',
  NO_USER_HINT: '다시 로그인한 뒤 이용해 주세요.',
  STATUS: '상태',
  NET: '실수령액',
  GROSS: '총 지급액',
  LIST_FETCH_FAILED: '급여 정산 목록을 불러오지 못했습니다.',
} as const;
