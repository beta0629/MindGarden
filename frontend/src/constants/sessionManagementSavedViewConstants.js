/** Saved View localStorage pageId SSOT — viewMode pageId와 동일 값 */
export const SESSION_MANAGEMENT_SAVED_VIEW_PAGE_ID = 'admin.session-management';

/** 회기 관리 목록 기본 보기 모드 (ViewModeToggle 도입 시 list/card B0KlA 정합) */
export const SESSION_MANAGEMENT_DEFAULT_VIEW_MODE = 'list';

export const SESSION_MANAGEMENT_ALLOWED_VIEW_MODES = ['list', 'card'];

export const SESSION_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const SESSION_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const SESSION_MANAGEMENT_DEFAULT_FILTER_STATUS = 'ALL';

export const SESSION_MANAGEMENT_DEFAULT_SEARCH_TERM = '';

export const SESSION_MANAGEMENT_DEFAULT_ACTIVE_TAB = 'quick';

/**
 * session-management Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildSessionManagementDefaultSavedView = (
  viewMode = SESSION_MANAGEMENT_DEFAULT_VIEW_MODE
) => ({
  viewMode,
  filters: {
    searchTerm: SESSION_MANAGEMENT_DEFAULT_SEARCH_TERM,
    filterStatus: SESSION_MANAGEMENT_DEFAULT_FILTER_STATUS,
    activeTab: SESSION_MANAGEMENT_DEFAULT_ACTIVE_TAB
  },
  sort: {},
  density: SESSION_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE
});
