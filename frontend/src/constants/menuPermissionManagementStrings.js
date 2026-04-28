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

/**
 * 메뉴 위치(LNB/대시보드) 표시명 — MenuPermissionManagementUI
 * (MENU_PERM_PAGE / MENU_PERM_BUTTON 과 동일하게 주제별 export)
 */
export const MENU_PERM_LOCATION = {
  DASHBOARD: '일반 대시보드',
  ADMIN_ONLY: '관리자 전용',
  BOTH: '양쪽 모두',
  UNKNOWN: '기타'
};

/** 좌측 역할 목록 — MenuPermissionManagementUI */
export const MENU_PERM_SIDEBAR = {
  TITLE: '역할 선택'
};

/** 선택 역할 패널 헤더 — MenuPermissionManagementUI */
export const MENU_PERM_ROLE_PANEL = {
  MENU_TITLE_SUFFIX: ' 역할의 메뉴 권한',
  DESCRIPTION: '이 역할에 부여할 메뉴 접근 권한을 설정하세요.'
};

/** 권한 체크박스 라벨 — MenuPermissionManagementUI */
export const MENU_PERM_ACCESS = {
  VIEW: '조회',
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제'
};

/** 안내 문구 — MenuPermissionManagementUI */
export const MENU_PERM_HELP = {
  TITLE: '권한 부여 규칙:',
  RULE_MIN_ROLE: '최소 요구 역할보다 낮은 역할에게는 권한을 부여할 수 없습니다.',
  RULE_VIEW_FIRST: '조회 권한이 없으면 생성/수정/삭제 권한을 부여할 수 없습니다.',
  RULE_ADMIN: 'ADMIN 역할은 모든 메뉴에 접근할 수 있습니다.'
};

/** 빈 상태 — MenuPermissionManagementUI */
export const MENU_PERM_EMPTY = {
  SELECT_ROLE: '좌측에서 역할을 선택하세요'
};

/** 인라인 로딩 — MenuPermissionManagementUI (컨테이너는 MENU_PERM_PAGE.LOADING 사용) */
export const MENU_PERM_LOADING = {
  INLINE: '로딩 중...'
};

/** 역할 코드별 계층 레벨 — 권한 부여 가능 여부 비교용 */
export const MENU_PERM_ROLE_LEVEL = {
  ADMIN: 4,
  STAFF: 3,
  CONSULTANT: 2,
  CLIENT: 1
};

/** TODO 제거 전 임시 목업 — 역할 표시명 */
export const MENU_PERM_MOCK_ROLES = [
  { tenantRoleId: '1', nameKo: '관리자', nameEn: 'ADMIN' },
  { tenantRoleId: '2', nameKo: '사무원', nameEn: 'STAFF' },
  { tenantRoleId: '3', nameKo: '상담사', nameEn: 'CONSULTANT' },
  { tenantRoleId: '4', nameKo: '내담자', nameEn: 'CLIENT' }
];
