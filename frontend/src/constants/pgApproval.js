/**
 * PG 승인(Ops) SSOT 라벨·마스킹 헬퍼
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

export const PG_APPROVAL_COPY = Object.freeze({
  DETAIL: '상세보기',
  TEST_CONNECTION: '연결 시험',
  REVIEW_APPROVE: '승인 검토',
  REJECT: '거부',
  SUBMIT_APPROVE: '승인 확정으로 진행',
  CONFIRM_APPROVE: '승인 확정',
  CONFIRM_REJECT: '거부 확정',
  CANCEL: '취소',
  CENTER: '센터',
  CENTER_ID: '센터 ID',
  PG: 'PG',
  MERCHANT: '가맹',
  RESULT: '결과',
  RESULT_ACTIVE: '사용중으로 전환',
  CONFIRM_APPROVE_TITLE: '승인 검토 확인',
  CONFIRM_REJECT_TITLE: '거부 확인',
  MERCHANT_EMPTY: '—'
});

/**
 * 가맹 ID 마스킹: 앞 2~4 + **** + 뒤 2~4. 짧으면 ****.
 *
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function maskMerchantId(value) {
  if (value == null) {
    return PG_APPROVAL_COPY.MERCHANT_EMPTY;
  }
  const raw = String(value).trim();
  if (!raw) {
    return PG_APPROVAL_COPY.MERCHANT_EMPTY;
  }
  if (raw.length <= 4) {
    return '****';
  }
  if (raw.length <= 8) {
    return `${raw.slice(0, 2)}****${raw.slice(-2)}`;
  }
  return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
}

/**
 * 센터 표시명 — 없으면 tenantId/센터 ID
 *
 * @param {{ centerName?: string, tenantName?: string, tenantId?: string }} config
 * @returns {string}
 */
export function resolveCenterDisplayName(config) {
  if (!config) {
    return PG_APPROVAL_COPY.MERCHANT_EMPTY;
  }
  const name = config.centerName || config.tenantName;
  if (name && String(name).trim()) {
    return String(name).trim();
  }
  if (config.tenantId && String(config.tenantId).trim()) {
    return String(config.tenantId).trim();
  }
  return PG_APPROVAL_COPY.MERCHANT_EMPTY;
}

/**
 * PG 표시명 — provider/name
 *
 * @param {{ pgName?: string, pgProvider?: string }} config
 * @returns {string}
 */
export function resolvePgDisplayName(config) {
  if (!config) {
    return PG_APPROVAL_COPY.MERCHANT_EMPTY;
  }
  if (config.pgName && String(config.pgName).trim()) {
    return String(config.pgName).trim();
  }
  if (config.pgProvider && String(config.pgProvider).trim()) {
    return String(config.pgProvider).trim();
  }
  return PG_APPROVAL_COPY.MERCHANT_EMPTY;
}
