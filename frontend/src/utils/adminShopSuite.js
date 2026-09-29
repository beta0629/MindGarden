/**
 * 관리자 쇼핑 스위트 — 순수 계산 헬퍼 (쌍장부 상태·요약·상품 병합·리워드 예시)
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import {
  ADMIN_SHOP_BPS_PER_PERCENT,
  ADMIN_SHOP_EXPIRY_STATE,
  ADMIN_SHOP_LEDGER_STATE,
  ADMIN_SHOP_ORDER_PERIOD,
  ADMIN_SHOP_ORDER_SHORT_ID_SEGMENT,
  ADMIN_SHOP_PRODUCT_CATEGORY_ALL,
  ADMIN_SHOP_PRODUCT_SEGMENT,
  ADMIN_SHOP_PRODUCT_SESSION_MIN,
  ADMIN_SHOP_PRODUCT_VALIDITY_MIN
} from '../constants/adminShopSuite';
import {
  isAdminShopPgCancelled,
  resolveAdminShopOrderAmount
} from '../constants/adminShopApi';
import {
  hasShopFulfillmentRetryableLine,
  normalizeShopCatalogCategory,
  resolveShopFulfillmentLines,
  SHOP_CATALOG_CATEGORY
} from '../constants/clientShopConstants';
import { isPublicVisible, parseExtraData } from './packagePricing';
import { isShopCatalogPlaceholderUrl } from './shopCatalogThumbnail';
import { toDisplayString } from './safeDisplay';

const SHORT_ID_SEPARATOR = '·';
const MASK_CHAR = '*';
const CSV_SEPARATOR = ',';
const CSV_LINE_BREAK = '\n';
const MONTHS_IN_RECENT_WINDOW = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;
const DATE_DISPLAY_SEPARATOR = '.';
const BPS_SCALE = ADMIN_SHOP_BPS_PER_PERCENT * ADMIN_SHOP_BPS_PER_PERCENT;
const PERCENT_FULL = 100;

/**
 * 주문 공개 ID → 헤더·목록용 짧은 ID (`#앞4·뒤4`).
 *
 * @param {string|null|undefined} orderPublicId
 * @returns {string}
 */
export function formatAdminShopOrderShortId(orderPublicId) {
  const compact = toDisplayString(orderPublicId, '').replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  if (!compact) {
    return '';
  }
  const seg = ADMIN_SHOP_ORDER_SHORT_ID_SEGMENT;
  if (compact.length <= seg * 2) {
    return `#${compact}`;
  }
  return `#${compact.slice(0, seg)}${SHORT_ID_SEPARATOR}${compact.slice(-seg)}`;
}

/**
 * 내담자 이름 마스킹 (가운데 글자).
 *
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function maskAdminShopClientName(name) {
  const chars = Array.from(toDisplayString(name, '').trim());
  if (chars.length === 0) {
    return '';
  }
  if (chars.length === 1) {
    return chars[0];
  }
  if (chars.length === 2) {
    return `${chars[0]}${MASK_CHAR}`;
  }
  return `${chars[0]}${MASK_CHAR.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
}

/**
 * 목록 행 또는 상세의 내담자 이름 (API 가 주는 필드만).
 *
 * @param {object|null|undefined} source
 * @returns {string}
 */
export function resolveAdminShopClientName(source) {
  if (!source || typeof source !== 'object') {
    return '';
  }
  return toDisplayString(source.clientName ?? source.clientDisplayName, '').trim();
}

/**
 * @param {object|null|undefined} source
 * @returns {Array<object>}
 */
function resolveLines(source) {
  return Array.isArray(source?.lines) ? source.lines : [];
}

/**
 * 주문이 부여하는 회기 수. 행의 sessionCount 우선, 없으면 라인 합(회기 × 수량).
 *
 * @param {object|null|undefined} row
 * @param {object|null|undefined} [detail]
 * @returns {number|null}
 */
export function resolveAdminShopOrderSessionCount(row, detail) {
  const direct = row?.sessionCount ?? detail?.sessionCount;
  if (direct != null && Number.isFinite(Number(direct))) {
    return Number(direct);
  }
  const lines = resolveLines(detail).length > 0 ? resolveLines(detail) : resolveLines(row);
  if (lines.length === 0) {
    return null;
  }
  return lines.reduce((acc, line) => {
    const sessions = Number(line?.sessionCount);
    const qty = Number(line?.quantity);
    const safeSessions = Number.isFinite(sessions) ? sessions : 0;
    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
    return acc + safeSessions * safeQty;
  }, 0);
}

