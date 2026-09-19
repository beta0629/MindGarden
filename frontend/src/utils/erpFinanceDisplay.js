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
 * 값에 시·분 정보가 있는지 (date-only `YYYY-MM-DD` / `[y,m,d]` 는 false).
 *
 * @param {*} raw
 * @returns {boolean}
 */
const hasLedgerTimeComponent = (raw) => {
  if (raw == null || raw === '') {
    return false;
  }
  if (raw instanceof Date) {
    return !Number.isNaN(raw.getTime());
  }
  if (Array.isArray(raw)) {
    return raw.length >= 5 || (raw.length >= 4 && raw[3] != null);
  }
  if (typeof raw === 'object') {
    return false;
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    return true;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    return true;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return false;
  }
  const parsed = new Date(s);
  return !Number.isNaN(parsed.getTime());
};

/**
 * 장부 행에서 일시 원본을 고른다. createdAt/approvedAt(시간) 우선.
 * transactionDate가 date-only여도 createdAt이 있으면 createdAt 사용.
 *
 * @param {object} tx
 * @returns {*}
 */
const pickLedgerDateTimeRaw = (tx) => {
  const candidates = [
    tx.createdAt,
    tx.approvedAt,
    tx.transactionDate,
    tx.date,
    tx.valueDate,
    tx.postedAt
  ];
  const withTime = candidates.find((c) => c != null && c !== '' && hasLedgerTimeComponent(c));
  if (withTime != null) {
    return withTime;
  }
  return candidates.find((c) => c != null && c !== '') ?? null;
};

/**
 * 단일 원본 값을 `YYYY-MM-DD HH:mm` 로 포맷. 파싱 가능하면 시·분 포함.
 *
 * @param {*} raw
 * @returns {string|null} 파싱 실패 시 null
 */
