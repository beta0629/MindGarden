/**
 * 내담자 몰 순수 로직 — 가격·이용기간·장바구니 요약·결제 버튼 게이트.
 * React/DOM 의존 없음 → Expo 앱이 그대로 재사용할 수 있다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_COPY,
  CLIENT_MALL_DATE_COPY
} from '../constants/clientMallConstants';
import { normalizeShopSessionCount } from './shopSessionCount';

const KO_LOCALE = 'ko-KR';

/**
 * @param {number|string|null|undefined} minor
 * @returns {string} 예: 850,000
 */
export const formatMallNumber = (minor) => {
  const n = Number(minor);
  return (Number.isFinite(n) ? Math.round(n) : 0).toLocaleString(KO_LOCALE);
};

/**
 * 「N원」 표기 (₩ 미사용).
 *
 * @param {number|string|null|undefined} minor
 * @returns {string}
 */
export const formatMallWon = (minor) => `${formatMallNumber(minor)}${CLIENT_MALL_COPY.WON_UNIT}`;

/**
 * 회당 단가 — 2회기 이상일 때만.
 *
 * @param {number} unitPriceMinor
 * @param {number|string} sessionCount
 * @returns {number|null}
 */
export const resolvePerSessionMinor = (unitPriceMinor, sessionCount) => {
  const count = normalizeShopSessionCount(sessionCount);
  const price = Number(unitPriceMinor);
  if (count <= 1 || !Number.isFinite(price) || price <= 0) {
    return null;
  }
  return Math.round(price / count);
};

/**
 * @param {number|string} sessionCount
 * @returns {string} 예: 10회기
 */
export const formatMallSessionLabel = (sessionCount) =>
  `${normalizeShopSessionCount(sessionCount)}${CLIENT_MALL_COPY.SESSION_UNIT}`;

/**
 * 상품 설정 이용기간(개월). 양의 정수가 아니면 null (표시 생략).
 *
 * @param {{ validityMonths?: number|string|null }|null|undefined} row
 * @returns {number|null}
 */
export const resolveValidityMonths = (row) => {
  const n = Number(row?.validityMonths);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/**
 * @param {number} months
 * @returns {string} 예: 결제일부터 3개월
 */
export const formatValidityLabel = (months) =>
  `${CLIENT_MALL_COPY.VALIDITY_PREFIX}${months}${CLIENT_MALL_COPY.VALIDITY_SUFFIX}`;

/**
 * 결제일 + N개월 (같은 날, 말일 넘치면 그 달 말일) — BE LocalDate.plusMonths 와 동일.
 *
 * @param {Date} baseDate
 * @param {number} months
 * @returns {Date}
 */
export const addMonthsClamped = (baseDate, months) => {
  const y = baseDate.getFullYear();
  const m = baseDate.getMonth() + months;
  const d = baseDate.getDate();
  const lastDay = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(d, lastDay));
};

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * @param {Date} date
 * @returns {string} YYYY.MM.DD
 */
