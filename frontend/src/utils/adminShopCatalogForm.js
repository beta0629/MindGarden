/**
 * 어드민 Shop 카탈로그 SKU 폼 매핑 (목록·에디터 공유)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import { ADMIN_SHOP_SKU_SESSION_COUNT_REQUIRED_MESSAGE } from '../constants/adminShopCatalog';
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
  sessionCount: String(SHOP_SESSION_COUNT_MIN)
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
    sessionCount: String(normalizeShopSessionCount(row.sessionCount))
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
  return {
    title: form.title.trim(),
    descriptionText: form.descriptionText.trim() || null,
    unitPriceMinor: Number.isFinite(price) ? price : 0,
    currency: (form.currency || 'KRW').trim().toUpperCase(),
    catalogCategory: form.catalogCategory || SHOP_CATALOG_CATEGORY.CONSULTATION,
    catalogVisible: Boolean(form.catalogVisible),
    active: Boolean(form.active),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    sessionCount: sessionParsed.sessionCount
  };
}

/**
 * @param {number|string|null|undefined} sessionCount
 * @returns {string}
 */
export function formatAdminShopPackageTypeLabel(sessionCount) {
  return resolveShopPackageType(sessionCount);
}
