/**
 * ERP 재무 대시보드 표시용 포맷 (날짜·행 키)
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

/**
 * 재무 대시보드 최근 거래 행의 날짜 표시.
 * 백엔드 getBranchFinancialData는 Map에 `date`(ISO 문자열)를 쓰고, DTO 응답은 `transactionDate`를 쓸 수 있음.
 *
 * @param {object} tx - 거래 객체
 * @returns {string}
 */
export const formatRecentTransactionDate = (tx) => {
  if (!tx || typeof tx !== 'object') return '—';
  const raw = tx.transactionDate ?? tx.date ?? tx.createdAt ?? tx.valueDate ?? tx.postedAt;
  if (raw == null || raw === '') return '—';
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d] = raw;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.slice(0, 10);
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }
  return s.length > 10 ? s.slice(0, 10) : s;
};

/**
 * 최근 거래 테이블 행 key (id 없을 때 날짜·금액·유형 조합)
 *
 * @param {object} tx
 * @returns {string}
 */
export const buildRecentTransactionRowKey = (tx) =>
  tx.id ??
  `${formatRecentTransactionDate(tx)}-${tx.amount}-${tx.type ?? tx.transactionType ?? ''}`;