export const formatMallDotDate = (date) =>
  `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;

/**
 * 예시 날짜 문장 — 상품 개월 수로 계산 (해가 바뀌면 연도 표기).
 *
 * @param {number} months
 * @param {Date} [today]
 * @returns {string} 예: 예: 9월 28일 결제 시 12월 28일까지 사용 가능(당일 포함)
 */
export const buildValidityExampleText = (months, today = new Date()) => {
  const { YEAR, MONTH, DAY, EXAMPLE_PREFIX, EXAMPLE_MIDDLE, EXAMPLE_SUFFIX } = CLIENT_MALL_DATE_COPY;
  const end = addMonthsClamped(today, months);
  const monthDay = (date) => `${date.getMonth() + 1}${MONTH} ${date.getDate()}${DAY}`;
  const yearPrefix = end.getFullYear() !== today.getFullYear() ? `${end.getFullYear()}${YEAR} ` : '';
  return `${EXAMPLE_PREFIX}${monthDay(today)}${EXAMPLE_MIDDLE}${yearPrefix}${monthDay(end)}${EXAMPLE_SUFFIX}`;
};

/**
 * 카탈로그 행을 skuCode 로 찾는 맵.
 *
 * @param {Array<{ skuCode?: string }>} catalog
 * @returns {Map<string, object>}
 */
export const indexCatalogBySku = (catalog) => {
  const map = new Map();
  (catalog || []).forEach((row) => {
    if (row?.skuCode) {
      map.set(row.skuCode, row);
    }
  });
  return map;
};

/**
 * 게스트 로컬 줄(skuCode·quantity)을 카탈로그로 채워 서버 카트와 같은 모양으로 만든다.
 *
 * @param {Array<{ skuCode: string, quantity: number }>} guestLines
 * @param {Array<object>} catalog
 * @returns {{ lines: Array<object>, subtotalMinor: number }}
 */
export const buildCartFromGuestLines = (guestLines, catalog) => {
  const bySku = indexCatalogBySku(catalog);
  const lines = (guestLines || [])
    .map((line) => {
      const row = bySku.get(line.skuCode);
      if (!row) {
        return null;
      }
      const quantity = Number(line.quantity) || 0;
      const unitPriceMinor = Number(row.unitPriceMinor) || 0;
      return {
        skuCode: row.skuCode,
        title: row.title,
        quantity,
        unitPriceMinor,
        lineTotalMinor: unitPriceMinor * quantity,
        sessionCount: row.sessionCount
      };
    })
    .filter((line) => line && line.quantity > 0);
  const subtotalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  return { lines, subtotalMinor };
};

/**
 * 장바구니 요약 (개수·합계·받는 회기·공통 이용기간).
 *
 * @param {{ lines?: Array<object>, subtotalMinor?: number }} cart
 * @param {Array<object>} [catalog]
 * @returns {{
 *   quantity: number,
 *   subtotalMinor: number,
 *   totalSessions: number,
 *   validityMonths: number|null,
 *   mixedValidity: boolean,
 *   isEmpty: boolean
 * }}
 */
export const summarizeMallCart = (cart, catalog = []) => {
  const lines = Array.isArray(cart?.lines) ? cart.lines : [];
  const bySku = indexCatalogBySku(catalog);
  let quantity = 0;
  let totalSessions = 0;
  const monthsSet = new Set();
  let unknownMonths = false;
  lines.forEach((line) => {
    const qty = Number(line.quantity) || 0;
    quantity += qty;
    totalSessions += normalizeShopSessionCount(line.sessionCount) * qty;
    const months = resolveValidityMonths(line) ?? resolveValidityMonths(bySku.get(line.skuCode));
    if (months == null) {
      unknownMonths = true;
    } else {
      monthsSet.add(months);
    }
  });
  const subtotal = Number(cart?.subtotalMinor);
  const subtotalMinor = Number.isFinite(subtotal)
    ? subtotal
    : lines.reduce((sum, line) => sum + (Number(line.lineTotalMinor) || 0), 0);
  const uniform = !unknownMonths && monthsSet.size === 1;
  return {
    quantity,
    subtotalMinor,
    totalSessions,
    validityMonths: uniform ? [...monthsSet][0] : null,
    mixedValidity: monthsSet.size > 1,
    isEmpty: lines.length === 0
  };
};

/** 결제 버튼 비활성 사유 키 */
export const MALL_PAY_BLOCK = Object.freeze({
  NONE: 'NONE',
  BOTH: 'BOTH',
  PHONE: 'PHONE',
  AGREEMENT: 'AGREEMENT'
});

/**
 * 결제 버튼 = 휴대폰 인증 + 전체 동의 둘 다 끝나야 활성.
 *
 * @param {{ phoneVerified: boolean, allAgreed: boolean }} state
 * @returns {string} MALL_PAY_BLOCK
 */
export const resolveMallPayBlock = ({ phoneVerified, allAgreed }) => {
  if (!phoneVerified && !allAgreed) {
    return MALL_PAY_BLOCK.BOTH;
  }
  if (!phoneVerified) {
    return MALL_PAY_BLOCK.PHONE;
  }
  if (!allAgreed) {
    return MALL_PAY_BLOCK.AGREEMENT;
  }
  return MALL_PAY_BLOCK.NONE;
};

/**
 * @param {string} block MALL_PAY_BLOCK
 * @returns {string} 버튼 아래 도움말 (없으면 '')
 */
export const resolveMallPayBlockMessage = (block) => {
  switch (block) {
    case MALL_PAY_BLOCK.BOTH:
      return CLIENT_MALL_CHECKOUT_COPY.BLOCK_BOTH;
    case MALL_PAY_BLOCK.PHONE:
      return CLIENT_MALL_CHECKOUT_COPY.BLOCK_PHONE;
    case MALL_PAY_BLOCK.AGREEMENT:
      return CLIENT_MALL_CHECKOUT_COPY.BLOCK_AGREEMENT;
    default:
      return '';
  }
};

/**
 * 휴대폰 마스킹 — 010-****-1234.
 *
 * @param {string} digits
 * @returns {string}
 */
export const maskMallPhone = (digits) => {
  const d = String(digits || '').replace(/\D/g, '');
  if (d.length < 7) {
    return d;
  }
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
};

/**
 * 입력 중 하이픈 표시.
 *
 * @param {string} digits
 * @returns {string}
 */
export const formatMallPhoneInput = (digits) => {
  const d = String(digits || '').replace(/\D/g, '');
  if (d.length <= 3) {
    return d;
  }
  if (d.length <= 7) {
    return `${d.slice(0, 3)}-${d.slice(3)}`;
  }
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
};

/**
 * @param {number} totalSeconds
 * @returns {string} m:ss
 */
export const formatMallCountdown = (totalSeconds) => {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  return `${Math.floor(s / 60)}:${pad2(s % 60)}`;
};
