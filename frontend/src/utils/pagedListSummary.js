/**
 * 공통 페이징 안내 문구 — 「1페이지 / 총 N페이지」
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

/**
 * @param {object} params
 * @param {number|null|undefined} params.total
 * @param {number} params.page 1-based
 * @param {number} params.pageSize
 * @param {number|null|undefined} [params.totalPages]
 * @returns {{ total: number, start: number, end: number, page: number, totalPages: number }}
 */
export const resolvePagedListRange = ({ total, page, pageSize, totalPages }) => {
  const safeTotal = Number.isFinite(Number(total)) ? Math.max(0, Math.floor(Number(total))) : 0;
  const safePageSize = Math.max(1, Math.floor(Number(pageSize)) || 1);
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const computedPages = safeTotal === 0 ? 1 : Math.ceil(safeTotal / safePageSize);
  const safeTotalPages = Number.isFinite(Number(totalPages)) && Number(totalPages) > 0
    ? Math.floor(Number(totalPages))
    : computedPages;
  const start = safeTotal === 0 ? 0 : ((safePage - 1) * safePageSize) + 1;
  const end = Math.min(safePage * safePageSize, safeTotal);
  return {
    total: safeTotal,
    start,
    end,
    page: safePage,
    totalPages: Math.max(1, safeTotalPages)
  };
};

/**
 * @param {object} params
 * @param {(key: string, options?: object) => string} params.t
 * @param {string} [params.i18nKey]
 * @param {number|null|undefined} params.total
 * @param {number} params.page
 * @param {number} params.pageSize
 * @param {number|null|undefined} [params.totalPages]
 * @returns {string}
 */
export const buildPagedListSummaryLabel = ({
  t,
  i18nKey = 'common:pagination.rangeSummary',
  total,
  page,
  pageSize,
  totalPages
}) => {
  const range = resolvePagedListRange({ total, page, pageSize, totalPages });
  if (typeof t === 'function') {
    return t(i18nKey, range);
  }
  return `${range.page}페이지 / 총 ${range.totalPages}페이지`;
};

export default buildPagedListSummaryLabel;
