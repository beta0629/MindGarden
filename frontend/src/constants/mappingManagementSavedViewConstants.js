/** Saved View localStorage pageId SSOT — viewMode pageId와 동일 값 */
export const MAPPING_MANAGEMENT_SAVED_VIEW_PAGE_ID = 'admin.mapping-management.list';

/** Clinic-OS TO-BE: 배정 목록 기본 보기 = 리스트(기존 MappingTableView) */
export const MAPPING_LIST_DEFAULT_VIEW_MODE = 'list';

/** 이 페이지 허용 viewMode — calendar 제거. legacy table|calendar → list */
export const MAPPING_LIST_ALLOWED_VIEW_MODES = ['list', 'card'];

/** ViewModeToggle 라벨: 리스트 / 카드 */
export const MAPPING_LIST_VIEW_MODE_OPTIONS = [
  { value: 'list', label: '리스트' },
  { value: 'card', label: '카드' }
];

export const MAPPING_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const MAPPING_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const MAPPING_MANAGEMENT_DEFAULT_FILTER_STATUS = 'ALL';

export const MAPPING_MANAGEMENT_DEFAULT_SEARCH_TERM = '';

/**
 * legacy viewMode 정규화: table|calendar → list, 그 외 허용값만 유지
 *
 * @param {string} [mode]
 * @returns {'list'|'card'}
 */
export const normalizeMappingListViewMode = (mode) => {
  if (mode === 'card') {
    return 'card';
  }
  if (mode === 'list') {
    return 'list';
  }
  return MAPPING_LIST_DEFAULT_VIEW_MODE;
};

/**
 * mapping-management Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildMappingManagementDefaultSavedView = (
  viewMode = MAPPING_LIST_DEFAULT_VIEW_MODE
) => ({
  viewMode: normalizeMappingListViewMode(viewMode),
  filters: {
    filterStatus: MAPPING_MANAGEMENT_DEFAULT_FILTER_STATUS,
    searchTerm: MAPPING_MANAGEMENT_DEFAULT_SEARCH_TERM
  },
  sort: {},
  density: MAPPING_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE
});
