/** Saved View localStorage pageId SSOT */
export const RM_SAVED_VIEW_PAGE_ID = 'erp.refund.management';

export const RM_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const RM_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const RM_DEFAULT_SELECTED_PERIOD = 'month';
export const RM_DEFAULT_SELECTED_STATUS = 'all';
export const RM_DEFAULT_REFUND_VIEW_MODE = 'table';

/**
 * RefundManagement Saved View v1 기본 payload
 *
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildRefundManagementDefaultSavedView = () => ({
  viewMode: RM_DEFAULT_REFUND_VIEW_MODE,
  filters: {
    selectedPeriod: RM_DEFAULT_SELECTED_PERIOD,
    selectedStatus: RM_DEFAULT_SELECTED_STATUS,
    refundViewMode: RM_DEFAULT_REFUND_VIEW_MODE
  },
  sort: {},
  density: RM_SAVED_VIEW_DENSITY_COMFORTABLE
});
