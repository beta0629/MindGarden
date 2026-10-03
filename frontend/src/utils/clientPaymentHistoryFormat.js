/**
 * 내담자 웹 「결제 내역」 — 표시 포맷·환불 문맥·상품명·필터·합계 공통 util (단일 SSOT)
 * 화면은 여기서 만든 행 뷰모델만 그린다 (화면에서 직접 포맷 금지).
 * 스펙: docs/design/clinic-os-client-payments.md §1·§4·§5·§6·§8
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import {
  CLIENT_PAYMENT_BADGE,
  CLIENT_PAYMENT_BADGE_LABELS,
  CLIENT_PAYMENT_CHANNEL_LABELS,
  CLIENT_PAYMENT_COPY,
  CLIENT_PAYMENT_MAPPING_STATUS_TO_BADGE,
  CLIENT_PAYMENT_METHOD_LABELS,
  CLIENT_PAYMENT_NUMERIC_ONLY_PATTERN,
  CLIENT_PAYMENT_ONLINE_METHOD_KEY,
  CLIENT_PAYMENT_PERIOD,
  CLIENT_PAYMENT_PERIOD_MONTHS,
  CLIENT_PAYMENT_PERIOD_OPTIONS,
  CLIENT_PAYMENT_ROW_KIND,
  CLIENT_PAYMENT_SHOP_STATUS_TO_BADGE,
  CLIENT_PAYMENT_SHOP_VISIBLE_STATUSES,
  CLIENT_PAYMENT_SOURCE,
  CLIENT_PAYMENT_STATUS_FILTER,
  CLIENT_PAYMENT_STATUS_FILTER_BADGES,
  CLIENT_PAYMENT_STATUS_FILTER_OPTIONS
} from '../constants/clientPaymentHistoryConstants';
import {
  resolveClientPaymentHistoryAmount,
  resolveClientPaymentHistoryStatus
} from './clientPaymentHistoryDisplay';
import { toSafeNumber } from './safeDisplay';

const REFUNDED = 'REFUNDED';
const CANCELLED = 'CANCELLED';
const DATE_PART_PAD = 2;
const DATE_SEPARATOR = '.';

const PAID_SUM_BADGES = Object.freeze([
  CLIENT_PAYMENT_BADGE.COMPLETED,
  CLIENT_PAYMENT_BADGE.PARTIAL_REFUND,
  CLIENT_PAYMENT_BADGE.REFUNDED
]);

const MUTED_AMOUNT_BADGES = Object.freeze([
  CLIENT_PAYMENT_BADGE.CANCELLED,
  CLIENT_PAYMENT_BADGE.FAILED
]);

const ORIGINAL_NAME_FIELDS = Object.freeze(['productTitle', 'packageName', 'title']);
const ROW_NAME_FIELDS = Object.freeze(['productTitle', 'packageName', 'title', 'orderName']);

/**
 * 숫자로 해석 가능한 값이면 number, 아니면 null.
 *
 * @param {*} value
 * @returns {number|null}
 */