/**
 * 주문 대표 상품명 (첫 라인 + 외 N).
 *
 * @param {object|null|undefined} row
 * @param {object|null|undefined} [detail]
 * @returns {string}
 */
export function resolveAdminShopOrderProductTitle(row, detail) {
  const direct = toDisplayString(row?.productTitle ?? row?.title, '').trim();
  if (direct) {
    return direct;
  }
  const lines = resolveLines(detail).length > 0 ? resolveLines(detail) : resolveLines(row);
  if (lines.length === 0) {
    return '';
  }
  const first = toDisplayString(lines[0]?.title || lines[0]?.skuCode, '').trim();
  if (lines.length === 1) {
    return first;
  }
  return `${first} 외 ${lines.length - 1}`;
}

/**
 * 쌍장부 행 상태. PortOne 기취소·이행 실패(재시도 가능)면 「정합 필요」.
 * 결제 완료는 사용 기한(서버 expiryState)에 따라 만료 임박·기한 만료로 나뉜다.
 * 결제 시간 초과·취소는 「미결제」(UNPAID) — 「만료」는 사용 기한에만 쓴다.
 *
 * @param {object|null|undefined} row
 * @param {object|null|undefined} [detail]
 * @returns {string} ADMIN_SHOP_LEDGER_STATE
 */
export function resolveAdminShopLedgerState(row, detail) {
  const status = toDisplayString(detail?.status ?? row?.status, '').toUpperCase();
  const paymentStatus = toDisplayString(detail?.paymentStatus ?? row?.paymentStatus, '').toUpperCase();
  if (status === 'REFUNDED' || paymentStatus === 'REFUNDED') {
    return ADMIN_SHOP_LEDGER_STATE.REFUNDED;
  }
  if (status === 'PAID') {
    const pgStatus = detail?.pgStatus ?? row?.pgStatus;
    const events = detail ? resolveShopFulfillmentLines(detail) : [];
    if (isAdminShopPgCancelled(pgStatus) || hasShopFulfillmentRetryableLine(events)) {
      return ADMIN_SHOP_LEDGER_STATE.RECONCILE;
    }
    const serverState = toDisplayString(detail?.ledgerState ?? row?.ledgerState, '').toUpperCase();
    if (serverState === ADMIN_SHOP_LEDGER_STATE.RECONCILE) {
      return ADMIN_SHOP_LEDGER_STATE.RECONCILE;
    }
    const expiryState = toDisplayString(detail?.expiryState ?? row?.expiryState, '').toUpperCase();
    if (expiryState === ADMIN_SHOP_EXPIRY_STATE.EXPIRED) {
      return ADMIN_SHOP_LEDGER_STATE.EXPIRED;
    }
    if (expiryState === ADMIN_SHOP_EXPIRY_STATE.EXPIRING_SOON) {
      return ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON;
    }
    return ADMIN_SHOP_LEDGER_STATE.PAID;
  }
  if (status === 'EXPIRED' || status === 'CANCELLED') {
    return ADMIN_SHOP_LEDGER_STATE.UNPAID;
  }
  return ADMIN_SHOP_LEDGER_STATE.PENDING;
}

/** 회기 변화 표시 종류 */
export const ADMIN_SHOP_SESSION_DELTA_KIND = Object.freeze({
  GRANT: 'grant',
  RESTORE: 'restore',
  WAITING: 'waiting',
  UNREFLECTED: 'unreflected',
  EXPIRED: 'expired',
  NONE: 'none'
});

/**
 * 상태별 회기 변화 (+N 부여 · −N 원복 · (+N) 대기/미반영 · (N) 만료 · 없음).
 *
 * @param {string} state
 * @param {number|null} sessionCount
 * @returns {{ kind: string, count: number|null }}
 */