const formatLedgerDateTimeRaw = (raw) => {
  if (raw == null || raw === '') {
    return null;
  }
  if (Array.isArray(raw) && raw.length >= 3) {
    const [y, m, d, h = 0, min = 0] = raw;
    const hh = String(h).padStart(2, '0');
    const mm = String(min).padStart(2, '0');
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${hh}:${mm}`;
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, '0');
    const d = String(raw.getDate()).padStart(2, '0');
    const hh = String(raw.getHours()).padStart(2, '0');
    const mm = String(raw.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    return s.slice(0, 16).replace('T', ' ');
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    return s.slice(0, 16);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s} 00:00`;
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
  return null;
};

/**
 * 장부 목록용 일시 표시 — 항상 `YYYY-MM-DD HH:mm` (파싱 가능 시).
 * 객체면 createdAt/approvedAt(시간) 우선, date-only transactionDate만 있으면 00:00.
 *
 * @param {object|string|Date|null|undefined} txOrDate
 * @returns {string}
 */
export const formatLedgerDateTime = (txOrDate) => {
  if (txOrDate == null || txOrDate === '') {
    return '—';
  }
  let raw = txOrDate;
  if (typeof txOrDate === 'object' && !(txOrDate instanceof Date) && !Array.isArray(txOrDate)) {
    raw = pickLedgerDateTimeRaw(txOrDate);
  }
  const formatted = formatLedgerDateTimeRaw(raw);
  if (formatted != null) {
    return formatted;
  }
  if (raw == null || raw === '') {
    return '—';
  }
  const s = String(raw).trim();
  return s.length > 16 ? s.slice(0, 16) : s;
};

/**
 * 식별자 후보에서 표시 가능한 첫 값 (빈·`-` 제외).
 *
 * @param {...*} vals
 * @returns {string|null}
 */
const pickLedgerIdentifier = (...vals) => {
  for (let i = 0; i < vals.length; i += 1) {
    const v = vals[i];
    if (v == null || v === '') {
      continue;
    }
    const s = String(v).trim();
    if (s && s !== '-') {
      return s;
    }
  }
  return null;
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
  const orderMatch = text.match(/orderPublicId=([^;\s]+)/) ||
    text.match(/orderId=([^;\s]+)/) ||
    text.match(/orderNumber=([^;\s]+)/);
  const paymentMatch = text.match(/paymentId=([^;\s]+)/) ||
    text.match(/payId=([^;\s]+)/);
  const orderPublicId = orderMatch && orderMatch[1] && orderMatch[1] !== '-'
    ? orderMatch[1]
    : null;
  const paymentId = paymentMatch && paymentMatch[1] && paymentMatch[1] !== '-'
    ? paymentMatch[1]
    : null;
  return { orderPublicId, paymentId };
};

/**
 * 장부 행에서 주문·결제 식별자 해석.
 * tx 필드(orderPublicId/orderId/paymentId/relatedPaymentId) + remarks 파싱을 병합.
 *
 * @param {object|null|undefined} tx
 * @returns {{ orderPublicId: string|null, paymentId: string|null }}
 */
export const resolveLedgerShopIdentifiers = (tx) => {
  if (!tx || typeof tx !== 'object') {
    return { orderPublicId: null, paymentId: null };
  }
  const fromRemarks = parseShopOrderRemarks(tx.remarks);
  return {
    orderPublicId: pickLedgerIdentifier(
      tx.orderPublicId,
      tx.orderId,
      tx.orderNumber,
      tx.orderNo,
      fromRemarks.orderPublicId
    ),
    paymentId: pickLedgerIdentifier(
      tx.paymentId,
      tx.relatedPaymentId,
      fromRemarks.paymentId
    )
  };
};

/**
 * 환불 EXPENSE와 입금 INCOME 간의 연관성 점수 계산.
 * - orderPublicId 또는 paymentId 일치 시 매핑
 * - relatedEntityId가 같으면 높은 가중치 부여 (동일 매핑 우선 결합)
 * - order/payment 키가 없더라도 relatedEntityId가 같으면 연결 허용
 *
 * @param {object} refundTx
 * @param {object} incomeTx
 * @returns {number} 매칭 점수 (0이면 불일치)
 */
const computeRefundIncomeMatchScore = (refundTx, incomeTx) => {
  if (!refundTx || !incomeTx) {
    return 0;
  }
  if (String(incomeTx.transactionType || '').toUpperCase() !== 'INCOME') {
    return 0;
  }

  const refundIds = resolveLedgerShopIdentifiers(refundTx);
  const incomeIds = resolveLedgerShopIdentifiers(incomeTx);

  const orderMatch = Boolean(
    refundIds.orderPublicId &&
    incomeIds.orderPublicId &&
    refundIds.orderPublicId === incomeIds.orderPublicId
  );
  const paymentMatch = Boolean(
    refundIds.paymentId &&
    incomeIds.paymentId &&
    refundIds.paymentId === incomeIds.paymentId
  );

  const refundEntityId = refundTx.relatedEntityId != null && String(refundTx.relatedEntityId).trim() !== ''
    ? String(refundTx.relatedEntityId)
    : null;
  const incomeEntityId = incomeTx.relatedEntityId != null && String(incomeTx.relatedEntityId).trim() !== ''
    ? String(incomeTx.relatedEntityId)
    : null;
  const entityMatch = Boolean(
    refundEntityId &&
    incomeEntityId &&
    refundEntityId === incomeEntityId
  );

  // orderPublicId 또는 paymentId가 명시적으로 다른 경우 불일치 처리
  if (
    refundIds.orderPublicId &&
    incomeIds.orderPublicId &&
    refundIds.orderPublicId !== incomeIds.orderPublicId &&
    !paymentMatch
  ) {
    return 0;
  }
  if (
    refundIds.paymentId &&
    incomeIds.paymentId &&
    refundIds.paymentId !== incomeIds.paymentId &&
    !orderMatch
  ) {
    return 0;
  }

  if (orderMatch && paymentMatch && entityMatch) return 100;
  if (orderMatch && entityMatch) return 90;
  if (paymentMatch && entityMatch) return 85;
  if (orderMatch && paymentMatch) return 80;
  if (orderMatch) return 70;
  if (paymentMatch) return 60;
  if (entityMatch && !refundIds.orderPublicId && !refundIds.paymentId) {
    return 50;
  }

  return 0;
};

/**
 * 장부 트랜잭션 목록 그룹화 — INCOME 부모 아래 환불 EXPENSE를 자식(댓글)으로 중첩.
 * - INCOME parents
 * - EXPENSE refunds attached as children via matching orderPublicId/paymentId from resolveLedgerShopIdentifiers
 * - relatedEntityId가 일치하는 매핑 결합 우선
 * - 키가 없는 고아 환불(orphan)은 warn 스타일 표시 대상 (isRefundOrphan: true)
 * - 일반 EXPENSE(임대료, 급여 등)는 독립 부모 행
 *
 * @param {Array<object>} txs
 * @returns {Array<{ parent: object, children: Array<object>, isRefundOrphan: boolean }>}
 */
export function groupTransactionsForLedger(txs) {
  if (!Array.isArray(txs) || txs.length === 0) {
    return [];
  }

  const validTxs = txs.filter((t) => t && typeof t === 'object');
  const incomeCandidates = validTxs.filter(
    (t) => String(t.transactionType || '').toUpperCase() === 'INCOME'
  );

  // 각 환불 트랜잭션에 대해 최적의 부모 INCOME 찾기
  const refundToParentMap = new Map();
  const parentToChildrenMap = new Map();

  for (let i = 0; i < validTxs.length; i += 1) {
    const tx = validTxs[i];
    if (isLedgerRefundOrRevenueCancelRow(tx)) {
      let bestScore = 0;
      let bestParent = null;

      for (let j = 0; j < incomeCandidates.length; j += 1) {
        const candidate = incomeCandidates[j];
        const score = computeRefundIncomeMatchScore(tx, candidate);
        if (score > bestScore) {
          bestScore = score;
          bestParent = candidate;
        }
      }

      if (bestParent) {
        refundToParentMap.set(tx, bestParent);
        if (!parentToChildrenMap.has(bestParent)) {
          parentToChildrenMap.set(bestParent, []);
        }
        parentToChildrenMap.get(bestParent).push(tx);
      }
    }
  }

  // 원래 순서를 최대한 보존하면서 그룹 리스트 생성
  const groups = [];

  for (let i = 0; i < validTxs.length; i += 1) {
    const tx = validTxs[i];

    // 이미 부모에 자식으로 매핑된 환불 행은 독립 그룹으로 추가하지 않음 (부모 아래 렌더링)
    if (refundToParentMap.has(tx)) {
      continue;
    }

    if (String(tx.transactionType || '').toUpperCase() === 'INCOME') {
      const children = parentToChildrenMap.get(tx) || [];
      groups.push({
        parent: tx,
        children,
        isRefundOrphan: false
      });
    } else if (isLedgerRefundOrRevenueCancelRow(tx)) {
      // 부모를 찾지 못한 고아 환불 행
      groups.push({
        parent: tx,
        children: [],
        isRefundOrphan: true
      });
    } else {
      // 일반 지출 (임대료, 급여 등) 또는 기타 행
      groups.push({
        parent: tx,
        children: [],
        isRefundOrphan: false
      });
    }
  }

  return groups;
}

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
