/**
 * 어드민 Shop 카탈로그 SKU 폼 매핑 (목록·에디터 공유)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import {
  ADMIN_SHOP_DESCRIPTION_MAX_LENGTH,
  ADMIN_SHOP_FIELD_CODE_GROUP,
  ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE,
  ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE
} from '../constants/adminShopCatalog';
import { SHOP_CATALOG_CATEGORY } from '../constants/clientShopConstants';
import { toDisplayString } from './safeDisplay';
import {
  SHOP_SESSION_COUNT_MIN,
  normalizeShopSessionCount,
  resolveShopPackageType
} from './shopSessionCount';

export const ADMIN_SHOP_SKU_TITLE_MAX = 200;

export const emptyAdminShopCatalogForm = () => ({
  title: '',
  descriptionText: '',
  unitPriceMinor: '',
  currency: 'KRW',
  catalogCategory: SHOP_CATALOG_CATEGORY.CONSULTATION,
  catalogVisible: true,
  active: true,
  sortOrder: '0',
  thumbnailUrl: '',
  skuCode: '',
  sessionCount: String(SHOP_SESSION_COUNT_MIN),
  fieldCode: ''
});

/**
 * @param {object|null|undefined} row
 * @returns {ReturnType<typeof emptyAdminShopCatalogForm>}
 */
export function mapAdminShopCatalogRowToForm(row) {
  if (!row || typeof row !== 'object') {
    return emptyAdminShopCatalogForm();
  }
  const categoryRaw = toDisplayString(row.catalogCategory, '').toUpperCase();
  const catalogCategory =
    categoryRaw === SHOP_CATALOG_CATEGORY.ASSESSMENT
      ? SHOP_CATALOG_CATEGORY.ASSESSMENT
      : SHOP_CATALOG_CATEGORY.CONSULTATION;
  return {
    skuCode: toDisplayString(row.skuCode, ''),
    title: toDisplayString(row.title, ''),
    descriptionText: toDisplayString(row.descriptionText, ''),
    unitPriceMinor: row.unitPriceMinor != null ? String(row.unitPriceMinor) : '',
    currency: toDisplayString(row.currency, 'KRW'),
    catalogCategory,
    catalogVisible: row.catalogVisible !== false,
    active: row.active !== false,
    sortOrder: row.sortOrder != null ? String(row.sortOrder) : '0',
    thumbnailUrl: toDisplayString(row.thumbnailUrl || row.heroImageUrl, ''),
    sessionCount: String(normalizeShopSessionCount(row.sessionCount)),
    fieldCode: toDisplayString(row.fieldCode, '')
  };
}

/**
 * @param {ReturnType<typeof emptyAdminShopCatalogForm>} form
 * @returns {{ valid: boolean, message?: string, sessionCount?: number }}
 */
export function validateAdminShopCatalogSessionCount(form) {
  const raw = String(form?.sessionCount ?? '').trim();
  if (!raw) {
    return { valid: false, message: ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE };
  }
  const sessionCount = Number.parseInt(raw, 10);
  if (!Number.isFinite(sessionCount) || sessionCount < SHOP_SESSION_COUNT_MIN) {
    return { valid: false, message: ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE };
  }
  return { valid: true, sessionCount };
}

/**
 * 상담 분야(SPECIALTY) 또는 검사 종류(ASSESSMENT_TYPE) 공통코드 그룹.
 *
 * @param {string|null|undefined} catalogCategory
 * @returns {string}
 */
export function resolveAdminShopFieldCodeGroup(catalogCategory) {
  if (catalogCategory === SHOP_CATALOG_CATEGORY.ASSESSMENT) {
    return ADMIN_SHOP_FIELD_CODE_GROUP.ASSESSMENT;
  }
  return ADMIN_SHOP_FIELD_CODE_GROUP.CONSULTATION;
}

/**
 * @param {object|null|undefined} form
 * @returns {{ valid: boolean, message?: string, fieldCode?: string }}
 */
export function validateAdminShopCatalogFieldCode(form) {
  const fieldCode = toDisplayString(form?.fieldCode, '').trim();
  if (!fieldCode) {
    return { valid: false, message: ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE };
  }
  return { valid: true, fieldCode };
}

/**
 * @param {ReturnType<typeof emptyAdminShopCatalogForm>} form
 * @returns {object}
 * @throws {Error} sessionCount가 유효하지 않으면 fail-closed
 */
