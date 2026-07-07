/** Saved View localStorage pageId SSOT — viewMode pageId와 동일 값 */
export const CONSULTATION_LOG_VIEW_SAVED_VIEW_PAGE_ID = 'admin.consultation-logs';

export const CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE = 'list';

export const CONSULTATION_LOG_VIEW_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const CONSULTATION_LOG_VIEW_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const CONSULTATION_LOG_VIEW_SAVED_VIEW_ROW_ARIA_LABEL = '저장된 뷰';

export const CONSULTATION_LOG_VIEW_DEFAULT_CONSULTANT_ID = null;

export const CONSULTATION_LOG_VIEW_DEFAULT_CLIENT_ID = null;

/**
 * consultation-logs Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @param {{ startDate?: string|null, endDate?: string|null }} [dateRange] - 기본 기간
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildConsultationLogViewDefaultSavedView = (
  viewMode = CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE,
  { startDate = null, endDate = null } = {}
) => ({
  viewMode,
  filters: {
    consultantId: CONSULTATION_LOG_VIEW_DEFAULT_CONSULTANT_ID,
    clientId: CONSULTATION_LOG_VIEW_DEFAULT_CLIENT_ID,
    startDate,
    endDate
  },
  sort: {},
  density: CONSULTATION_LOG_VIEW_SAVED_VIEW_DENSITY_COMFORTABLE
});
