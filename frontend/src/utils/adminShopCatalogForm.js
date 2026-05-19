/**
 * 어드민 Shop 카탈로그 SKU 폼 매핑 (목록·에디터 공유)
 *
 * @author CoreSolution
 * @since 2026-05-19
 */

import { SHOP_CATALOG_CATEGORY } from '../constants/clientShopConstants';
import { toDisplayString } from './safeDisplay';

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
  skuCode: ''
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
    thumbnailUrl: toDisplayString(row.thumbnailUrl || row.heroImageUrl, '')
  };
}

/**
 * @param {ReturnType<typeof emptyAdminShopCatalogForm>} form
 * @returns {object}
 */
export function buildAdminShopCatalogUpsertBody(form) {
  const price = Number.parseInt(String(form.unitPriceMinor).replace(/\D/g, ''), 10);
  const sortOrder = Number.parseInt(String(form.sortOrder), 10);
  return {
    title: form.title.trim(),
    descriptionText: form.descriptionText.trim() || null,
    unitPriceMinor: Number.isFinite(price) ? price : 0,
    currency: (form.currency || 'KRW').trim().toUpperCase(),
    catalogCategory: form.catalogCategory || SHOP_CATALOG_CATEGORY.CONSULTATION,
    catalogVisible: Boolean(form.catalogVisible),
    active: Boolean(form.active),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0
  };
}
