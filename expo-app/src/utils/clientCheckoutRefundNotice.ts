/**
 * 결제 전 패키지 환불 차감 요약 — 웹 `frontend/src/utils/clientCheckoutRefundNotice.js` 패리티.
 * Metro는 frontend import를 허용하지 않으므로 동일 순수 로직을 둔다.
 *
 * @author MindGarden
 * @since 2026-11-24
 */

import {
  CLIENT_CHECKOUT_REFUND_COPY,
  CLIENT_REFUND_NOTICE,
} from '@/constants/clientCheckoutRefundCopy';

const SHOP_SINGLE_SESSION_COUNT = 1;
const SINGLE_SESSION_NAME_RE = /단회/;
const SINGLE_SESSION_CODE_RE = /ONCE|SINGLE|단회/i;

function toFiniteNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isShopSingleSession(sessionCount: unknown): boolean {
  return Number(sessionCount) === SHOP_SINGLE_SESSION_COUNT;
}

/**
 * 환불 안내 본문을 다./요. 종결 기준으로 앞 limit 문장만 반환.
 */
export function firstRefundSentences(
  text: string | null | undefined,
  limit: number = CLIENT_CHECKOUT_REFUND_COPY.FIRST_SENTENCES_LIMIT,
): string {
  if (text == null || String(text).trim() === '' || limit < 1) {
    return '';
  }
  const normalized = String(text).trim().replace(/\r\n/g, '\n');
  const parts = normalized.split(/(?<=다\.)|(?<=요\.)/);
  const sentences: string[] = [];
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

function splitJoinedSentencesToLines(joined: string): string[] {
  if (!joined) {
    return [];
  }
  const parts = joined.split(/(?<=다\.)|(?<=요\.)/);
  const lines: string[] = [];
  for (const part of parts) {
    const sentence = part.trim();
    if (sentence) {
      lines.push(sentence);
    }
  }
  return lines.length > 0 ? lines : [joined];
}

function isSingleSessionConsultationPackage(
  row: SingleSessionPriceRow | null | undefined,
): boolean {
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

export type SingleSessionPriceRow = {
  name?: unknown;
  title?: unknown;
  koreanName?: unknown;
  codeLabel?: unknown;
  code?: unknown;
  codeValue?: unknown;
  skuCode?: unknown;
  sessions?: unknown;
  sessionCount?: unknown;
  price?: unknown;
  unitPriceMinor?: unknown;
  originalPriceMinor?: unknown;
};

export type ResolveSingleSessionPriceParams = {
  consultationPackages?: readonly SingleSessionPriceRow[];
  catalogSkus?: readonly SingleSessionPriceRow[];
};

/**
 * 단회 정상가(원 단위 정수) 조회. 없으면 null.
 */
export function resolveSingleSessionRegularPriceMinor({
  consultationPackages = [],
  catalogSkus = [],
}: ResolveSingleSessionPriceParams = {}): number | null {
  for (const pkg of consultationPackages) {
    if (!isSingleSessionConsultationPackage(pkg)) {
      continue;
    }
    const price = toFiniteNumberOrNull(pkg.price ?? pkg.unitPriceMinor);
    if (price != null && price >= 0) {
      return price;
    }
  }

  for (const sku of catalogSkus) {
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

function resolvePriceLabel(
  regularPriceMinor: number | null | undefined,
  formatWon?: ((n: number) => string) | null,
): string {
  const price = toFiniteNumberOrNull(regularPriceMinor);
  if (price != null && typeof formatWon === 'function') {
    const formatted = formatWon(price);
    if (formatted != null && String(formatted).trim() !== '') {
      return String(formatted).trim();
    }
  }
  return CLIENT_CHECKOUT_REFUND_COPY.PRICE_LABEL_FALLBACK;
}

export type BuildCheckoutRefundLinesParams = {
  refundPolicyText?: string | null;
  regularPriceMinor?: number | null;
  formatWon?: ((n: number) => string) | null;
};

export type BuildCheckoutRefundLinesResult = {
  lines: string[];
  usedFallback: boolean;
};

/**
 * 결제 전 환불 차감 요약 bullet 목록.
 */
export function buildCheckoutRefundDeductionLines({
  refundPolicyText = '',
  regularPriceMinor = null,
  formatWon = null,
}: BuildCheckoutRefundLinesParams = {}): BuildCheckoutRefundLinesResult {
  const fromPolicy = firstRefundSentences(
    refundPolicyText,
    CLIENT_CHECKOUT_REFUND_COPY.FIRST_SENTENCES_LIMIT,
  );
  if (fromPolicy) {
    return {
      lines: splitJoinedSentencesToLines(fromPolicy),
      usedFallback: false,
    };
  }

  const hasPrice = toFiniteNumberOrNull(regularPriceMinor) != null;
  const canFormat = typeof formatWon === 'function';
  if (hasPrice || canFormat) {
    const priceLabel = resolvePriceLabel(regularPriceMinor, formatWon);
    const deduction = CLIENT_CHECKOUT_REFUND_COPY.DEDUCTION_TEMPLATE.replace(
      '{priceLabel}',
      priceLabel,
    );
    return {
      lines: [deduction, CLIENT_CHECKOUT_REFUND_COPY.DEDUCTION_CAP],
      usedFallback: false,
    };
  }

  return {
    lines: [CLIENT_REFUND_NOTICE],
    usedFallback: true,
  };
}
