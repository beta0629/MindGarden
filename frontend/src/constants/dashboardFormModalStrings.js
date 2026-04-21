/**
 * DashboardFormModal — 사용자 노출 한글 문자열
 *
 * @author Core Solution
 * @since 2026-04-21
 */

/** 대시보드 이름 자동 생성 접미사 (한글) */
export const DASHBOARD_FORM_NAME_KO_SUFFIX = ' 대시보드';

/** 대시보드 이름 자동 생성 접미사 (영문) — 템플릿용 */
export const DASHBOARD_FORM_NAME_EN_SUFFIX = ' Dashboard';

export const DASHBOARD_FORM_MSG = {
  NO_CREATABLE_ROLES:
    '생성 가능한 역할이 없습니다. 모든 역할에 대시보드가 이미 존재합니다. 새로운 역할을 먼저 생성해주세요.',
  ERR_LOAD_ROLES: '역할 목록을 불러오는 중 오류가 발생했습니다.',
  ERR_LOAD_ROLE_TEMPLATES: '역할 템플릿 목록을 불러오는 중 오류가 발생했습니다.',
  WARN_SELECT_TEMPLATE: '템플릿을 선택해주세요.',
  WARN_ENTER_ROLE_NAME: '역할 이름을 입력해주세요.',
  TOAST_ROLE_ADDED: '역할이 추가되었습니다.',
  ERR_ROLE_ADD_FALLBACK: '역할 추가 실패',
  ERR_ROLE_ADD_PROCESS: '역할 추가 중 오류가 발생했습니다.',
  TOAST_ROLE_DELETED: '역할이 삭제되었습니다.',
  ERR_ROLE_DELETE_FALLBACK: '역할 삭제 실패',
  ERR_ROLE_DELETE_PROCESS: '역할 삭제 중 오류가 발생했습니다.',
  VAL_CHECK_INPUT: '입력한 정보를 확인해주세요.',
  TOAST_CREATED_WITH_ROLE:
    '대시보드가 생성되었고, 현재 계정에 역할이 할당되었습니다. 대시보드를 바로 확인할 수 있습니다.',
  TOAST_CREATED_ROLE_ASSIGN_FAILED:
    '대시보드가 생성되었습니다. 역할 할당은 실패했습니다. 수동으로 역할을 할당해주세요.',
  TOAST_CREATED_ROLE_ASSIGN_NO_SESSION:
    '대시보드가 생성되었습니다. 역할 할당을 위해 로그인 정보를 확인할 수 없습니다.',
  TOAST_CREATED_ROLE_ASSIGN_ERROR:
    '대시보드가 생성되었습니다. 역할 할당 중 오류가 발생했습니다. 수동으로 역할을 할당해주세요.',
  TOAST_DASHBOARD_UPDATED: '대시보드가 수정되었습니다.',
  TOAST_DASHBOARD_CREATED: '대시보드가 생성되었습니다.',
  ERR_SAVE_FALLBACK: '대시보드 저장 실패',
  ERR_SAVE_PROCESS: '대시보드 저장 중 오류가 발생했습니다.',
  ERR_CONFLICT_DASHBOARD: '해당 역할에 이미 대시보드가 존재합니다.',
  ERR_FORBIDDEN: '접근 권한이 없습니다.',
  ERR_NOT_FOUND_DASHBOARD: '대시보드를 찾을 수 없습니다.'
};

/**
 * 역할 삭제 확인 문구
 *
 * @param {string} roleName 표시용 역할명
 * @returns {string}
 */
export const dashboardFormConfirmDeleteRole = (roleName) =>
  `"${roleName}" 역할을 삭제하시겠습니까?\n\n주의: 이 역할에 할당된 사용자가 있으면 삭제할 수 없습니다.`;

export const DASHBOARD_FORM_ERR_THROW = {
  TENANT_ID_MISSING: '테넌트 ID가 없습니다.'
};

/** 역할-사용자 할당 API 사유(한글) */
export const DASHBOARD_FORM_ASSIGNMENT_REASON_AUTO = '대시보드 생성 시 자동 할당';

export const DASHBOARD_FORM_VAL = {
  SELECT_ROLE: '역할을 선택해주세요.',
  DASHBOARD_ROLE_MISSING: '대시보드 역할 정보를 찾을 수 없습니다.',
  ROLE_INVALID_REOPEN: '선택된 역할이 유효하지 않습니다. 모달을 닫고 다시 열어주세요.',
  ENTER_DASHBOARD_NAME: '대시보드 이름을 입력해주세요.',
  SELECT_ROLE_FIRST: '역할을 먼저 선택해주세요.',
  INVALID_JSON: '올바른 JSON 형식이 아닙니다.'
};

export const DASHBOARD_FORM_MODAL = {
  TITLE_EDIT: '대시보드 수정',
  TITLE_CREATE: '새 대시보드 생성',
  TITLE_ADD_ROLE: '역할 추가',
  LOADING: '로딩중...'
};

export const DASHBOARD_FORM_BUTTON = {
  CANCEL: '취소',
  SAVE_EDIT: '수정',
  SAVE_CREATE: '생성',
  ADD_ROLE: '역할 추가',
  ADD_ROLE_SUBMIT: '역할 추가',
  ADD_ROLE_LOADING: '추가 중...',
  DELETE: '삭제'
};

