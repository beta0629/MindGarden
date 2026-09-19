/**
 * ERP 재무 대시보드 표시용 포맷 (날짜·행 키·결제수단 괄호 표시)
 *
 * @author CoreSolution
 * @since 2026-04-05
 */

import {
  getMappingPaymentMethodDisplayLabel,
  MAPPING_PAYMENT_METHOD_LABELS
} from '../constants/billing';

/** trailing 디버그 브래킷 1개 (` [정확한금액: …]` 등) */
const TRAILING_DEBUG_BRACKET_RE = /\s*\[[^\]]*\]\s*$/u;

/** description 내 괄호 블록 `(…)` — 순수 enum 및 혼합 텍스트 */
const PAYMENT_METHOD_PAREN_BLOCK_RE = /\(([^)]+)\)/g;

/**
 * 표시용: trailing `[…]` 블록을 모두 제거한다. 저장값·API는 변경하지 않음.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripTrailingDebugBrackets(text) {
  let result = text == null ? '' : String(text);
  while (TRAILING_DEBUG_BRACKET_RE.test(result)) {
    result = result.replace(TRAILING_DEBUG_BRACKET_RE, '').trimEnd();
  }
  return result;
}

/**
 * SSOT `MAPPING_PAYMENT_METHOD_LABELS` 키가 괄호 안에 있으면 운영자 한국어 라벨로 치환.
 * - 순수 `(BANK_TRANSFER)` → `(계좌이체)`
 * - 혼합 `(1회 추가, CREDIT_CARD)` → `(1회 추가, 신용카드)` (맵 키만 단어 경계 치환)
 * codeValue 병합(MEAL/EAT 등) 없음. 표시만 변경.
 *
 * @param {string} text
 * @returns {string}
 */
export function localizePaymentMethodParens(text) {
  if (text == null || text === '') {
    return text == null ? '' : text;
  }
  return String(text).replace(PAYMENT_METHOD_PAREN_BLOCK_RE, (match, inner) => {
    const trimmed = String(inner).trim();
    if (Object.prototype.hasOwnProperty.call(MAPPING_PAYMENT_METHOD_LABELS, trimmed)) {
      return `(${getMappingPaymentMethodDisplayLabel(trimmed)})`;
    }
    let localized = String(inner);
    const keys = Object.keys(MAPPING_PAYMENT_METHOD_LABELS);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const tokenRe = new RegExp(`\\b${key}\\b`, 'g');
      localized = localized.replace(tokenRe, MAPPING_PAYMENT_METHOD_LABELS[key]);
    }
    return `(${localized})`;
  });
}

/**
 * 브라우저 로컬 캘린더 기준 `YYYY-MM-DD`. API·폼과 UTC `toISOString()` 날짜 불일치 방지.
 *
 * @param {Date} date
 * @returns {string}
 */
export const formatLocalDateYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * 장부 목록용 일시 표시 — 날짜 + 시:분 (createdAt 우선, 없으면 transactionDate).
 *
 * @param {object|string|Date|null|undefined} txOrDate
 * @returns {string}
 */
export const formatLedgerDateTime = (txOrDate) => {
  if (txOrDate == null || txOrDate === '') {
    return '—';
  }
  let raw = txOrDate;
  if (typeof txOrDate === 'object' && !(txOrDate instanceof Date)) {
    raw = txOrDate.createdAt
      ?? txOrDate.approvedAt
      ?? txOrDate.transactionDate
      ?? txOrDate.date
      ?? null;
  }
  if (raw == null || raw === '') {
    return '—';
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d, h = 0, min = 0] = raw;
    const hh = String(h).padStart(2, '0');
    const mm = String(min).padStart(2, '0');
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${hh}:${mm}`;
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    return s.slice(0, 16).replace('T', ' ');
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    return s.slice(0, 16);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    const hh = String(parsed.getHours()).padStart(2, '0');
    const mm = String(parsed.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }
  return s.length > 16 ? s.slice(0, 16) : s;
};

/**
 * Path B 비고에서 orderPublicId·paymentId 파싱.
 * 형식: {@code orderPublicId=...; paymentId=...}
 *
 * @param {string|null|undefined} remarks
 * @returns {{ orderPublicId: string|null, paymentId: string|null }}
 */
export const parseShopOrderRemarks = (remarks) => {
  const empty = { orderPublicId: null, paymentId: null };
  if (remarks == null || remarks === '') {
    return empty;
  }
  const text = String(remarks);
  const orderMatch = text.match(/orderPublicId=([^;\s]+)/);
  const paymentMatch = text.match(/paymentId=([^;\s]+)/);
  const orderPublicId = orderMatch && orderMatch[1] && orderMatch[1] !== '-'
    ? orderMatch[1]
    : null;
  const paymentId = paymentMatch && paymentMatch[1] && paymentMatch[1] !== '-'
    ? paymentMatch[1]
    : null;
  return { orderPublicId, paymentId };
};

/**
 * 환불·매출취소 행 여부 (장부 파란 구분용).
 *
 * @param {object} tx
 * @returns {boolean}
 */
export const isLedgerRefundOrRevenueCancelRow = (tx) => {
  if (!tx || typeof tx !== 'object') {
    return false;
  }
  const type = String(tx.transactionType || '').toUpperCase();
  if (type !== 'EXPENSE') {
    return false;
  }
  const sub = String(tx.subcategory || '').toUpperCase();
  if (sub.includes('REFUND') || sub.includes('CANCEL')) {
    return true;
  }
  const related = String(tx.relatedEntityType || '').toUpperCase();
  if (related.includes('REFUND')) {
    return true;
  }
  const desc = String(tx.description || '');
  return desc.includes('환불') || desc.includes('매출취소') || desc.includes('매출 취소');
};

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
