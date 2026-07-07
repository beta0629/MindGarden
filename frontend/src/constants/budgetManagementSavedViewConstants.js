/** Saved View localStorage pageId SSOT */
export const BM_SAVED_VIEW_PAGE_ID = 'erp.budget.management';

export const BM_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const BM_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const BM_DEFAULT_ACTIVE_TAB = 'budgets';
export const BM_DEFAULT_FILTER_CATEGORY = 'all';
export const BM_DEFAULT_FILTER_STATUS = 'all';
export const BM_DEFAULT_VIEW_MODE = 'list';

/**
 * BudgetManagement Saved View v1 기본 payload
 *
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildBudgetManagementDefaultSavedView = () => ({
  viewMode: BM_DEFAULT_VIEW_MODE,
  filters: {
    activeTab: BM_DEFAULT_ACTIVE_TAB,
    category: BM_DEFAULT_FILTER_CATEGORY,
    status: BM_DEFAULT_FILTER_STATUS
  },
  sort: {},
  density: BM_SAVED_VIEW_DENSITY_COMFORTABLE
});