export const DASHBOARD_FORM_FORM = {
  ROLE_LABEL: '역할',
  ROLE_PLACEHOLDER: '역할을 선택해주세요',
  ROLE_EMPTY_NO_DASHBOARD:
    '생성 가능한 역할이 없습니다. (모든 역할에 대시보드가 이미 존재합니다)',
  ROLE_LOADING: '역할 목록을 불러오는 중...',
  ASSIGN_ROLE_AFTER_CREATE: '대시보드 생성 후 현재 계정에 이 역할 자동 할당',
  ASSIGN_ROLE_HELP: '체크하면 대시보드 생성 후 바로 확인할 수 있습니다.',
  ROLE_MANAGE: '역할 관리',
  DELETE_ROLE_TITLE: '역할 삭제',
  DASHBOARD_NAME: '대시보드 이름',
  DASHBOARD_NAME_AUTO_HINT: '(역할 선택 시 자동 생성)',
  DASHBOARD_NAME_PH_AUTO: '역할을 선택하면 자동으로 생성됩니다',
  DASHBOARD_NAME_PH_SELECT_ROLE_FIRST: '역할을 먼저 선택해주세요',
  DASHBOARD_NAME_AUTO_SUCCESS: '✅ 역할 선택 시 자동으로 이름이 생성됩니다',
  DASHBOARD_NAME_EN: '대시보드 이름 (영문)',
  DASHBOARD_TYPE: '대시보드 타입',
  TYPE_PLACEHOLDER: '타입을 선택해주세요',
  ADVANCED_SUMMARY: '⚙️ 고급 설정 (선택사항)',
  DESCRIPTION: '설명',
  DESCRIPTION_PLACEHOLDER: '대시보드에 대한 설명을 입력해주세요 (선택사항)',
  DISPLAY_ORDER: '표시 순서',
  DISPLAY_ORDER_HELP: '숫자가 작을수록 먼저 표시됩니다. (기본값: 0)',
  IS_ACTIVE: '활성화',
  IS_DEFAULT: '기본 대시보드',
  IS_DEFAULT_EDIT_HELP: '기본 대시보드는 수정 시 변경할 수 없습니다.',
  WIDGET_SETTINGS: '위젯 설정',
  WIDGET_SETTINGS_HELP: '(드래그 앤 드롭으로 쉽게 편집)',
  WIDGET_EDIT_TITLE: '⚡ 위젯 편집',
  WIDGET_EDIT_SUBTITLE: '위젯을 클릭으로 추가하고 드래그로 배치하세요',
  WIDGET_GUIDE_TITLE: '💡 사용 방법',
  WIDGET_GUIDE_LOADING: '위젯 설정을 불러오는 중...',
  ROLE_TEMPLATE_LABEL: '역할 템플릿 선택',
  TEMPLATE_PLACEHOLDER: '템플릿을 선택해주세요',
  TEMPLATE_EMPTY: '사용 가능한 템플릿이 없습니다.',
  TEMPLATE_HELP:
    '템플릿을 선택하면 해당 템플릿의 권한과 기본 위젯 설정이 자동으로 적용됩니다.',
  NEW_ROLE_NAME_KO: '역할 이름 (한글)',
  NEW_ROLE_NAME_KO_PLACEHOLDER: '예: 원장, 상담사, 보조강사 등',
  NEW_ROLE_NAME_KO_HELP:
    '템플릿 선택 시 자동으로 채워지지만, 원하는 이름으로 변경할 수 있습니다.',
  NEW_ROLE_NAME_EN: '역할 이름 (영문)',
  ROLE_DESC_PLACEHOLDER: '역할에 대한 설명을 입력해주세요 (선택사항)'
};

/** 위젯 사용 안내 리스트 (strong 구간 분리) */
export const DASHBOARD_FORM_WIDGET_GUIDE = {
  CLICK: { before: '위젯을 ', strong: '클릭', after: '하여 추가' },
  DRAG: { before: '위젯을 ', strong: '드래그', after: '하여 위치 변경' },
  DELETE: { before: '', strong: '🗑️ 버튼', after: '으로 위젯 삭제' },
  CONFIG: { before: '', strong: '⚙️ 버튼', after: '으로 위젯 설정' }
};

export const DASHBOARD_FORM_TYPE_OPTION = {
  STUDENT: '학생',
  TEACHER: '선생님',
  ADMIN: '관리자',
  CLIENT: '내담자',
  CONSULTANT: '상담사',
  PRINCIPAL: '원장',
  DEFAULT: '기본'
};

/** Fallback 위젯 제목 (역할 메타 없을 때) */
export const DASHBOARD_FORM_WIDGET_TITLE = {
  MY_SCHEDULE: '내 일정',
  NOTIFICATION: '알림',
  SCHEDULE: '일정',
  STATS: '통계',
  WELCOME: '환영합니다',
  STATS_SUMMARY: '통계 요약',
  RECENT_ACTIVITY: '최근 활동'
};

/** 역할 키워드 매칭 (한글) — Fallback 위젯 분기 */
export const DASHBOARD_FORM_ROLE_KEY = {
  STUDENT: '학생',
  TEACHER_ALT1: '선생님',
  TEACHER_ALT2: '교사',
  ADMIN: '관리자'
};
