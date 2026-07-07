/**
 * TenantCommonCodeManager — 테이블·필터·Side Peek 상수 (G5-02)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

export const TENANT_COMMON_CODE_FILTER_ALL = 'all';
export const TENANT_COMMON_CODE_FILTER_ACTIVE = 'active';
export const TENANT_COMMON_CODE_FILTER_INACTIVE = 'inactive';

export const TENANT_COMMON_CODE_TABLE_COLUMNS = {
  CODE_ID: '코드 ID',
  CODE_NAME: '코드명',
  GROUP_NAME: '소속 그룹',
  OVERRIDE: '오버라이드',
  STATUS: '사용 상태',
  ACTIONS: '액션'
};

export const TENANT_COMMON_CODE_TABLE_COLUMN_KEYS = {
  CODE_VALUE: 'codeValue',
  CODE_LABEL: 'codeLabel',
  CODE_GROUP: 'codeGroup',
  OVERRIDE: 'overrideStatus',
  IS_ACTIVE: 'isActive',
  ACTIONS: '_actions'
};

export const TENANT_COMMON_CODE_OVERRIDE_LABELS = {
  OVERRIDE: '오버라이드',
  TENANT_ONLY: '테넌트 전용',
  GLOBAL_MATCH: '글로벌 동일'
};

export const TENANT_COMMON_CODE_ROW_ACTIONS = {
  EDIT: '수정',
  DELETE: '삭제',
  RESET_GLOBAL: '글로벌 초기화',
  ACTIVATE: '활성화',
  DEACTIVATE: '비활성화'
};

export const TENANT_COMMON_CODE_PEEK_LAYOUT_CLASS = 'tenant-common-code__peek-layout';
export const TENANT_COMMON_CODE_PEEK_LAYOUT_OPEN_MODIFIER = 'tenant-common-code__peek-layout--peek-open';
export const TENANT_COMMON_CODE_MAIN_REGION_CLASS = 'tenant-common-code__main-region';

export const TENANT_COMMON_CODE_TABLE_ARIA = {
  ROW_ACTIONS: '테넌트 공통코드 행 작업',
  TABLE: '테넌트 공통코드 목록'
};

export const TENANT_COMMON_CODE_FILTER_LABELS = {
  GROUP: '코드 그룹',
  STATUS: '사용 여부',
  SEARCH: '코드 검색'
};
