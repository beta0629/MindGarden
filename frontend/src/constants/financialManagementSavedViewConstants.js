import { FM_TRANSACTION_DEFAULT_VIEW_MODE } from './financialManagementStrings';

/** Saved View localStorage pageId SSOT — viewMode pageId와 동일 값 */
export const FM_SAVED_VIEW_PAGE_ID = 'erp.financial.transactions';

export const FM_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const FM_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

/**
 * FinancialManagement Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildFinancialManagementDefaultSavedView = (
  viewMode = FM_TRANSACTION_DEFAULT_VIEW_MODE
) => ({
  viewMode,
  filters: {},
  sort: {},
  density: FM_SAVED_VIEW_DENSITY_COMFORTABLE
});
