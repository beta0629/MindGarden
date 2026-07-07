import { USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../components/common/ViewModeToggle';

/** Saved View localStorage pageId SSOT — viewMode pageId와 동일 값 */
export const USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS = {
  client: 'admin.user-management.client',
  consultant: 'admin.user-management.consultant',
  staff: 'admin.user-management.staff'
};

export const USER_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** Named views v1 — readonly 기본 뷰 */
export const USER_MANAGEMENT_SAVED_VIEW_DEFAULT_ID = 'default';
export const USER_MANAGEMENT_SAVED_VIEW_DEFAULT_LABEL = '기본값';

/** 저장 뷰 이름 최대 길이 */
export const USER_MANAGEMENT_SAVED_VIEW_LABEL_MAX_LENGTH = 20;

/** Chip 대신 드롭다운으로 전환하는 저장 뷰 개수 임계값 */
export const USER_MANAGEMENT_SAVED_VIEW_CHIP_DROPDOWN_THRESHOLD = 4;

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const USER_MANAGEMENT_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

/**
 * user-management Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildUserManagementDefaultSavedView = (
  viewMode = USER_MANAGEMENT_DEFAULT_VIEW_MODE
) => ({
  viewMode,
  filters: {},
  sort: {},
  density: USER_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE
});
