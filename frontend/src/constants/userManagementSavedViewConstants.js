import { USER_MANAGEMENT_DEFAULT_VIEW_MODE } from '../components/common/ViewModeToggle';

/** Saved View localStorage pageId SSOT — viewMode pageId와 동일 값 */
export const USER_MANAGEMENT_SAVED_VIEW_PAGE_IDS = {
  client: 'admin.user-management.client',
  consultant: 'admin.user-management.consultant',
  staff: 'admin.user-management.staff'
};

export const USER_MANAGEMENT_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

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
