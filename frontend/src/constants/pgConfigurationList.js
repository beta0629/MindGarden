/**
 * PG 설정 목록(테넌트) 화면 문구·필터 키
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

export const PG_LIST_QUICK_FILTER = Object.freeze({
  ALL: 'ALL',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  CUSTOM: 'CUSTOM'
});

export const PG_LIST_COPY = Object.freeze({
  ARIA_LABEL: 'PG 설정 목록',
  SUMMARY_ARIA: 'PG 설정 요약',
  QUICK_FILTER_ARIA: 'PG 설정 빠른 필터',
  SUMMARY_ALL: '전체',
  SUMMARY_PENDING: '승인 대기',
  SUMMARY_ACTIVE: '활성',
  COUNT_UNIT: '건',
  COL_NAME: 'PG 설정',
  COL_STATUS: '상태',
  COL_ACTIONS: '작업',
  ROW_ARIA_PREFIX: 'PG 설정: ',
  REJECTED_PREFIX: '거부됨: ',
  DELETE_CONFIRM_PREFIX: '정말로 ',
  DELETE_CONFIRM_SUFFIX: ' 설정을 삭제하시겠습니까?'
});

export const PG_LIST_STATUS_BADGE = Object.freeze({
  PENDING: { label: '대기 중', variant: 'warning' },
  APPROVED: { label: '승인됨', variant: 'success' },
  REJECTED: { label: '거부됨', variant: 'danger' },
  ACTIVE: { label: '활성화', variant: 'success' },
  INACTIVE: { label: '비활성화', variant: 'neutral' }
});

export const PG_LIST_APPROVAL_BADGE = Object.freeze({
  PENDING: { label: '승인 대기', variant: 'warning' },
  APPROVED: { label: '승인됨', variant: 'success' },
  REJECTED: { label: '거부됨', variant: 'danger' }
});

/**
 * @param {number} count
 * @returns {string}
 */
export const formatPgListCount = (count) => `${count}${PG_LIST_COPY.COUNT_UNIT}`;
