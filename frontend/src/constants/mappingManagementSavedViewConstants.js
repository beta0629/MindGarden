/** Saved View localStorage pageId SSOT — viewMode pageId와 동일 값 */
export const MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID = 'admin.mapping-management.list';

/** PER_PAGE G1-04: 매칭 목록 기본 보기 = 테이블 */
export const MAPPING_LIST_DEFAULT_VIEW_MODE = 'table';

export const MAPPING_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const MAPPING_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const MAPPING_MANAGEMENT_DEFAULT_FILTER_STATUS = 'ALL';

export const MAPPING_MANAGEMENT_DEFAULT_SEARCH_TERM = '';

/**
 * mapping-management Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildMappingManagementDefaultSavedView = (
  viewMode = MAPPING_LIST_DEFAULT_VIEW_MODE
) => ({
  viewMode,
  filters: {
    filterStatus: MAPPING_MANAGEMENT_DEFAULT_FILTER_STATUS,
    searchTerm: MAPPING_MANAGEMENT_DEFAULT_SEARCH_TERM
  },
  sort: {},
  density: MAPPING_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE
});
