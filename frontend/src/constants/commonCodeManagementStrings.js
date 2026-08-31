/**
 * CommonCodeManagement 화면 — 사용자 노출 한글 문자열
 *
 * @author Core Solution
 * @since 2026-04-21
 */

import { CODE_GROUP_KO_FALLBACK } from './codeGroupKoreanLabels';

/**
 * @deprecated SSOT는 `CODE_GROUP_KO_FALLBACK` (`codeGroupKoreanLabels.js`). 호환 re-export만 유지.
 */
export const COMMON_CODE_MANAGEMENT_GROUP_KO_FALLBACK = CODE_GROUP_KO_FALLBACK;

/** 알림·검증 메시지 */
export const COMMON_CODE_MANAGEMENT_MSG = {
  ERR_LOAD_CODE_GROUPS: '코드그룹 목록을 불러오는데 실패했습니다.',
  ERR_NO_ACCESS_CODE_GROUP: '해당 코드 그룹에 대한 접근 권한이 없습니다.',
  ERR_BRANCH_CODE_GROUP_ADMIN_ONLY: '지점 관련 코드 그룹은 관리자만 접근할 수 있습니다.',
  ERR_ERP_CODE_GROUP_ADMIN_ONLY: 'ERP 관련 코드 그룹은 관리자만 접근할 수 있습니다.',
  ERR_FINANCIAL_CODE_GROUP_ADMIN_ONLY: '수입지출 관련 코드 그룹은 관리자만 접근할 수 있습니다.',
  ERR_CODE_VALUE_LABEL_REQUIRED: '코드 값과 라벨은 필수입니다.',
  ERR_SELECT_PARENT_CATEGORY: '상위 카테고리를 선택하세요.',
  SUCCESS_CODE_ADDED: '새 코드가 추가되었습니다!',
  ERR_CODE_ADD_FAILED: '코드 추가에 실패했습니다.',
  ERR_NO_CREATE_PERMISSION: '해당 코드 그룹에 대한 생성 권한이 없습니다.',
  CONFIRM_DELETE_CODE: '정말로 이 코드를 삭제하시겠습니까?',
  SUCCESS_CODE_DELETED: '코드가 삭제되었습니다!',
  ERR_NO_DELETE_PERMISSION: '해당 코드 그룹에 대한 삭제 권한이 없습니다.',
  ERR_CODE_DELETE_FAILED: '코드 삭제에 실패했습니다.',
  SUCCESS_CODE_STATUS_CHANGED: '코드 상태가 변경되었습니다!',
  ERR_NO_TOGGLE_PERMISSION: '해당 코드 그룹에 대한 상태 변경 권한이 없습니다.',
  ERR_CODE_TOGGLE_FAILED: '코드 상태 변경에 실패했습니다.',
  SUCCESS_CODE_UPDATED: '코드가 수정되었습니다!',
  ERR_NO_UPDATE_PERMISSION: '해당 코드 그룹에 대한 수정 권한이 없습니다.',
  ERR_CODE_UPDATE_FAILED: '코드 수정에 실패했습니다.'
};

/**
 * @param {string} groupName
 * @returns {string}
 */
export function formatCommonCodeManagementGroupCodesLoadError(groupName) {
  return `${groupName} 그룹의 코드 목록을 불러오는데 실패했습니다.`;
}

/**
 * @param {string} displayName
 * @returns {string}
 */
export function formatCommonCodeManagementDetailTitle(displayName) {
  return `${displayName} 세부 코드`;
}

/** 레이아웃·폼·표 등 UI 라벨 */
export const COMMON_CODE_MANAGEMENT_UI = {
  PAGE_TITLE: '공통코드 관리',
  HEADER_SUBTITLE: '코드그룹을 선택한 뒤 해당 그룹의 세부 코드를 관리합니다.',
  GROUP_LIST_TITLE: '코드그룹 목록',
  SEARCH_PLACEHOLDER: '코드그룹 검색...',
  CATEGORY_ALL: '전체 카테고리',
  CATEGORY_USER: '사용자 관련',
  CATEGORY_SYSTEM: '시스템 관련',
  CATEGORY_PAYMENT: '결제/급여',
  CATEGORY_CONSULTATION: '상담 관련',
  CATEGORY_ERP: 'ERP 관련',
  EMPTY_SELECT_TITLE: '코드그룹을 선택하세요',
  EMPTY_SELECT_DESC: '좌측 목록에서 코드그룹을 선택하여 상세 코드를 관리할 수 있습니다.',
  BTN_NEW: '신규 추가',
  FORM_TITLE_EDIT: '코드 수정',
  FORM_TITLE_NEW: '새 코드 추가',
  BTN_CLOSE: '닫기',
  LABEL_CODE_VALUE: '코드 값 *',
  PLACEHOLDER_CODE_VALUE: '예: ACTIVE, INACTIVE',
  LABEL_CODE_LABEL: '코드 라벨 *',
  PLACEHOLDER_CODE_LABEL: '예: 활성, 비활성',
  LABEL_PARENT_CATEGORY: '상위 카테고리 *',
  PLACEHOLDER_PARENT_CATEGORY: '상위 카테고리를 선택하세요',
  LABEL_DESCRIPTION: '설명',
  PLACEHOLDER_DESCRIPTION: '코드에 대한 설명을 입력하세요.',
  LABEL_SORT_ORDER: '정렬 순서',
  LABEL_ACTIVE_STATE: '활성 상태',
  BTN_CANCEL: '취소',
  BTN_SUBMIT_EDIT: '수정',
  BTN_SUBMIT_ADD: '추가',
  LOADING: '로딩중...',
  COL_CODE_LABEL: '코드 라벨',
  COL_CODE_VALUE: '코드 값',
  COL_PARENT_CATEGORY: '상위 카테고리',
  COL_STATUS: '상태',
  COL_SORT: '정렬',
  COL_DESCRIPTION: '설명',
  COL_MANAGE: '관리',
  EMPTY_NO_CODES: '등록된 세부 코드가 없습니다.',
  STATUS_ACTIVE: '활성',
  STATUS_INACTIVE: '비활성',
  BTN_EDIT: '수정',
  ACTION_DEACTIVATE: '비활성화',
  ACTION_ACTIVATE: '활성화',
  BTN_DELETE: '삭제',
  DISPLAY_EMPTY: '—',
  SUMMARY_ARIA_LABEL: '공통코드 요약',
  SUMMARY_GROUP_COUNT_LABEL: '코드그룹 수',
  SUMMARY_SELECTED_GROUP_LABEL: '선택 그룹',
  SUMMARY_DETAIL_CODE_COUNT_LABEL: '세부 코드 수'
};