function toFiniteOrNull(value) {
  if (value == null || value === '') {
    return null;
  }
  const n = toSafeNumber(value, Number.NaN);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {*} value
 * @returns {string}
 */
function toUpperTrim(value) {
  return value == null ? '' : String(value).trim().toUpperCase();
}

/**
 * 금액 「N원」 — 절댓값 · 반올림 · 천 단위 콤마 · 「-」「₩」 없음.
 *
 * @param {number|string|null|undefined} value
 * @returns {{ text: string, isNegative: boolean }}
 */
export function formatWon(value) {
  const n = toFiniteOrNull(value);
  if (n == null) {
    return { text: CLIENT_PAYMENT_COPY.EMPTY_DASH, isNegative: false };
  }
  const abs = Math.round(Math.abs(n));
  return {
    text: `${abs.toLocaleString('ko-KR')}${CLIENT_PAYMENT_COPY.WON_SUFFIX}`,
    isNegative: n < 0
  };
}

/**
 * 회기 「N회기」 / 「N회기 환불」 — 0·null 이면 null(줄 생략) · 부호 없음.
 *
 * @param {number|string|null|undefined} n
 * @param {{ refund?: boolean }} [options]
 * @returns {string|null}
 */
export function formatSessions(n, options = {}) {
  const value = toFiniteOrNull(n);
  if (value == null || value === 0) {
    return null;
  }
  const abs = Math.abs(Math.trunc(value));
  if (abs === 0) {
    return null;
  }
  const base = `${abs}${CLIENT_PAYMENT_COPY.SESSIONS_SUFFIX}`;
  return value < 0 || options.refund === true
    ? `${base}${CLIENT_PAYMENT_COPY.SESSIONS_REFUND_SUFFIX}`
    : base;
}

/**
 * 로컬 날짜 `YYYY.MM.DD` · null/잘못된 값 → 「—」.
 *
 * @param {string|number|Date|null|undefined} iso
 * @returns {string}
 */
export function formatPaymentDate(iso) {
  const date = toDateOrNull(iso);
  if (!date) {
    return CLIENT_PAYMENT_COPY.EMPTY_DASH;
  }
  const mm = String(date.getMonth() + 1).padStart(DATE_PART_PAD, '0');
  const dd = String(date.getDate()).padStart(DATE_PART_PAD, '0');
  return [date.getFullYear(), mm, dd].join(DATE_SEPARATOR);
}

/**
 * @param {*} iso
 * @returns {Date|null}
 */
function toDateOrNull(iso) {
  if (iso == null || iso === '') {
    return null;
  }
  const date = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 상품명으로 쓸 수 있는 값인지 — 빈 값·숫자만(「-1」「1」)은 상품명 아님.
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isUsableProductName(value) {
  if (value == null || typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  return trimmed !== '' && !CLIENT_PAYMENT_NUMERIC_ONLY_PATTERN.test(trimmed);
}

/**
 * @param {object|null|undefined} source
 * @param {ReadonlyArray<string>} fields
 * @returns {string|null}
 */
function pickName(source, fields) {
  if (source == null || typeof source !== 'object') {
    return null;
  }
  for (const field of fields) {
    if (isUsableProductName(source[field])) {
      return source[field].trim();
    }
  }
  return null;
}

/**
 * 상품 칸 = 항상 원 상품명 (§6-1): 원주문/원결제 → 행 자체(productTitle → packageName) → 「상품 정보 없음」.
 *
 * @param {object|null|undefined} row
 * @param {object|null|undefined} [original]
 * @returns {{ name: string, isFallback: boolean }}
 */
export function resolveProductName(row, original) {
  const name = pickName(original, ORIGINAL_NAME_FIELDS) || pickName(row, ROW_NAME_FIELDS);
  if (name) {
    return { name, isFallback: false };
  }
  return { name: CLIENT_PAYMENT_COPY.PRODUCT_FALLBACK, isFallback: true };
}

/**
 * 환불 문맥 (§6-3). 음수 금액·음수 회기·환불 상태 중 하나라도 있으면 refund=true.
 * 호출부는 refund=true 면 배지·보조줄·「환불」 문맥을 반드시 붙인다.
 *
 * @param {{
 *   status?: string|null,
 *   orderStatus?: string|null,
 *   amount?: number|string|null,
 *   sessions?: number|string|null,
 *   refundAmount?: number|string|null,
 *   originalAmount?: number|string|null
 * }|null|undefined} row
 * @returns {{
 *   refund: boolean,
 *   partial: boolean,
 *   separateRow: boolean,
 *   paidAmount: number|null,
 *   refundAmount: number|null
 * }}
 */
export function resolveRefundContext(row) {
  const none = {
    refund: false,
    partial: false,
    separateRow: false,
    paidAmount: null,
    refundAmount: null
  };
  if (row == null || typeof row !== 'object') {
    return none;
  }
  const amount = toFiniteOrNull(row.amount);
  const sessions = toFiniteOrNull(row.sessions);
  const refundStatus = toUpperTrim(row.status) === REFUNDED || toUpperTrim(row.orderStatus) === REFUNDED;
  const separateRow = (amount != null && amount < 0) || (sessions != null && sessions < 0);

  if (!separateRow && !refundStatus) {
    return { ...none, paidAmount: amount };
  }

  if (separateRow) {
    const refundAmount = amount != null ? Math.abs(amount) : null;
    const originalAmount = toFiniteOrNull(row.originalAmount);
    const partial = refundAmount != null && originalAmount != null
      && refundAmount > 0 && refundAmount < Math.abs(originalAmount);
    return {
      refund: true,
      partial,
      separateRow: true,
      paidAmount: originalAmount != null ? Math.abs(originalAmount) : null,
      refundAmount
    };
  }

  const paidAmount = amount != null ? Math.abs(amount) : null;
  const explicitRefund = toFiniteOrNull(row.refundAmount);
  const refundAbs = explicitRefund != null ? Math.abs(explicitRefund) : null;
  const partial = refundAbs != null && paidAmount != null && refundAbs > 0 && refundAbs < paidAmount;
  return {
    refund: true,
    partial,
    separateRow: false,
    paidAmount,
    refundAmount: partial ? refundAbs : paidAmount
  };
}

/**
 * 표시 배지 (§4) — 부분환불 판정 먼저, 그다음 원본 값 매핑. 모르는 값 → null.
 *
 * @param {string} kind CLIENT_PAYMENT_ROW_KIND
 * @param {string|null|undefined} status 원본 상태
 * @param {string|null|undefined} orderStatus 주문 상태 (센터 매핑 보강 필드)
 * @param {{ refund: boolean, partial: boolean }} refundCtx
 * @returns {string|null}
 */
export function resolveClientPaymentBadge(kind, status, orderStatus, refundCtx) {
  if (refundCtx && refundCtx.refund) {
    return refundCtx.partial ? CLIENT_PAYMENT_BADGE.PARTIAL_REFUND : CLIENT_PAYMENT_BADGE.REFUNDED;
  }
  const key = toUpperTrim(status);
  if (kind === CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER) {
    return CLIENT_PAYMENT_SHOP_STATUS_TO_BADGE[key] || null;
  }
  if (toUpperTrim(orderStatus) === CANCELLED) {
    return CLIENT_PAYMENT_BADGE.CANCELLED;
  }
  return CLIENT_PAYMENT_MAPPING_STATUS_TO_BADGE[key] || null;
}

/**
 * 결제수단 2줄 (§5) — 1줄 수단 · 2줄 채널. 대행사 이름·「일시불」 없음.
 *
 * @param {string|null|undefined} paymentMethod
 * @param {string|null|undefined} paymentSource
 * @returns {{ methodText: string|null, channelText: string|null }}
 */
export function resolvePaymentMethodDisplay(paymentMethod, paymentSource) {
  const methodKey = toUpperTrim(paymentMethod);
  const methodText = Object.prototype.hasOwnProperty.call(CLIENT_PAYMENT_METHOD_LABELS, methodKey)
    ? CLIENT_PAYMENT_METHOD_LABELS[methodKey]
    : null;
  const sourceKey = toUpperTrim(paymentSource);
  const channelText = Object.prototype.hasOwnProperty.call(CLIENT_PAYMENT_CHANNEL_LABELS, sourceKey)
    ? CLIENT_PAYMENT_CHANNEL_LABELS[sourceKey]
    : null;
  return { methodText, channelText };
}

/**
 * 금액 보조줄 (§6-3 A·B·C·D).
 *
 * @param {object} refundCtx
 * @param {string|null} originalDateIso
 * @returns {string|null}
 */
function buildAmountSubText(refundCtx, originalDateIso) {
  if (!refundCtx.refund) {
    return null;
  }
  if (!refundCtx.separateRow) {
    return refundCtx.partial
      ? `${CLIENT_PAYMENT_COPY.SUB_REFUND_PREFIX}${formatWon(refundCtx.refundAmount).text}`
      : CLIENT_PAYMENT_COPY.SUB_FULL_REFUND;
  }
  if (refundCtx.partial && refundCtx.paidAmount != null) {
    const paidText = formatWon(refundCtx.paidAmount).text;
    return `${CLIENT_PAYMENT_COPY.SUB_OF_PAID_PREFIX}${paidText}${CLIENT_PAYMENT_COPY.SUB_OF_PAID_SUFFIX}`;
  }
  if (!refundCtx.partial && toDateOrNull(originalDateIso)) {
    return `${formatPaymentDate(originalDateIso)}${CLIENT_PAYMENT_COPY.SUB_ORIGINAL_PAID_SUFFIX}`;
  }
  return null;
}

/**
 * 상품 2줄 회기 문구 (§6-2).
 *
 * @param {object} refundCtx
 * @param {number|null} sessions
 * @param {number|null} refundSessions
 * @returns {string|null}
 */
function buildSessionsText(refundCtx, sessions, refundSessions) {
  if (refundCtx.separateRow) {
    return formatSessions(sessions, { refund: true });
  }
  const base = formatSessions(sessions != null ? Math.abs(sessions) : null);
  if (refundCtx.refund && refundCtx.partial) {
    const refundText = formatSessions(refundSessions, { refund: true });
    if (base && refundText) {
      return `${base}${CLIENT_PAYMENT_COPY.SESSIONS_JOIN}${refundText}`;
    }
  }
  return base;
}

/**
 * 공통 행 뷰모델 조립.
 *
 * @param {object} input
 * @returns {object}
 */
function assembleRow(input) {
  const refundCtx = resolveRefundContext({
    status: input.status,
    orderStatus: input.orderStatus,
    amount: input.amount,
    sessions: input.sessions,
    refundAmount: input.refundAmount,
    originalAmount: input.originalAmount
  });
  const badge = resolveClientPaymentBadge(input.kind, input.status, input.orderStatus, refundCtx);
  if (!badge && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[ClientPaymentHistory] 미매핑 결제 상태', input.kind, input.status);
  }
  const shownAmount = refundCtx.separateRow ? refundCtx.refundAmount : toFiniteOrNull(input.amount);
  const product = resolveProductName(input.row, input.original);
  const { methodText, channelText } = resolvePaymentMethodDisplay(input.paymentMethod, input.paymentSource);
  const date = toDateOrNull(input.dateIso);
  const paidContribution = !refundCtx.separateRow && PAID_SUM_BADGES.includes(badge)
    ? Math.abs(toFiniteOrNull(input.amount) || 0)
    : 0;
  const refundContribution = refundCtx.refund ? (refundCtx.refundAmount || 0) : 0;

  return {
    key: input.key,
    kind: input.kind,
    orderPublicId: input.orderPublicId || null,
    linkKey: input.linkKey || null,
    time: date ? date.getTime() : null,
    dateText: formatPaymentDate(date),
    productName: product.name,
    productIsFallback: product.isFallback,
    sessionsText: buildSessionsText(refundCtx, toFiniteOrNull(input.sessions), toFiniteOrNull(input.refundSessions)),
    amountText: formatWon(shownAmount).text,
    amountMuted: MUTED_AMOUNT_BADGES.includes(badge),
    amountSubText: buildAmountSubText(refundCtx, input.originalDateIso || null),
    methodText,
    channelText,
    badge,
    badgeLabel: badge ? CLIENT_PAYMENT_BADGE_LABELS[badge] : null,
    refund: refundCtx.refund,
    separateRefundRow: refundCtx.separateRow,
    paidContribution,
    refundContribution
  };
}

/**
 * @param {object} mapping
 * @returns {string|null}
 */
function mappingDateIso(mapping) {
  return mapping.paymentDate || mapping.createdAt || null;
}

/**
 * @param {object} mapping
 * @returns {string|null}
 */
function paymentReferenceOf(mapping) {
  return mapping && mapping.paymentReference != null && String(mapping.paymentReference).trim()
    ? String(mapping.paymentReference).trim()
    : null;
}

/**
 * 센터 매핑 → 행 뷰모델.
 *
 * @param {object} mapping `/api/v1/admin/mappings/client` 항목
 * @param {object|null} [original] 같은 paymentReference 의 원결제(양수) 매핑
 * @returns {object}
 */
export function buildMappingPaymentRow(mapping, original = null) {
  const safe = mapping && typeof mapping === 'object' ? mapping : {};
  return assembleRow({
    key: `mapping-${safe.id != null ? safe.id : paymentReferenceOf(safe) || ''}`,
    kind: CLIENT_PAYMENT_ROW_KIND.MAPPING,
    row: safe,
    original,
    status: resolveClientPaymentHistoryStatus(safe),
    orderStatus: safe.orderStatus,
    amount: resolveClientPaymentHistoryAmount(safe),
    sessions: safe.totalSessions,
    refundAmount: null,
    refundSessions: null,
    originalAmount: original ? resolveClientPaymentHistoryAmount(original) : null,
    originalDateIso: original ? mappingDateIso(original) : null,
    paymentMethod: safe.paymentMethod,
    paymentSource: safe.paymentSource,
    dateIso: mappingDateIso(safe),
    linkKey: paymentReferenceOf(safe)
  });
}

/**
 * 온라인 주문이 목록에 보이는지 (PAID·REFUNDED + cashDue > 0 + 공개 ID).
 *
 * @param {object|null|undefined} order
 * @returns {boolean}
 */
export function isVisibleShopOrder(order) {
  if (!order || typeof order !== 'object') {
    return false;
  }
  if (!CLIENT_PAYMENT_SHOP_VISIBLE_STATUSES.includes(toUpperTrim(order.status))) {
    return false;
  }
  const cashDue = toFiniteOrNull(order.cashDueMinor ?? order.cashDue);
  if (cashDue == null || cashDue <= 0) {
    return false;
  }
  return order.orderPublicId != null && String(order.orderPublicId).trim() !== '';
}

/**
 * 온라인 주문 → 행 뷰모델.
 *
 * @param {object} order `/api/v1/clients/me/shop/orders` 항목
 * @param {object|null} [original] 원주문 상품 정보 (같은 주문의 매핑 · 주문 상세 라인)
 * @returns {object|null}
 */
export function buildShopOrderPaymentRow(order, original = null) {
  if (!isVisibleShopOrder(order)) {
    return null;
  }
  const orderPublicId = String(order.orderPublicId).trim();
  const dateIso = order.paidAt || order.updatedAt || order.createdAt || null;
  return assembleRow({
    key: `shop-${orderPublicId}`,
    kind: CLIENT_PAYMENT_ROW_KIND.SHOP_ORDER,
    row: order,
    original,
    status: order.status,
    orderStatus: order.status,
    amount: order.cashDueMinor ?? order.cashDue,
    sessions: original ? original.sessions : null,
    refundAmount: null,
    refundSessions: null,
    originalAmount: null,
    originalDateIso: null,
    paymentMethod: CLIENT_PAYMENT_ONLINE_METHOD_KEY,
    paymentSource: CLIENT_PAYMENT_SOURCE.ONLINE,
    dateIso,
    orderPublicId,
    linkKey: orderPublicId
  });
}

/**
 * 원결제 매핑 색인 (paymentReference → 양수 금액 매핑).
 *
 * @param {Array<object>} mappings
 * @returns {Map<string, object>}
 */
function indexOriginalMappings(mappings) {
  const index = new Map();
  mappings.forEach((mapping) => {
    const ref = paymentReferenceOf(mapping);
    if (!ref || index.has(ref) || isNegativeMapping(mapping)) {
      return;
    }
    index.set(ref, mapping);
  });
  return index;
}

/**
 * 음수 금액 또는 음수 회기 = 별도 환불 행.
 *
 * @param {object} mapping
 * @returns {boolean}
 */
function isNegativeMapping(mapping) {
  const amount = toFiniteOrNull(resolveClientPaymentHistoryAmount(mapping));
  const sessions = toFiniteOrNull(mapping.totalSessions);
  return (amount != null && amount < 0) || (sessions != null && sessions < 0);
}

/**
 * 두 출처를 합쳐 행 뷰모델 목록 (표시 날짜 내림차순).
 *
 * @param {{
 *   mappings?: Array<object>,
 *   shopOrders?: Array<object>,
 *   shopOrderDetails?: Record<string, { productTitle?: string, sessions?: number|null }>
 * }} sources
 * @returns {Array<object>}
 */
export function buildClientPaymentRows(sources = {}) {
  const mappings = Array.isArray(sources.mappings) ? sources.mappings.filter((m) => m && typeof m === 'object') : [];
  const shopOrders = Array.isArray(sources.shopOrders) ? sources.shopOrders : [];
  const details = sources.shopOrderDetails && typeof sources.shopOrderDetails === 'object'
    ? sources.shopOrderDetails
    : {};
  const originals = indexOriginalMappings(mappings);

  const mappingRows = mappings.map((mapping) => {
    const ref = paymentReferenceOf(mapping);
    const original = ref && isNegativeMapping(mapping) ? originals.get(ref) : null;
    return buildMappingPaymentRow(mapping, original && original !== mapping ? original : null);
  });

  const shopRows = shopOrders
    .map((order) => {
      if (!isVisibleShopOrder(order)) {
        return null;
      }
      const orderPublicId = String(order.orderPublicId).trim();
      const mappingOriginal = originals.get(orderPublicId) || null;
      const detail = details[orderPublicId] || null;
      const original = {
        productTitle: mappingOriginal ? pickName(mappingOriginal, ORIGINAL_NAME_FIELDS) : null,
        title: detail ? detail.productTitle : null,
        sessions: detail && detail.sessions != null
          ? detail.sessions
          : (mappingOriginal ? mappingOriginal.totalSessions : null)
      };
      return buildShopOrderPaymentRow(order, original);
    })
    .filter(Boolean);

  return [...mappingRows, ...shopRows].sort((a, b) => (b.time || 0) - (a.time || 0));
}

/**
 * 기간 시작 시각 (오늘 포함 · 로컬 자정 기준).
 *
 * @param {string} period
 * @param {Date} now
 * @returns {number|null}
 */
function periodStartTime(period, now) {
  const months = CLIENT_PAYMENT_PERIOD_MONTHS[period];
  if (months == null) {
    return null;
  }
  const base = now instanceof Date ? now : new Date();
  return new Date(base.getFullYear(), base.getMonth() - months, base.getDate()).getTime();
}

/**
 * 기간·상태 필터 (§1 · §4 필터 칩 매핑). 기준 날짜 = 결제일(없으면 생성일).
 *
 * @param {Array<object>} rows
 * @param {{ period?: string, status?: string }} filters
 * @param {Date} [now]
 * @returns {Array<object>}
 */
export function filterClientPaymentRows(rows, filters = {}, now = new Date()) {
  const list = Array.isArray(rows) ? rows : [];
  const start = periodStartTime(normalizePeriod(filters.period), now);
  const badges = CLIENT_PAYMENT_STATUS_FILTER_BADGES[normalizeStatusFilter(filters.status)];
  return list.filter((row) => {
    if (start != null && (row.time == null || row.time < start)) {
      return false;
    }
    if (badges && !badges.includes(row.badge)) {
      return false;
    }
    return true;
  });
}

/**
 * 결과 요약 합계 (필터된 전체 기준 · §6-3 중복 방지).
 * 별도 환불 행이 있는 원결제(linkKey)는 원결제 행의 환불액을 다시 더하지 않는다.
 *
 * @param {Array<object>} rows
 * @returns {{ count: number, paidSum: number, refundSum: number }}
 */
export function summarizeClientPaymentRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const separateRefundKeys = new Set(
    list.filter((row) => row.separateRefundRow && row.linkKey).map((row) => row.linkKey)
  );
  return list.reduce((acc, row) => {
    const skipRefund = !row.separateRefundRow && row.linkKey && separateRefundKeys.has(row.linkKey);
    return {
      count: acc.count + 1,
      paidSum: acc.paidSum + (row.paidContribution || 0),
      refundSum: acc.refundSum + (skipRefund ? 0 : (row.refundContribution || 0))
    };
  }, { count: 0, paidSum: 0, refundSum: 0 });
}

/**
 * 「{count}건 · 결제 {paidSum}원」 + 「 · 환불 {refundSum}원」 + 「 (일부)」.
 *
 * @param {{ count: number, paidSum: number, refundSum: number }} summary
 * @param {{ partial?: boolean }} [options]
 * @returns {string}
 */
export function formatClientPaymentSummary(summary, options = {}) {
  const s = summary || { count: 0, paidSum: 0, refundSum: 0 };
  const parts = [
    `${s.count}${CLIENT_PAYMENT_COPY.COUNT_UNIT}`,
    `${CLIENT_PAYMENT_COPY.SUMMARY_PAID_PREFIX}${formatWon(s.paidSum).text}`
  ];
  if (s.refundSum > 0) {
    parts.push(`${CLIENT_PAYMENT_COPY.SUMMARY_REFUND_PREFIX}${formatWon(s.refundSum).text}`);
  }
  const text = parts.join(CLIENT_PAYMENT_COPY.SUMMARY_SEPARATOR);
  return options.partial ? `${text}${CLIENT_PAYMENT_COPY.SUMMARY_PARTIAL_SUFFIX}` : text;
}

/**
 * @param {*} value
 * @returns {string}
 */
export function normalizePeriod(value) {
  return CLIENT_PAYMENT_PERIOD_OPTIONS.some((opt) => opt.id === value) ? value : CLIENT_PAYMENT_PERIOD.ALL;
}

/**
 * @param {*} value
 * @returns {string}
 */
export function normalizeStatusFilter(value) {
  return CLIENT_PAYMENT_STATUS_FILTER_OPTIONS.some((opt) => opt.id === value)
    ? value
    : CLIENT_PAYMENT_STATUS_FILTER.ALL;
}

/**
 * @param {*} value
 * @returns {number}
 */
export function normalizePage(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/**
 * 클라이언트 페이징.
 *
 * @param {Array<object>} rows
 * @param {number} page 1부터
 * @param {number} size
 * @returns {{ pageRows: Array<object>, page: number, totalPages: number }}
 */
export function paginateClientPaymentRows(rows, page, size) {
  const list = Array.isArray(rows) ? rows : [];
  const perPage = size > 0 ? size : 1;
  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const current = Math.min(Math.max(1, page || 1), totalPages);
  const start = (current - 1) * perPage;
  return { pageRows: list.slice(start, start + perPage), page: current, totalPages };
}

/**
 * 표 caption (sr-only) — 「결제 내역 · {기간} · {상태} · {count}건」.
 *
 * @param {string} period
 * @param {string} status
 * @param {number} count
 * @returns {string}
 */
export function buildClientPaymentCaption(period, status, count) {
  const periodLabel = (CLIENT_PAYMENT_PERIOD_OPTIONS.find((o) => o.id === normalizePeriod(period)) || {}).label;
  const statusLabel = (CLIENT_PAYMENT_STATUS_FILTER_OPTIONS.find((o) => o.id === normalizeStatusFilter(status))
    || {}).label;
  return [
    CLIENT_PAYMENT_COPY.CAPTION_PREFIX,
    periodLabel,
    statusLabel,
    `${count}${CLIENT_PAYMENT_COPY.COUNT_UNIT}`
  ].join(CLIENT_PAYMENT_COPY.CAPTION_SEPARATOR);
}
