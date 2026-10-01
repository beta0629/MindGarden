/**
 * 공개 상담 서비스 안내 뷰. 값은 by-subdomain serviceGuide 와 사업자 레코드만.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */

import { CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE } from '../constants/legalPublic';

export const GUIDE_COPY = Object.freeze({
  ONE_LINER_WITH_NAME:
    '%s는 상담사와 1:1로 만나 마음의 어려움을 함께 살펴보는 심리상담센터예요.',
  ONE_LINER_WITHOUT_NAME:
    '상담사와 1:1로 만나 마음의 어려움을 함께 살펴보는 심리상담센터예요.',
  REFUND_EMPTY_WITH_PHONE: '환불 규정은 센터에 문의해 주세요 (%s).',
  REFUND_EMPTY: '환불 규정은 센터에 문의해 주세요.',
  PRODUCTS_EMPTY_WITH_PHONE:
    '지금 온라인으로 구매할 수 있는 상품이 없어요. 상담은 %s로 문의해 주세요.',
  PRODUCTS_EMPTY:
    '지금 온라인으로 구매할 수 있는 상품이 없어요. 상담은 센터에 문의해 주세요.',
  TYPES_LEAD: '센터에서 받을 수 있는 상담이에요.',
  PRODUCTS_LEAD: '온라인으로 구매할 수 있는 상담 회기예요. 결제는 카드 결제만 가능해요.',
  COUNSELOR_LEAD: '센터 상담사의 자격이에요.',
  PROCESS_APPLY: '전화로 상담을 신청해요. 상담 일정은 센터에서 연락드려요.',
  PROCESS_INTAKE: '첫 만남에서 지금의 어려움과 바라는 점을 듣고 상담 방향을 함께 정해요.',
  PROCESS_CLOSE: '목표를 함께 돌아보고 상담을 마무리해요.',
  SESSION_WITH_MINUTES:
    '정한 일정에 맞춰 상담사와 1회 %s분씩 만나요. 회기는 상품의 이용기간 안에 사용해요.',
  SESSION_WITHOUT_MINUTES:
    '정한 일정에 맞춰 상담사와 정해진 시간 동안 만나요. 회기는 상품의 이용기간 안에 사용해요.'
});

/**
 * @param {unknown} value
 * @returns {string}
 */
