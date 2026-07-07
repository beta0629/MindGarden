import { SIDEBAR_DENSITY_COMFORTABLE } from '../components/admin/mapping-management/constants/integratedScheduleSidebarDensityConstants';
import { VIEW_FILTER_NEW } from '../components/admin/mapping-management/constants/integratedScheduleSidebarFilterConstants';

/** Saved View localStorage pageId SSOT */
export const INTEGRATED_SCHEDULE_SAVED_VIEW_PAGE_ID = 'admin.integrated-schedule.sidebar';

export const INTEGRATED_SCHEDULE_SAVED_VIEW_DENSITY_COMFORTABLE = SIDEBAR_DENSITY_COMFORTABLE;

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const INTEGRATED_SCHEDULE_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const INTEGRATED_SCHEDULE_DEFAULT_VIEW_FILTER = VIEW_FILTER_NEW;

export const INTEGRATED_SCHEDULE_DEFAULT_STATUS_FILTER = 'ongoing';

export const INTEGRATED_SCHEDULE_DEFAULT_SELECTED_CLIENT_IDS = [];

/**
 * 통합 스케줄 Saved View v1 기본 payload
 *
 * @param {string} [density] - 사이드바 밀도 기본값
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildIntegratedScheduleDefaultSavedView = (
  density = INTEGRATED_SCHEDULE_SAVED_VIEW_DENSITY_COMFORTABLE
) => ({
  viewMode: 'integrated',
  filters: {
    viewFilter: INTEGRATED_SCHEDULE_DEFAULT_VIEW_FILTER,
    statusFilter: INTEGRATED_SCHEDULE_DEFAULT_STATUS_FILTER,
    selectedClientIds: INTEGRATED_SCHEDULE_DEFAULT_SELECTED_CLIENT_IDS
  },
  sort: {},
  density
});