export function buildAdminShopCatalogUpsertBody(form) {
  const price = Number.parseInt(String(form.unitPriceMinor).replace(/\D/g, ''), 10);
  const sortOrder = Number.parseInt(String(form.sortOrder), 10);
  const sessionParsed = validateAdminShopCatalogSessionCount(form);
  if (!sessionParsed.valid) {
    throw new Error(ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE);
  }
  const fieldParsed = validateAdminShopCatalogFieldCode(form);
  if (!fieldParsed.valid) {
    throw new Error(ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE);
  }
  return {
    title: form.title.trim(),
    descriptionText: form.descriptionText.trim() || null,
    unitPriceMinor: Number.isFinite(price) ? price : 0,
    currency: (form.currency || 'KRW').trim().toUpperCase(),
    catalogCategory: form.catalogCategory || SHOP_CATALOG_CATEGORY.CONSULTATION,
    catalogVisible: Boolean(form.catalogVisible),
    active: Boolean(form.active),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    sessionCount: sessionParsed.sessionCount,
    fieldCode: fieldParsed.fieldCode
  };
}

/**
 * @param {number|string|null|undefined} sessionCount
 * @returns {string}
 */
export function formatAdminShopPackageTypeLabel(sessionCount) {
  return resolveShopPackageType(sessionCount);
}

/**
 * 패키지 요금 행 → 내용 편집 폼. 이름·단가·회기는 표시용이다.
 *
 * @param {object|null|undefined} row
 * @returns {object}
 */
export function mapAdminShopPackageFeeToForm(row) {
  if (!row || typeof row !== 'object') {
    return {
      packageCode: '',
      packageName: '',
      unitPriceMinor: null,
      sessionCount: null,
      priceReady: false,
      descriptionText: '',
      catalogVisible: false,
      sortOrder: '0',
      thumbnailUrl: '',
      skuId: null,
      catalogCategory: SHOP_CATALOG_CATEGORY.CONSULTATION,
      fieldCode: ''
    };
  }
  const categoryRaw = toDisplayString(row.catalogCategory, '').toUpperCase();
  const catalogCategory =
    categoryRaw === SHOP_CATALOG_CATEGORY.ASSESSMENT
      ? SHOP_CATALOG_CATEGORY.ASSESSMENT
      : SHOP_CATALOG_CATEGORY.CONSULTATION;
  return {
    packageCode: toDisplayString(row.packageCode, ''),
    packageName: toDisplayString(row.packageName, ''),
    unitPriceMinor: row.unitPriceMinor != null ? Number(row.unitPriceMinor) : null,
    sessionCount: row.sessionCount != null ? Number(row.sessionCount) : null,
    priceReady: row.priceReady === true,
    descriptionText: toDisplayString(row.descriptionText, ''),
    catalogVisible: row.catalogVisible === true,
    sortOrder: row.sortOrder != null ? String(row.sortOrder) : '0',
    thumbnailUrl: toDisplayString(row.thumbnailUrl, ''),
    skuId: row.skuId != null ? row.skuId : null,
    catalogCategory,
    fieldCode: toDisplayString(row.fieldCode, '')
  };
}

/**
 * 온라인 상품 내용 저장 본문. 상품명·단가·회기는 포함하지 않는다.
 * 구분과 분야 코드는 포함한다.
 *
 * @param {object} form
 * @returns {{ descriptionText: string|null, catalogVisible: boolean, sortOrder: number, catalogCategory: string, fieldCode: string }}
 * @throws {Error} 분야 코드가 없으면 fail-closed
 */
export function buildAdminShopPackageContentBody(form) {
  const fieldParsed = validateAdminShopCatalogFieldCode(form);
  if (!fieldParsed.valid) {
    throw new Error(ADMIN_SHOP_FIELD_CODE_REQUIRED_MESSAGE);
  }
  const sortOrder = Number.parseInt(String(form?.sortOrder ?? ''), 10);
  const description = String(form?.descriptionText ?? '').trim();
  const categoryRaw = toDisplayString(form?.catalogCategory, '').toUpperCase();
  const catalogCategory =
    categoryRaw === SHOP_CATALOG_CATEGORY.ASSESSMENT
      ? SHOP_CATALOG_CATEGORY.ASSESSMENT
      : SHOP_CATALOG_CATEGORY.CONSULTATION;
  return {
    descriptionText: description
      ? description.slice(0, ADMIN_SHOP_DESCRIPTION_MAX_LENGTH)
      : null,
    catalogVisible: form?.catalogVisible === true,
    sortOrder: Number.isFinite(sortOrder) && sortOrder >= 0 ? sortOrder : 0,
    catalogCategory,
    fieldCode: fieldParsed.fieldCode
  };
}
