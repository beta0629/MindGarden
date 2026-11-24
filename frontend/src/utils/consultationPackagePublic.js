/**
 * 공개 상품·가격 — CONSULTATION_PACKAGE 정규화
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

import { parseExtraData } from './packagePricing';
import { CONSULTATION_PACKAGE_EMPTY_MESSAGE } from '../constants/legalPublic';

/**
 * @typedef {{ name: string, description: string, price: number|null, priceLabel: string }} PublicConsultationPackage
 */

/**
 * @param {number|null|undefined} price
 * @returns {string}
 */
export function formatConsultationPackagePriceLabel(price) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) {
    return CONSULTATION_PACKAGE_EMPTY_MESSAGE;
  }
  const n = Number(price);
  try {
    return `${new Intl.NumberFormat('ko-KR').format(n)}원`;
  } catch {
    return `${n}원`;
  }
}

/**
 * by-subdomain consultationPackages 또는 공통코드 row → 공개 리스트 항목
 *
 * @param {object} row
 * @returns {PublicConsultationPackage|null}
 */
export function normalizeConsultationPackageRow(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const fromApiName = typeof row.name === 'string' ? row.name.trim() : '';
  const fromCodeName = (row.koreanName || row.codeLabel || row.codeValue || '').toString().trim();
  const name = fromApiName || fromCodeName;
  if (!name) {
    return null;
  }

  let description = '';
  if (typeof row.description === 'string' && row.description.trim()) {
    description = row.description.trim();
  } else if (typeof row.codeDescription === 'string' && row.codeDescription.trim()) {
    description = row.codeDescription.trim();
  } else {
    const extra = parseExtraData(row.extraData);
    if (extra.remark) {
      description = extra.remark;
    }
  }

  const extra = parseExtraData(row.extraData);

  let price = null;
  if (row.price !== undefined && row.price !== null && row.price !== '') {
    const n = Number(row.price);
    price = Number.isNaN(n) ? null : n;
  } else {
    price = extra.price;
  }

  let sessions = null;
  if (row.sessions !== undefined && row.sessions !== null && row.sessions !== '') {
    const n = Number(row.sessions);
    sessions = Number.isNaN(n) ? null : n;
  } else if (extra.sessions != null) {
    sessions = extra.sessions;
  }

  return {
    name,
    description,
    price,
    sessions,
    priceLabel: formatConsultationPackagePriceLabel(price)
  };
}

/**
 * @param {unknown} list
 * @returns {PublicConsultationPackage[]}
 */
export function normalizeConsultationPackageList(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((row) => normalizeConsultationPackageRow(row))
    .filter(Boolean);
}

export { CONSULTATION_PACKAGE_EMPTY_MESSAGE };
