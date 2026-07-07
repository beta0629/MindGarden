/** Saved View localStorage pageId SSOT */
export const CONSULTATION_LOG_VIEW_SAVED_VIEW_PAGE_ID = 'admin.consultation-logs.view';

export const CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE = 'list';

export const CONSULTATION_LOG_VIEW_ALLOWED_VIEW_MODES = ['list', 'calendar', 'table'];

export const CONSULTATION_LOG_VIEW_SAVED_VIEW_DENSITY_COMFORTABLE = 'comfortable';

/** viewMode·filters 변경 시 debounced persist 지연(ms) */
export const CONSULTATION_LOG_VIEW_SAVED_VIEW_PERSIST_DEBOUNCE_MS = 300;

export const CONSULTATION_LOG_VIEW_SAVED_VIEW_ROW_ARIA_LABEL = '저장된 뷰';

/** 진입 시 기본 표시 기간 = "지난 달 1일 ~ 이번 달 말일" */
export const CONSULTATION_LOG_VIEW_DEFAULT_RANGE_MONTHS_BEFORE = 1;

/**
 * 기본 기간 (지난 달 1일 ~ 이번 달 말일) 을 ISO yyyy-MM-dd 문자열로 계산.
 *
 * @param {Date} [now] 기준 일시 (테스트에서 주입 가능)
 * @returns {{ startDate: string, endDate: string }}
 */
export const computeDefaultDateRange = (now = new Date()) => {
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month - CONSULTATION_LOG_VIEW_DEFAULT_RANGE_MONTHS_BEFORE, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
};

/**
 * consultation-logs Saved View v1 기본 payload
 *
 * @param {string} [viewMode] - viewMode 기본값
 * @param {Date} [now] - 기본 기간 계산 기준
 * @returns {{ viewMode: string, filters: object, sort: object, density: string }}
 */
export const buildConsultationLogViewDefaultSavedView = (
  viewMode = CONSULTATION_LOG_VIEW_DEFAULT_VIEW_MODE,
  now = new Date()
) => {
  const { startDate, endDate } = computeDefaultDateRange(now);
  return {
    viewMode,
    filters: {
      consultantId: null,
      clientId: null,
      startDate,
      endDate
    },
    sort: {},
    density: CONSULTATION_LOG_VIEW_SAVED_VIEW_DENSITY_COMFORTABLE
  };
};
