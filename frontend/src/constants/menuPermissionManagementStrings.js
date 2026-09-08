/**
 * MenuPermissionManagement — Clinic-OS 한글 UI 문자열
 * SSOT: docs/design-system/clinic-os-menu-permissions.md §4
 *
 * @author Core Solution
 * @since 2026-04-21
 * @updated 2026-09-08 — Clinic-OS Critic PASS copy
 */

export const MENU_PERM_MSG = {
  ERR_LOAD_ROLES: '역할 목록을 불러오는 중 오류가 발생했습니다.',
  QUERY_FAIL: '메뉴 권한 조회 실패',
  ERR_LOAD_MENU_PERM: '메뉴 권한을 불러오는 중 오류가 발생했습니다.',
  PERM_CHANGE_FAIL: '권한 변경 실패',
  ERR_PERM_CHANGE: '권한 변경 중 오류가 발생했습니다.',
  SAVE_FAIL: '저장 실패',
  ERR_SAVE: '저장 중 오류가 발생했습니다.',
  LOCKED_DENY: '잠긴 권한은 변경할 수 없습니다.'
};

export const MENU_PERM_CONFIRM = {
  BATCH_SAVE: '변경사항을 저장하시겠습니까?'
};

export const MENU_PERM_TOAST = {
  SAVED: '저장되었습니다.'
};

export const MENU_PERM_PAGE = {
  TITLE: '메뉴 권한',
  SUBTITLE: '이 센터 · 역할별 LNB',
  TITLE_ID: 'menu-permission-page-title',
  ARIA_MAIN: '메뉴 권한 본문',
  LOADING: '데이터를 불러오는 중...'
};

export const MENU_PERM_BUTTON = {
  SAVE_CHANGES: '저장'
};

export const MENU_PERM_ROLE_CHIPS = {
  ARIA: '역할 선택',
  ADMIN: '관리자',
  STAFF: '스태프',
  CONSULTANT: '상담사',
  CLIENT: '내담자'
};

export const MENU_PERM_BADGE = {
  DEFAULT: '기본',
  CENTER: '센터 맞춤'
};

export const MENU_PERM_RAIL = {
  ARIA: '기본과 센터 맞춤 요약',
  DEFAULT_COUNT: (n) => `기본 ${n}`,
  CENTER_COUNT: (n) => `센터 맞춤 ${n}`
};

export const MENU_PERM_LOCK = {
  SCHEDULE_CREATE:
    '상담사는 스케줄을 생성할 수 없습니다. 센터·스태프가 대리 등록합니다.',
  STAFF_OPS_FINANCE:
    '스태프에게 운영·재무(장부·이번 달·세금·급여 승인·지급) 권한을 줄 수 없습니다.',
  MIN_ROLE: '이 역할보다 높은 최소 역할이 필요한 메뉴입니다.'
};

export const MENU_PERM_EMPTY = {
  SELECT_ROLE: '역할을 선택하세요',
  NO_MENUS: '표시할 메뉴가 없습니다.'
};

export const MENU_PERM_LOADING = {
  INLINE: '로딩 중...'
};

export const MENU_PERM_ROW = {
  VISIBILITY_ARIA: (name) => `${name} 노출`,
  LOCK_ARIA: '잠금'
};

/** 역할 코드별 계층 레벨 — 권한 부여 가능 여부 비교용 */
export const MENU_PERM_ROLE_LEVEL = {
  ADMIN: 4,
  STAFF: 3,
  CONSULTANT: 2,
  CLIENT: 1
};

/** 역할 칩 표시용 폴백(API 실패 시) */
export const MENU_PERM_MOCK_ROLES = [
  { tenantRoleId: 'ADMIN', nameKo: '관리자', nameEn: 'ADMIN' },
  { tenantRoleId: 'STAFF', nameKo: '스태프', nameEn: 'STAFF' },
  { tenantRoleId: 'CONSULTANT', nameKo: '상담사', nameEn: 'CONSULTANT' },
  { tenantRoleId: 'CLIENT', nameKo: '내담자', nameEn: 'CLIENT' }
];

/** @deprecated AS-IS — 본문 비노출; 테스트/레거시 import 방지용 유지 금지 대상 */
export const MENU_PERM_LOCATION = {
  DASHBOARD: '일반 대시보드',
  ADMIN_ONLY: '관리자 전용',
  BOTH: '양쪽 모두',
  UNKNOWN: '기타'
};

export const MENU_PERM_SIDEBAR = {
  TITLE: '역할 선택'
};

export const MENU_PERM_ROLE_PANEL = {
  MENU_TITLE_SUFFIX: ' 역할의 메뉴 권한',
  DESCRIPTION: '이 역할에 부여할 메뉴 접근 권한을 설정하세요.'
};

export const MENU_PERM_ACCESS = {
  VIEW: '조회',
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제'
};

export const MENU_PERM_HELP = {
  TITLE: '권한 부여 규칙:',
  RULE_MIN_ROLE: '최소 요구 역할보다 낮은 역할에게는 권한을 부여할 수 없습니다.',
  RULE_VIEW_FIRST: '조회 권한이 없으면 생성/수정/삭제 권한을 부여할 수 없습니다.',
  RULE_ADMIN: 'ADMIN 역할은 모든 메뉴에 접근할 수 있습니다.'
};
