/**
 * MenuPermissionManagement — 사용자 노출 한글 문자열
 *
 * @author Core Solution
 * @since 2026-04-21
 */

export const MENU_PERM_MSG = {
  ERR_LOAD_ROLES: '역할 목록을 불러오는 중 오류가 발생했습니다.',
  QUERY_FAIL: '메뉴 권한 조회 실패',
  ERR_LOAD_MENU_PERM: '메뉴 권한을 불러오는 중 오류가 발생했습니다.',
  PERM_CHANGE_FAIL: '권한 변경 실패',
  ERR_PERM_CHANGE: '권한 변경 중 오류가 발생했습니다.',
  SAVE_FAIL: '저장 실패',
  ERR_SAVE: '저장 중 오류가 발생했습니다.'
};

export const MENU_PERM_CONFIRM = {
  BATCH_SAVE: '변경사항을 저장하시겠습니까?'
};

export const MENU_PERM_TOAST = {
  SAVED: '저장되었습니다.'
};

export const MENU_PERM_PAGE = {
  TITLE: '메뉴 권한 관리',
  SUBTITLE: '역할별 메뉴·LNB 접근 권한을 설정하고 저장합니다.',
  ARIA_MAIN: '메뉴 권한 관리 본문',
  LOADING: '데이터를 불러오는 중...'
};

export const MENU_PERM_BUTTON = {
  SAVE_CHANGES: '변경사항 저장'
};

/** TODO 제거 전 임시 목업 — 역할 표시명 */
export const MENU_PERM_MOCK_ROLES = [
  { tenantRoleId: '1', nameKo: '관리자', nameEn: 'ADMIN' },
  { tenantRoleId: '2', nameKo: '사무원', nameEn: 'STAFF' },
  { tenantRoleId: '3', nameKo: '상담사', nameEn: 'CONSULTANT' },
  { tenantRoleId: '4', nameKo: '내담자', nameEn: 'CLIENT' }
];