export function resolveAdminShopSessionDelta(state, sessionCount) {
  const count = sessionCount != null && Number.isFinite(Number(sessionCount)) ? Number(sessionCount) : null;
  switch (state) {
    case ADMIN_SHOP_LEDGER_STATE.PAID:
    case ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON:
      return { kind: ADMIN_SHOP_SESSION_DELTA_KIND.GRANT, count };
    case ADMIN_SHOP_LEDGER_STATE.EXPIRED:
      return { kind: ADMIN_SHOP_SESSION_DELTA_KIND.EXPIRED, count };
    case ADMIN_SHOP_LEDGER_STATE.REFUNDED:
      return { kind: ADMIN_SHOP_SESSION_DELTA_KIND.RESTORE, count };
    case ADMIN_SHOP_LEDGER_STATE.PENDING:
      return { kind: ADMIN_SHOP_SESSION_DELTA_KIND.WAITING, count };
    case ADMIN_SHOP_LEDGER_STATE.RECONCILE:
      return { kind: ADMIN_SHOP_SESSION_DELTA_KIND.UNREFLECTED, count };
    default:
      return { kind: ADMIN_SHOP_SESSION_DELTA_KIND.NONE, count: null };
  }
}

/**
 * 목록 행 → 쌍장부 항목. 목록 API 가 상품·회기·내담자·기한을 함께 준다 (행별 상세 조회 없음).
 *
 * @param {object} row 목록 API 행
 * @param {object|null|undefined} [detail] 상세 API (모달)
 * @returns {object}
 */
export function buildAdminShopOrderLedgerItem(row, detail) {
  const state = detail
    ? resolveAdminShopLedgerState(row, detail)
    : (toDisplayString(row?.ledgerState, '') || resolveAdminShopLedgerState(row, null));
  const expirySource = detail || row || {};
  const daysLeftRaw = expirySource.daysLeft;
  const sessions = resolveAdminShopOrderSessionCount(row, detail);
  const amount = resolveAdminShopOrderAmount(detail || row);
  const points = Number(row?.pointsRedeemMinor ?? detail?.pointsRedeemMinor ?? 0);
  const clientName = resolveAdminShopClientName(row) || resolveAdminShopClientName(detail);
  return {
    orderPublicId: toDisplayString(row?.orderPublicId, ''),
    shortId: formatAdminShopOrderShortId(row?.orderPublicId),
    createdAt: row?.createdAt ?? null,
    clientMasked: maskAdminShopClientName(clientName),
    productTitle: resolveAdminShopOrderProductTitle(row, detail),
    state,
    sessions,
    delta: resolveAdminShopSessionDelta(state, sessions),
    amount: amount != null && Number.isFinite(amount) ? amount : null,
    points: Number.isFinite(points) ? points : 0,
    deletable: row?.deletable,
    status: row?.status,
    expireDate: expirySource.expireDate ?? null,
    originalExpireDate: expirySource.originalExpireDate ?? null,
    daysLeft: daysLeftRaw != null && Number.isFinite(Number(daysLeftRaw)) ? Number(daysLeftRaw) : null,
    extensionCount: Number(expirySource.extensionCount) || 0,
    raw: row
  };
}

/** 요약 기본값 (서버 summary 필드와 동일) */
const EMPTY_ORDER_SUMMARY = Object.freeze({
  inAmount: 0,
  inCount: 0,
  inSessions: 0,
  inPoints: 0,
  expiredSessions: 0,
  outAmount: 0,
  outCount: 0,
  outSessions: 0,
  pendingCount: 0,
  reconcileCount: 0,
  expiringSoonCount: 0,
  netAmount: 0
});

const COLLECTED_STATES = Object.freeze([
  ADMIN_SHOP_LEDGER_STATE.PAID,
  ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON,
  ADMIN_SHOP_LEDGER_STATE.EXPIRED
]);

/**
 * 요약 스트립·합계. 돈 = 결제 완료(만료 임박·기한 만료 포함) − 환불,
 * 회기 = 활성 부여(결제 완료·만료 임박) − 원복, 기한 만료 회기는 expiredSessions 로 따로.
 *
 * @param {Array<object>} items buildAdminShopOrderLedgerItem 결과
 * @returns {typeof EMPTY_ORDER_SUMMARY}
 */
