/**
 * ERP 승인 대시보드 공통 표시 포맷
 *
 * @author CoreSolution
 * @since 2026-04-09
 */

/**
 * @param {number} amount
 * @returns {string}
 */
export const formatApprovalCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

/**
 * @param {string} dateString
 * @returns {string}
 */
export const formatApprovalDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
