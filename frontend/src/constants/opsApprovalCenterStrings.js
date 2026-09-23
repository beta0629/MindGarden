/**
 * 운영 승인 센터 (`/erp/approvals`) Clinic-OS 한글 UI 문자열
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

export const OAC_PAGE_TITLE = '승인 센터';
export const OAC_PAGE_TITLE_ID = 'ops-approval-page-title';
export const OAC_MAIN_ARIA_LABEL = '운영 승인 대기 목록 및 본문';
export const OAC_HEADER_TOOLS_ARIA = '승인 센터 도구';

export const OAC_REFRESH_CTA = '목록 새로고침';
export const OAC_REFRESH_ARIA = '승인 대기 목록 새로고침';

export const OAC_SUMMARY = {
  PENDING_LABEL: '대기',
  TODAY_LABEL: '오늘',
  REJECTED_LABEL: '반려',
  BAND_ARIA: '승인 센터 요약',
  UNIT_COUNT: '건'
};

export const OAC_LOADING = {
  INLINE: '불러오는 중...',
  LIST: '승인 대기 목록을 불러오는 중...'
};

export const OAC_EMPTY = {
  TITLE: '대기 중인 승인이 없습니다',
  BODY: '급여·구매·환불 등 승인 대기 건이 여기 표시됩니다.'
};

export const OAC_ERRORS = {
  LOAD_FAILED: '승인 대기 목록을 불러오지 못했습니다.',
  APPROVE_FAILED: '승인 처리에 실패했습니다.',
  REJECT_FAILED: '반려 처리에 실패했습니다.',
  NO_USER: '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.'
};

export const OAC_ACTIONS = {
  APPROVE: '승인',
  REJECT: '반려',
  MORE: '더보기',
  MORE_ARIA: '추가 작업',
  OPEN_SALARY: '급여 화면에서 보기',
  OPEN_REFUND: '환불 관리에서 처리',
  CANCEL: '취소',
  CONFIRM_APPROVE: '승인 확정',
  CONFIRM_REJECT: '반려 확정'
};

export const OAC_TYPE_LABELS = {
  PURCHASE: '구매',
  SALARY: '급여',
  REFUND: '환불'
};

export const OAC_TABLE = {
  TYPE: '유형',
  TITLE: '내용',
  REQUESTER: '요청자',
  AMOUNT: '금액',
  WHEN: '일시',
  ACTIONS: '처리',
  ARIA: '승인 대기 목록'
};

export const OAC_MODAL = {
  APPROVE_TITLE: '승인 확인',
  REJECT_TITLE: '반려 확인',
  COMMENT_OPTIONAL: '의견 (선택)',
  COMMENT_REQUIRED: '반려 사유 (필수)',
  COMMENT_APPROVE_PH: '승인 의견을 입력할 수 있습니다.',
  COMMENT_REJECT_PH: '반려 사유를 입력해 주세요.'
};

export const OAC_SUPER_SUBTITLE = '상위 승인 대기 (구매)';