export function summarizeAdminShopOrders(items) {
  const summary = { ...EMPTY_ORDER_SUMMARY };
  (Array.isArray(items) ? items : []).forEach((item) => {
    const amount = item.amount != null ? item.amount : 0;
    const sessions = item.sessions != null ? item.sessions : 0;
    if (COLLECTED_STATES.includes(item.state)) {
      summary.inAmount += amount;
      summary.inCount += 1;
      summary.inPoints += item.points || 0;
      if (item.state === ADMIN_SHOP_LEDGER_STATE.EXPIRED) {
        summary.expiredSessions += sessions;
      } else {
        summary.inSessions += sessions;
      }
      if (item.state === ADMIN_SHOP_LEDGER_STATE.EXPIRING_SOON) {
        summary.expiringSoonCount += 1;
      }
    } else if (item.state === ADMIN_SHOP_LEDGER_STATE.REFUNDED) {
      summary.outAmount += amount;
      summary.outCount += 1;
      summary.outSessions += sessions;
    } else if (item.state === ADMIN_SHOP_LEDGER_STATE.PENDING) {
      summary.pendingCount += 1;
    } else if (item.state === ADMIN_SHOP_LEDGER_STATE.RECONCILE) {
      summary.reconcileCount += 1;
    }
  });
  summary.netAmount = summary.inAmount - summary.outAmount;
  return summary;
}

/**
 * 서버 summary → 숫자 보장.
 *
 * @param {object|null|undefined} raw
 * @returns {typeof EMPTY_ORDER_SUMMARY}
 */
export function normalizeAdminShopOrderSummary(raw) {
  return Object.keys(EMPTY_ORDER_SUMMARY).reduce((acc, key) => {
    const n = Number(raw?.[key]);
    acc[key] = Number.isFinite(n) ? n : 0;
    return acc;
  }, {});
}

/**
 * @param {Date} base
 * @param {number} monthOffset
 * @returns {Date}
 */
function startOfMonth(base, monthOffset) {
  return new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
}

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD (로컬)
 */
export function toAdminShopIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 기간 select → 서버 조회 범위 (from 포함, to 미포함). 전체 기간이면 둘 다 null.
 *
 * @param {string} period ADMIN_SHOP_ORDER_PERIOD
 * @param {Date} [now]
 * @returns {{ from: string|null, to: string|null }}
 */
export function resolveAdminShopOrderPeriodRange(period, now = new Date()) {
  if (period === ADMIN_SHOP_ORDER_PERIOD.ALL) {
    return { from: null, to: null };
  }
  let from = startOfMonth(now, 0);
  let to = startOfMonth(now, 1);
  if (period === ADMIN_SHOP_ORDER_PERIOD.LAST_MONTH) {
    from = startOfMonth(now, -1);
    to = startOfMonth(now, 0);
  } else if (period === ADMIN_SHOP_ORDER_PERIOD.LAST_3_MONTHS) {
    from = startOfMonth(now, 1 - MONTHS_IN_RECENT_WINDOW);
  }
  return { from: toAdminShopIsoDate(from), to: toAdminShopIsoDate(to) };
}

/**
 * @param {string|null|undefined} iso YYYY-MM-DD…
 * @returns {Date|null} 로컬 자정
 */
