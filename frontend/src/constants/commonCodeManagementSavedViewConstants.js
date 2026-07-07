/** Saved View localStorage pageId SSOT */
export const COMMON_CODE_MANAGEMENT_SAVED_VIEW_PAGE_ID = 'admin.common-codes';

export const COMMON_CODE_MANAGEMENT_DEFAULT_VIEW_MODE = 'list';

export const COMMON_CODE_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const COMMON_CODE_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const COMMON_CODE_MANAGEMENT_SAVED_VIEW_ROW_ARIA_LABEL = '저장된 뷰';

export const COMMON_CODE_MANAGEMENT_DEFAULT_SEARCH_TERM = '';

export const COMMON_CODE_MANAGEMENT_DEFAULT_CATEGORY_FILTER = 'all';

/**
 * common-codes Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildCommonCodeManagementDefaultSavedView = (
  viewMode = COMMON_CODE_MANAGEMENT_DEFAULT_VIEW_MODE
) => ({
  viewMode,
  filters: {
    searchTerm: COMMON_CODE_MANAGEMENT_DEFAULT_SEARCH_TERM,
    categoryFilter: COMMON_CODE_MANAGEMENT_DEFAULT_CATEGORY_FILTER
  },
  sort: {},
  density: COMMON_CODE_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE
});