function text(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

/**
 * @param {string} template
 * @param {string} value
 * @returns {string}
 */
function fill(template, value) {
  return template.replace('%s', value);
}

/**
 * @param {unknown} label
 * @returns {boolean}
 */
export function looksLikeTestProductLabel(label) {
  const trimmed = text(label);
  if (!trimmed) {
    return false;
  }
  if (trimmed.includes('테스트') || trimmed.includes('샘플')) {
    return true;
  }
  const upper = trimmed.toUpperCase();
  return upper.startsWith('TEST_') || upper.includes('SAMPLE');
}

/**
 * 공개 페이지에서 빼야 하는 테스트·샘플 상품.
 *
 * @param {object|null|undefined} row
 * @returns {boolean}
 */
export function isExcludedPublicProduct(row) {
  if (!row || typeof row !== 'object') {
    return true;
  }
  const extra = row.extra && typeof row.extra === 'object' ? row.extra : {};
  if (row.publicVisible === false || extra.publicVisible === false) {
    return true;
  }
  if (String(row.publicVisible).toLowerCase() === 'false'
    || String(extra.publicVisible).toLowerCase() === 'false') {
    return true;
  }
  if (row.isTest === true || extra.isTest === true
    || String(row.isTest).toLowerCase() === 'true'
    || String(extra.isTest).toLowerCase() === 'true') {
    return true;
  }
  const code = row.code || row.sku || row.codeValue || '';
  return looksLikeTestProductLabel(row.name) || looksLikeTestProductLabel(code);
}

/**
 * @param {unknown} list
 * @returns {object[]}
 */
export function filterPublicGuideProducts(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter((row) => row && text(row.name) && !isExcludedPublicProduct(row));
}

/**
 * @param {Array<{minutes?: number|null}>|null|undefined} types
 * @returns {number|null}
 */
export function sharedGuideMinutes(types) {
  if (!Array.isArray(types)) {
    return null;
  }
  let found = null;
  for (let i = 0; i < types.length; i += 1) {
    const minutes = types[i]?.minutes;
    if (minutes === null || minutes === undefined || minutes === '') {
      continue;
    }
    const n = Number(minutes);
    if (Number.isNaN(n)) {
      continue;
    }
    if (found === null) {
      found = n;
    } else if (found !== n) {
      return null;
    }
  }
  return found;
}

/**
 * @param {object|null|undefined} meta fetchTenantPublicHomeMeta 결과
 * @returns {object}
 */
export function buildGuideView(meta) {
  const tenant = meta?.tenant && typeof meta.tenant === 'object' ? meta.tenant : {};
  const guide = tenant.serviceGuide && typeof tenant.serviceGuide === 'object'
    ? tenant.serviceGuide
    : {};
  const legal = tenant.merchantLegal && typeof tenant.merchantLegal === 'object'
    ? tenant.merchantLegal
    : {};

  const centerName = text(guide.centerName) || text(tenant.name);
  const businessAddress = text(guide.businessAddress) || text(legal.businessAddress);
  const businessLandline = text(guide.businessLandline) || text(legal.businessLandline);
  const oneLinerRaw = text(guide.oneLiner);
  const oneLiner = oneLinerRaw
    || (centerName
      ? fill(GUIDE_COPY.ONE_LINER_WITH_NAME, centerName)
      : GUIDE_COPY.ONE_LINER_WITHOUT_NAME);
  const refundRaw = text(guide.refundBody);
  const refundBody = refundRaw
    || (businessLandline
      ? fill(GUIDE_COPY.REFUND_EMPTY_WITH_PHONE, businessLandline)
      : GUIDE_COPY.REFUND_EMPTY);
  const types = Array.isArray(guide.types) ? guide.types.filter((row) => text(row?.name)) : [];
  const counselors = Array.isArray(guide.counselors)
    ? guide.counselors.filter((row) => text(row?.name) || (Array.isArray(row?.lines) && row.lines.length > 0))
    : [];
  const products = filterPublicGuideProducts(
    Array.isArray(guide.products) ? guide.products : tenant.consultationPackages
  );

  return {
    centerName,
    representativeName: text(guide.representativeName) || text(legal.representativeName),
    businessRegistrationNumber: text(guide.businessRegistrationNumber)
      || text(legal.businessRegistrationNumber),
    mailOrderReportNumber: text(guide.mailOrderReportNumber) || text(legal.mailOrderReportNumber),
    businessAddress,
    businessLandline,
    oneLiner,
    centerIntro: text(guide.centerIntro).slice(0, 600),
    refundBody,
    paymentNote: CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE,
    pageTitle: centerName ? `상담 서비스 안내 · ${centerName}` : '상담 서비스 안내',
    pageDescription: text(guide.pageDescription)
      || `${centerName || '센터'}의 심리상담 서비스 안내 — 상담 종류, 진행 절차, 상담사 자격, 상품·가격, 환불 규정을 확인할 수 있어요.`,
    types,
    counselors,
    products,
    showCenter: Boolean(centerName || businessAddress || businessLandline),
    showTypes: types.length > 0,
    showCounselors: counselors.length > 0
  };
}

/**
 * @param {number|null|undefined} price
 * @returns {string}
 */
export function formatGuidePrice(price) {
  if (price === null || price === undefined || price === '' || Number.isNaN(Number(price))) {
    return '—';
  }
  return `${new Intl.NumberFormat('ko-KR').format(Number(price))}원`;
}

/**
 * @param {object} row
 * @returns {string}
 */
export function formatGuideValidity(row) {
  const months = row?.validityMonths;
  if (months === null || months === undefined || months === '') {
    return '—';
  }
  return `결제일부터 ${months}개월`;
}

/**
 * @param {object} row
 * @returns {string}
 */
export function formatGuideComposition(row) {
  const parts = [];
  if (row?.sessions !== null && row?.sessions !== undefined && row?.sessions !== '') {
    parts.push(`${row.sessions}회기`);
  }
  if (row?.minutes !== null && row?.minutes !== undefined && row?.minutes !== '') {
    parts.push(`1회 ${row.minutes}분`);
  }
  return parts.join(' · ');
}
