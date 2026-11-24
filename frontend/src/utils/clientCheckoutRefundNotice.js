/**
 * 결제 전 패키지 환불 차감 요약 — React 비의존 순수 헬퍼.
 * BE PublicCounselingServiceGuideService.firstSentences 와 동일 분할 패턴.
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import {
  CLIENT_CHECKOUT_REFUND_COPY,
  CLIENT_REFUND_NOTICE
} from '../constants/clientMallConstants';
import { isShopSingleSession } from './shopSessionCount';

const SINGLE_SESSION_NAME_RE = /단회/;
const SINGLE_SESSION_CODE_RE = /ONCE|SINGLE|단회/i;

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function toFiniteNumberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * 환불 안내 본문을 다./요. 종결 기준으로 앞 limit 문장만 반환.
 *
 * @param {string|null|undefined} text
 * @param {number} limit
 * @returns {string}
 */
export function firstRefundSentences(text, limit = CLIENT_CHECKOUT_REFUND_COPY.FIRST_SENTENCES_LIMIT) {
  if (text == null || String(text).trim() === '' || limit < 1) {
    return '';
  }
  const normalized = String(text).trim().replace(/\r\n/g, '\n');
  const parts = normalized.split(/(?<=다\.)|(?<=요\.)/);
  const sentences = [];
  for (const part of parts) {
    const sentence = part.trim();
    if (!sentence) {
      continue;
    }
    sentences.push(sentence);
    if (sentences.length >= limit) {
      break;
    }
  }
  if (sentences.length === 0) {
    return normalized;
  }
  return sentences.join(' ');
}

/**
 * @param {string} joined
 * @returns {string[]}
 */
function splitJoinedSentencesToLines(joined) {
  if (!joined) {
    return [];
  }
  const parts = joined.split(/(?<=다\.)|(?<=요\.)/);
  const lines = [];
  for (const part of parts) {
    const sentence = part.trim();
    if (sentence) {
      lines.push(sentence);
    }
  }
  return lines.length > 0 ? lines : [joined];
}

/**
 * @param {object|null|undefined} row
 * @returns {boolean}
 */
function isSingleSessionConsultationPackage(row) {
  if (!row || typeof row !== 'object') {
    return false;
  }
  const sessions = toFiniteNumberOrNull(row.sessions ?? row.sessionCount);
  if (sessions === 1) {
    return true;
  }
  const name = String(row.name ?? row.title ?? row.koreanName ?? row.codeLabel ?? '');
  if (SINGLE_SESSION_NAME_RE.test(name)) {
    return true;
  }
  const code = String(row.code ?? row.codeValue ?? row.skuCode ?? '');
  return SINGLE_SESSION_CODE_RE.test(code);
}

/**
 * 단회 정상가(원 단위 정수) 조회. 없으면 null.
 * 우선순위: consultationPackages(단회) → catalogSkus(단회 unitPriceMinor).
 *
 * @param {{ consultationPackages?: object[], catalogSkus?: object[] }} params
 * @returns {number|null}
 */
export function resolveSingleSessionRegularPriceMinor({
  consultationPackages = [],
  catalogSkus = []
} = {}) {
  const packages = Array.isArray(consultationPackages) ? consultationPackages : [];
  for (const pkg of packages) {
    if (!isSingleSessionConsultationPackage(pkg)) {
      continue;
    }
    const price = toFiniteNumberOrNull(pkg.price ?? pkg.unitPriceMinor);
    if (price != null && price >= 0) {
      return price;
    }
  }

  const skus = Array.isArray(catalogSkus) ? catalogSkus : [];
  for (const sku of skus) {
    if (!sku || typeof sku !== 'object') {
      continue;
    }
    if (!isShopSingleSession(sku.sessionCount) && !isSingleSessionConsultationPackage(sku)) {
      continue;
    }
    const unit = toFiniteNumberOrNull(sku.unitPriceMinor ?? sku.price ?? sku.originalPriceMinor);
    if (unit != null && unit >= 0) {
      return unit;
    }
  }

  return null;
}

/**
 * @param {number|null|undefined} regularPriceMinor
 * @param {(n: number) => string} [formatWon]
 * @returns {string}
 */
function resolvePriceLabel(regularPriceMinor, formatWon) {
  const price = toFiniteNumberOrNull(regularPriceMinor);
  if (price != null && typeof formatWon === 'function') {
    const formatted = formatWon(price);
    if (formatted != null && String(formatted).trim() !== '') {
      // 「{priceLabel}로」조사 결합 — 금액만 넣으면 「85,000원로」가 되므로 정상가(...)로 감싼다.
      return `정상가(${String(formatted).trim()})`;
    }
  }
  return CLIENT_CHECKOUT_REFUND_COPY.PRICE_LABEL_FALLBACK;
}

/**
 * 결제 전 환불 차감 요약 bullet 목록.
 * 1) refundPolicyText 앞 1~2문장 2) 구조화 템플릿 3) CLIENT_REFUND_NOTICE.
 *
 * @param {{
 *   refundPolicyText?: string|null,
 *   regularPriceMinor?: number|null,
 *   formatWon?: ((n: number) => string)|null
 * }} params
 * @returns {{ lines: string[], usedFallback: boolean }}
 */
export function buildCheckoutRefundDeductionLines({
  refundPolicyText = '',
  regularPriceMinor = null,
  formatWon = null
} = {}) {
  const fromPolicy = firstRefundSentences(
    refundPolicyText,
    CLIENT_CHECKOUT_REFUND_COPY.FIRST_SENTENCES_LIMIT
  );
  if (fromPolicy) {
    return {
      lines: splitJoinedSentencesToLines(fromPolicy),
      usedFallback: false
    };
  }

  const hasPrice = toFiniteNumberOrNull(regularPriceMinor) != null;
  const canFormat = typeof formatWon === 'function';
  if (hasPrice || canFormat) {
    const priceLabel = resolvePriceLabel(regularPriceMinor, formatWon);
    const deduction = CLIENT_CHECKOUT_REFUND_COPY.DEDUCTION_TEMPLATE.replace(
      '{priceLabel}',
      priceLabel
    );
    return {
      lines: [deduction, CLIENT_CHECKOUT_REFUND_COPY.DEDUCTION_CAP],
      usedFallback: false
    };
  }

  return {
    lines: [CLIENT_REFUND_NOTICE],
    usedFallback: true
  };
}