export function parseAdminShopIsoDate(iso) {
  const match = ISO_DATE_PATTERN.exec(toDisplayString(iso, ''));
  if (!match) {
    return null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * 날짜 표시 `YYYY.MM.DD`.
 *
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatAdminShopDate(iso) {
  const date = parseAdminShopIsoDate(iso);
  if (!date) {
    return '';
  }
  return toAdminShopIsoDate(date).split('-').join(DATE_DISPLAY_SEPARATOR);
}

/**
 * 날짜 표시 `MM.DD` (목록 둘째 줄).
 *
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function formatAdminShopShortDate(iso) {
  const full = formatAdminShopDate(iso);
  return full ? full.slice(full.indexOf(DATE_DISPLAY_SEPARATOR) + 1) : '';
}

/**
 * ISO 날짜 + N개월 (월말은 해당 월 마지막 날로 맞춘다).
 *
 * @param {string} iso
 * @param {number} months
 * @returns {string|null}
 */
export function addMonthsToAdminShopIsoDate(iso, months) {
  const date = parseAdminShopIsoDate(iso);
  if (!date) {
    return null;
  }
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toAdminShopIsoDate(target);
}

/**
 * ISO 날짜 + N일.
 *
 * @param {string} iso
 * @param {number} days
 * @returns {string|null}
 */
export function addDaysToAdminShopIsoDate(iso, days) {
  const date = parseAdminShopIsoDate(iso);
  if (!date) {
    return null;
  }
  date.setDate(date.getDate() + days);
  return toAdminShopIsoDate(date);
}

/**
 * to − from (일). 둘 중 하나라도 없으면 null.
 *
 * @param {string} fromIso
 * @param {string} toIso
 * @returns {number|null}
 */
export function diffAdminShopIsoDays(fromIso, toIso) {
  const from = parseAdminShopIsoDate(fromIso);
  const to = parseAdminShopIsoDate(toIso);
  if (!from || !to) {
    return null;
  }
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * 기한 연장 새 만료일 하한 (이 날짜보다 뒤여야 저장 가능).
 * 기한 만료 주문은 오늘, 아니면 현재 만료일.
 *
 * @param {{ expireDate?: string|null, state?: string }} item
 * @param {Date} [now]
 * @returns {string|null}
 */
export function resolveAdminShopExtendBaseDate(item, now = new Date()) {
  if (!item?.expireDate) {
    return null;
  }
  if (item.state === ADMIN_SHOP_LEDGER_STATE.EXPIRED) {
    return toAdminShopIsoDate(now);
  }
  return toDisplayString(item.expireDate, '').slice(0, 10);
}

/**
 * 주문번호·내담자 검색.
 *
 * @param {object} item
 * @param {string} query
 * @returns {boolean}
 */
export function matchesAdminShopOrderSearch(item, query) {
  const q = toDisplayString(query, '').trim().toLowerCase();
  if (!q) {
    return true;
  }
  const haystack = [
    item.orderPublicId,
    item.shortId,
    item.clientMasked,
    item.productTitle
  ].map((v) => toDisplayString(v, '').toLowerCase()).join(' ');
  return haystack.includes(q.replace(/^#/, '')) || haystack.includes(q);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function escapeCsvCell(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * CSV 문자열 (헤더 + 행). 금액은 원 정수.
 *
 * @param {Array<object>} items
 * @param {{ headers: string[], stateLabels: Record<string, string> }} labels
 * @returns {string}
 */
export function buildAdminShopOrdersCsv(items, labels) {
  const header = labels.headers.map(escapeCsvCell).join(CSV_SEPARATOR);
  const rows = (Array.isArray(items) ? items : []).map((item) => [
    item.createdAt || '',
    item.orderPublicId,
    item.clientMasked,
    item.productTitle,
    item.sessions != null ? item.sessions : '',
    item.amount != null ? item.amount : '',
    item.points,
    labels.stateLabels[item.state] || item.state
  ].map(escapeCsvCell).join(CSV_SEPARATOR));
  return [header, ...rows].join(CSV_LINE_BREAK);
}

/**
 * 클라이언트 페이지 자르기 (1-based).
 *
 * @param {Array<T>} items
 * @param {number} page
 * @param {number} size
 * @returns {{ pageItems: Array<T>, totalPages: number, from: number, to: number, total: number }}
 * @template T
 */
export function paginateAdminShopItems(items, page, size) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * size;
  const pageItems = list.slice(start, start + size);
  return {
    pageItems,
    totalPages,
    page: safePage,
    from: total === 0 ? 0 : start + 1,
    to: start + pageItems.length,
    total
  };
}

/**
 * 회당 단가 (가격 ÷ 회기, 반올림). 회기 미설정이면 null.
 *
 * @param {number|null} price
 * @param {number|null} sessions
 * @returns {number|null}
 */
export function computeAdminShopPerSessionPrice(price, sessions) {
  const p = Number(price);
  const s = Number(sessions);
  if (!Number.isFinite(p) || !Number.isFinite(s) || s < ADMIN_SHOP_PRODUCT_SESSION_MIN) {
    return null;
  }
  return Math.round(p / s);
}

/**
 * @param {number|null|undefined} sessions
 * @returns {boolean}
 */
export function isAdminShopProductSessionUnset(sessions) {
  const s = Number(sessions);
  return sessions == null || !Number.isFinite(s) || s < ADMIN_SHOP_PRODUCT_SESSION_MIN;
}

/** 상품 행 종류 */
export const ADMIN_SHOP_PRODUCT_KIND = Object.freeze({
  PACKAGE: 'PACKAGE',
  LEGACY: 'LEGACY'
});

/**
 * @param {object|null|undefined} fee
 * @returns {boolean}
 */
function hasMallContent(fee) {
  if (!fee) {
    return false;
  }
  const description = toDisplayString(fee.descriptionText, '').trim();
  const thumb = toDisplayString(fee.thumbnailUrl, '').trim();
  return Boolean(description) || Boolean(thumb && !isShopCatalogPlaceholderUrl(thumb));
}

/**
 * 공통코드 + 패키지 요금 SKU → 상품 행.
 *
 * @param {object|null} codeRow
 * @param {object|null} fee
 * @param {string} code
 * @param {boolean} [activeOverride]
 * @returns {object}
 */
function buildAdminShopPackageRow(codeRow, fee, code, activeOverride) {
  const extra = parseExtraData(codeRow?.extraData);
  const sessions = extra.sessions != null ? extra.sessions : (fee?.sessionCount ?? null);
  const price = extra.price != null ? extra.price : (fee?.unitPriceMinor ?? null);
  const active = activeOverride != null
    ? activeOverride
    : (codeRow ? codeRow.isActive !== false : fee?.packageActive !== false);
  return {
    key: `pkg-${code}`,
    kind: ADMIN_SHOP_PRODUCT_KIND.PACKAGE,
    code,
    codeId: codeRow?.id ?? null,
    skuId: fee?.skuId ?? null,
    name: toDisplayString(codeRow?.koreanName || codeRow?.codeLabel || fee?.packageName, code),
    category: normalizeShopCatalogCategory(fee?.catalogCategory),
    sessions,
    price,
    perSession: computeAdminShopPerSessionPrice(price, sessions),
    homePublic: codeRow ? isPublicVisible(codeRow.extraData) : false,
    mallVisible: fee?.catalogVisible === true,
    active,
    contentReady: hasMallContent(fee),
    sortOrder: fee?.sortOrder ?? codeRow?.sortOrder ?? 0,
    validityMonths: fee?.validityMonths ?? null,
    thumbnailUrl: toDisplayString(fee?.thumbnailUrl, ''),
    codeRow: codeRow || null,
    fee: fee || null
  };
}

/**
 * 직접 등록 SKU → 상품 행.
 *
 * @param {object} sku
 * @returns {object}
 */
function buildAdminShopLegacyRow(sku) {
  const code = toDisplayString(sku?.skuCode, '');
  return {
    key: `legacy-${sku?.id ?? code}`,
    kind: ADMIN_SHOP_PRODUCT_KIND.LEGACY,
    code,
    codeId: null,
    skuId: sku?.id ?? null,
    name: toDisplayString(sku?.title, code),
    category: normalizeShopCatalogCategory(sku?.catalogCategory),
    sessions: null,
    price: sku?.unitPriceMinor ?? null,
    perSession: null,
    homePublic: false,
    mallVisible: sku?.catalogVisible === true,
    active: sku?.active !== false,
    contentReady: hasMallContent(sku),
    sortOrder: Number.MAX_SAFE_INTEGER,
    validityMonths: sku?.validityMonths ?? null,
    thumbnailUrl: toDisplayString(sku?.thumbnailUrl, ''),
    codeRow: null,
    fee: null
  };
}

/**
 * 공통코드(가격·회기·홈 공개·판매 사용) + 패키지 요금 행(몰 노출·내용) + 직접 등록 SKU → 상품 한 표.
 *
 * @param {{ codes?: Array<object>, packages?: Array<object>, legacySkus?: Array<object> }} sources
 * @returns {Array<object>}
 */
export function mergeAdminShopProducts({ codes = [], packages = [], legacySkus = [] } = {}) {
  const feeByCode = new Map();
  (Array.isArray(packages) ? packages : []).forEach((fee) => {
    const code = toDisplayString(fee?.packageCode, '');
    if (code) {
      feeByCode.set(code, fee);
    }
  });
  const seen = new Set();
  const rows = [];
  (Array.isArray(codes) ? codes : []).forEach((codeRow) => {
    const code = toDisplayString(codeRow?.codeValue, '');
    if (!code) {
      return;
    }
    seen.add(code);
    rows.push(buildAdminShopPackageRow(codeRow, feeByCode.get(code) || null, code));
  });
  feeByCode.forEach((fee, code) => {
    if (!seen.has(code)) {
      rows.push(buildAdminShopPackageRow(null, fee, code));
    }
  });
  (Array.isArray(legacySkus) ? legacySkus : []).forEach((sku) => {
    rows.push(buildAdminShopLegacyRow(sku));
  });
  return rows;
}

/**
 * 서버 통합 목록 행(`/admin/shop/products`) → 상품 행.
 *
 * @param {object} item
 * @returns {object}
 */
export function mapAdminShopServerProduct(item) {
  if (item?.kind === ADMIN_SHOP_PRODUCT_KIND.LEGACY) {
    return buildAdminShopLegacyRow(item.legacySku || { skuCode: item.code, title: item.name });
  }
  const code = toDisplayString(item?.code, '');
  return buildAdminShopPackageRow(item?.codeRow || null, item?.fee || null, code, item?.active !== false);
}

/**
 * @param {object} product
 * @param {string} segment
 * @returns {boolean}
 */
function matchesProductSegment(product, segment) {
  switch (segment) {
    case ADMIN_SHOP_PRODUCT_SEGMENT.ON_SALE:
      return product.active !== false;
    case ADMIN_SHOP_PRODUCT_SEGMENT.STOPPED:
      return product.active === false;
    default:
      return true;
  }
}

/**
 * @param {Array<object>} products
 * @returns {Record<string, number>}
 */
export function countAdminShopProductSegments(products) {
  const list = Array.isArray(products) ? products : [];
  return Object.values(ADMIN_SHOP_PRODUCT_SEGMENT).reduce((acc, segment) => {
    acc[segment] = list.filter((p) => matchesProductSegment(p, segment)).length;
    return acc;
  }, {});
}

/**
 * @param {Array<object>} products
 * @param {{ segment?: string, category?: string, query?: string }} filters
 * @returns {Array<object>}
 */
export function filterAdminShopProducts(products, { segment, category, query } = {}) {
  const q = toDisplayString(query, '').trim().toLowerCase();
  const rank = (p) => (p.active === false ? 1 : 0);
  return (Array.isArray(products) ? products : []).filter((p) => {
    if (segment && !matchesProductSegment(p, segment)) {
      return false;
    }
    if (category && category !== ADMIN_SHOP_PRODUCT_CATEGORY_ALL && p.category !== category) {
      return false;
    }
    if (q) {
      const haystack = `${p.name} ${p.code}`.toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  })
    .map((p, index) => ({ p, index }))
    .sort((a, b) => (rank(a.p) - rank(b.p)) || (a.index - b.index))
    .map(({ p }) => p);
}

/**
 * 퍼센트 입력 → basis points 정수.
 *
 * @param {string|number} percent
 * @returns {number|null} 파싱 실패 시 null
 */
export function adminShopPercentToBps(percent) {
  const raw = toDisplayString(percent, '').trim().replace('%', '');
  if (raw === '') {
    return 0;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.round(n * ADMIN_SHOP_BPS_PER_PERCENT);
}

/**
 * basis points → 퍼센트 문자열.
 *
 * @param {number|string} bps
 * @returns {string}
 */
export function adminShopBpsToPercent(bps) {
  const n = Number(bps);
  if (!Number.isFinite(n)) {
    return '0';
  }
  return String(n / ADMIN_SHOP_BPS_PER_PERCENT);
}

/**
 * 리워드 계산 예시 (저장 전 값). 금액 필드 0 = 제한/조건 없음.
 *
 * @param {{ price: number, earnBps: number, earnCap: number, maxRedeem: number,
 *   allowPgMix: boolean, allowPointsOnly: boolean, pointsUsed?: number }} input
 * @returns {{ limitUnlimited: boolean, limitBlocked: boolean, limit: number|null,
 *   used: number, pay: number, earn: number, capApplied: boolean }}
 */
export function computeAdminShopRewardExample({
  price,
  earnBps,
  earnCap,
  maxRedeem,
  allowPgMix,
  allowPointsOnly,
  pointsUsed = 0
}) {
  const safePrice = Math.max(0, Number(price) || 0);
  const limitBlocked = !allowPgMix && !allowPointsOnly;
  const limitUnlimited = !limitBlocked && !(Number(maxRedeem) > 0);
  const limit = limitBlocked ? 0 : (limitUnlimited ? null : Number(maxRedeem));
  const requested = Math.max(0, Number(pointsUsed) || 0);
  const used = Math.min(requested, safePrice, limit == null ? safePrice : limit);
  const pay = safePrice - used;
  const rawEarn = Math.floor((pay * Math.max(0, Number(earnBps) || 0)) / BPS_SCALE);
  const cap = Number(earnCap) > 0 ? Number(earnCap) : null;
  const earn = cap != null ? Math.min(rawEarn, cap) : rawEarn;
  return {
    limitUnlimited,
    limitBlocked,
    limit,
    used,
    pay,
    earn,
    capApplied: cap != null && rawEarn > cap
  };
}

/**
 * 상품 편집 폼 초기값.
 *
 * @returns {object}
 */
export function emptyAdminShopProductForm() {
  return {
    name: '',
    sessions: String(ADMIN_SHOP_PRODUCT_SESSION_MIN),
    price: '',
    remark: '',
    items: [],
    discountRate: 0,
    originalPrice: null,
    homePublic: true,
    mallVisible: false,
    active: true,
    catalogCategory: SHOP_CATALOG_CATEGORY.CONSULTATION,
    fieldCode: '',
    consultantId: '',
    descriptionText: '',
    thumbnailUrl: '',
    sortOrder: '0',
    validityMonths: ''
  };
}

/**
 * 병합 상품 행 → 편집 폼.
 *
 * @param {object|null|undefined} product mergeAdminShopProducts 행
 * @returns {object}
 */
export function mapAdminShopProductToForm(product) {
  const base = emptyAdminShopProductForm();
  if (!product) {
    return base;
  }
  const extra = parseExtraData(product.codeRow?.extraData);
  const fee = product.fee || {};
  return {
    ...base,
    name: toDisplayString(product.name, ''),
    sessions: product.sessions != null ? String(product.sessions) : '',
    price: product.price != null ? String(product.price) : '',
    remark: extra.remark || '',
    items: Array.isArray(extra.items) ? extra.items : [],
    discountRate: extra.discountRate || 0,
    originalPrice: extra.originalPrice,
    homePublic: product.homePublic === true,
    mallVisible: product.mallVisible === true,
    active: product.active !== false,
    catalogCategory: normalizeShopCatalogCategory(fee.catalogCategory),
    fieldCode: toDisplayString(fee.fieldCode, ''),
    consultantId: fee.consultantId != null ? String(fee.consultantId) : '',
    descriptionText: toDisplayString(fee.descriptionText, ''),
    thumbnailUrl: toDisplayString(fee.thumbnailUrl, ''),
    sortOrder: fee.sortOrder != null ? String(fee.sortOrder) : '0',
    validityMonths: fee.validityMonths != null ? String(fee.validityMonths) : ''
  };
}

/**
 * 구성(조합 패키지) → 회기·가격 합산. 할인율(%) 적용.
 *
 * @param {object} form
 * @param {Array<{ sessions: number, price: number }>} items
 * @returns {object}
 */
export function applyAdminShopProductComposition(form, items) {
  if (!items || items.length === 0) {
    return { ...form, items: [], originalPrice: null };
  }
  const sessions = items.reduce((acc, item) => acc + (Number(item.sessions) || 0), 0);
  const originalPrice = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const rate = Number(form.discountRate) || 0;
  return {
    ...form,
    items,
    sessions: String(sessions),
    originalPrice,
    price: String(Math.floor((originalPrice * (PERCENT_FULL - rate)) / PERCENT_FULL))
  };
}

/**
 * @param {string|number} value
 * @returns {number|null}
 */
function parseWholeNumber(value) {
  const raw = toDisplayString(value, '').replace(/[,\s]/g, '');
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  return Number.parseInt(raw, 10);
}

/**
 * 상품 폼 검증 — 필드별 오류 키만 돌려준다 (문구는 화면 상수).
 *
 * @param {object} form
 * @returns {{ valid: boolean, errors: Record<string, boolean>, sessions: number|null, price: number|null,
 *   validityMonths: number|null }}
 */
export function validateAdminShopProductForm(form) {
  const errors = {};
  const sessions = parseWholeNumber(form?.sessions);
  const price = parseWholeNumber(form?.price);
  const validityRaw = toDisplayString(form?.validityMonths, '').trim();
  const validityMonths = validityRaw === '' ? null : parseWholeNumber(validityRaw);
  if (validityRaw !== '' && (validityMonths == null || validityMonths < ADMIN_SHOP_PRODUCT_VALIDITY_MIN)) {
    errors.validityMonths = true;
  }
  if (!toDisplayString(form?.name, '').trim()) {
    errors.name = true;
  }
  if (sessions == null || sessions < ADMIN_SHOP_PRODUCT_SESSION_MIN) {
    errors.sessions = true;
  }
  if (price == null) {
    errors.price = true;
  }
  return { valid: Object.keys(errors).length === 0, errors, sessions, price, validityMonths };
}

/**
 * 저장 전 변경 필드 수.
 *
 * @param {object} initial
 * @param {object} current
 * @returns {number}
 */
export function countAdminShopFormChanges(initial, current) {
  if (!initial || !current) {
    return 0;
  }
  return Object.keys(initial).filter((key) => String(initial[key]) !== String(current[key])).length;
}
